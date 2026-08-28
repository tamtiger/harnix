import { createHash } from "node:crypto";
import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  assertVerificationInputsFresh,
  compareVerificationInputSnapshots,
  computeVerificationInputSnapshot,
  loadVerificationInputSidecar,
  persistNewVerificationInputSnapshots,
} from "../../src/core/verification/input-freshness.js";
import type { TaskRecordV2 } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-inputs-");

describe("verification input freshness", () => {
  it("hashes canonical task contract, Full artifacts, and sorted repository inputs deterministically", async () => {
    const root = await fixtureRepository();
    const task = taskFixture();

    const first = await computeVerificationInputSnapshot(root, task, "check");
    const second = await computeVerificationInputSnapshot(root, task, "check");

    expect(second).toEqual(first);
    expect(first.schemaVersion).toBe(2);
    expect(first.inputDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(first.entries.map((entry) => entry.path)).toEqual([
      `.harnix/tasks/${task.id}/plan.md`,
      `.harnix/tasks/${task.id}/prd.md`,
      "src/a.ts",
      "src/b.ts",
    ]);
    expect(JSON.stringify(first)).not.toContain(root);
  });

  it("keeps planning bookkeeping current but invalidates semantic artifact changes", async () => {
    const root = await fixtureRepository();
    const task = taskFixture();
    const planPath = join(root, ".harnix", "tasks", task.id, "plan.md");
    const prdPath = join(root, ".harnix", "tasks", task.id, "prd.md");
    await writeFile(planPath, [
      "# Plan",
      "- [ ] `SLICE` — implement",
      "Meaningful contract text.",
      "<!-- harnix:execution-notes:begin -->",
      "slice:SLICE=pending",
      "<!-- harnix:execution-notes:end -->",
      "",
    ].join("\n"));
    await writeFile(prdPath, "# PRD  \nMeaningful requirement.\n");
    const baseline = await computeVerificationInputSnapshot(root, task, "check");

    await writeFile(planPath, [
      "# Plan   ",
      "- [x] `SLICE` — implement",
      "Meaningful contract text.",
      "<!-- harnix:execution-notes:begin -->",
      "slice:SLICE=passed@2026-08-13T00:01:00Z",
      "<!-- harnix:execution-notes:end -->",
      "",
    ].join("\r\n"));
    await writeFile(prdPath, "# PRD\r\nMeaningful requirement.\r\n");
    const bookkeeping = await computeVerificationInputSnapshot(root, task, "check");
    expect(bookkeeping.inputDigest).toBe(baseline.inputDigest);

    await writeFile(prdPath, "# PRD\nMeaningful requirement.  \n");
    const semanticWhitespace = await computeVerificationInputSnapshot(root, task, "check");
    expect(semanticWhitespace.inputDigest).not.toBe(baseline.inputDigest);
    await writeFile(prdPath, "# PRD\nMeaningful requirement.\n");

    await writeFile(planPath, "# Plan\n- [x] `SLICE` — implement\nChanged semantic contract.\n");
    const semantic = await computeVerificationInputSnapshot(root, task, "check");
    expect(semantic.inputDigest).not.toBe(baseline.inputDigest);
    expect(compareVerificationInputSnapshots(baseline, semantic)).toEqual([{
      path: `.harnix/tasks/${task.id}/plan.md`,
      kind: "changed",
    }]);
  });

  it("fails closed on malformed planning execution-note markers", async () => {
    const root = await fixtureRepository();
    const task = taskFixture();
    await writeFile(join(root, ".harnix", "tasks", task.id, "plan.md"), "# Plan\n<!-- harnix:execution-notes:begin -->\ncheck:check=pending\n");

    await expect(computeVerificationInputSnapshot(root, task, "check")).rejects.toThrow(/execution-note marker/iu);
  });

  it("bounds execution notes and rejects contract syntax inside the excluded region", async () => {
    const root = await fixtureRepository();
    const task = taskFixture();
    const planPath = join(root, ".harnix", "tasks", task.id, "plan.md");
    const bounded = ["# Plan", "<!-- harnix:execution-notes:begin -->", ...Array.from({ length: 101 }, (_, index) => `check:note-${index}=pending`), "<!-- harnix:execution-notes:end -->", ""].join("\n");
    await writeFile(planPath, bounded);
    await expect(computeVerificationInputSnapshot(root, task, "check")).rejects.toThrow(/too large/iu);

    await writeFile(planPath, "# Plan\n<!-- harnix:execution-notes:begin -->\nCriteria: `a`\n<!-- harnix:execution-notes:end -->\n");
    await expect(computeVerificationInputSnapshot(root, task, "check")).rejects.toThrow(/contract syntax/iu);

    await writeFile(planPath, "# Plan\n<!-- harnix:execution-notes:begin -->\nChange the API contract after verification.\n<!-- harnix:execution-notes:end -->\n");
    await expect(computeVerificationInputSnapshot(root, task, "check")).rejects.toThrow(/inert.*status grammar/iu);
  });

  it("deduplicates the active task record through @task-contract while raw-hashing other task records", async () => {
    const root = await fixtureRepository();
    const task = taskFixture();
    const activePath = `.harnix/tasks/${task.id}/task.json`;
    const historicalId = "20260813-120000-historical-task";
    const historicalPath = `.harnix/tasks/${historicalId}/task.json`;
    const historicalContent = "{\"historical\":true}\n";
    const withTaskRecords = {
      ...task,
      validationPlan: [{ ...task.validationPlan[0]!, inputs: [".harnix/tasks/*/task.json", "@task-contract"] }],
    };
    await mkdir(join(root, ".harnix", "tasks", historicalId), { recursive: true });
    await writeFile(join(root, activePath), `${JSON.stringify(withTaskRecords, null, 2)}\n`);
    await writeFile(join(root, historicalPath), historicalContent);

    const before = await computeVerificationInputSnapshot(root, withTaskRecords, "check");
    expect(before.entries.map((entry) => entry.path)).not.toContain(activePath);
    expect(before.entries).toContainEqual({
      normalizer: "raw-v1",
      path: historicalPath,
      sha256: createHash("sha256").update(historicalContent, "utf8").digest("hex"),
    });

    const withPassEvidence: TaskRecordV2 = {
      ...withTaskRecords,
      status: "verifying",
      checkpoint: "verifying",
      acceptanceCriteria: [{ ...withTaskRecords.acceptanceCriteria[0]!, status: "met", evidenceIds: ["e-pass"] }],
      evidence: [{
        id: "e-pass",
        checkId: "check",
        recordedAt: "2026-08-14T00:01:00.000Z",
        result: "pass",
        exitCode: 0,
        summary: "pass",
        artifactPaths: [],
        inputDigest: before.inputDigest,
      }],
      updatedAt: "2026-08-14T00:01:00.000Z",
    };
    await writeFile(join(root, activePath), `${JSON.stringify(withPassEvidence, null, 2)}\n`);

    const afterEvidenceSave = await computeVerificationInputSnapshot(root, withPassEvidence, "check");
    expect(afterEvidenceSave).toEqual(before);

    await writeFile(join(root, historicalPath), "{\"historical\":false}\n");
    const afterHistoricalChange = await computeVerificationInputSnapshot(root, withPassEvidence, "check");
    expect(afterHistoricalChange.inputDigest).not.toBe(afterEvidenceSave.inputDigest);
    expect(compareVerificationInputSnapshots(afterEvidenceSave, afterHistoricalChange)).toEqual([{ path: historicalPath, kind: "changed" }]);
  });

  it("excludes only the active verification sidecar so a broad glob converges after pass persistence", async () => {
    const root = await fixtureRepository();
    const harnixRoot = join(root, ".harnix");
    const task = taskFixture();
    const activeSidecar = `.harnix/tasks/${task.id}/verification-inputs.json`;
    const historicalId = "20260813-120000-historical-task";
    const historicalSidecar = `.harnix/tasks/${historicalId}/verification-inputs.json`;
    await mkdir(join(root, ".harnix", "tasks", historicalId), { recursive: true });
    await writeFile(join(root, historicalSidecar), "{\"historical\":true}\n");
    const broad: TaskRecordV2 = {
      ...task,
      validationPlan: [{ ...task.validationPlan[0]!, inputs: ["**/*", "@task-contract"] }],
    };
    const snapshot = await computeVerificationInputSnapshot(root, broad, "check");
    expect(snapshot.entries.map((entry) => entry.path)).not.toContain(activeSidecar);
    expect(snapshot.entries.map((entry) => entry.path)).toContain(historicalSidecar);
    const pass = {
      id: "broad-pass",
      checkId: "check",
      recordedAt: "2026-08-14T00:01:00.000Z",
      result: "pass" as const,
      exitCode: 0,
      summary: "broad pass",
      artifactPaths: [],
      inputDigest: snapshot.inputDigest,
    };
    const passed: TaskRecordV2 = { ...broad, evidence: [pass] };

    await persistNewVerificationInputSnapshots(root, harnixRoot, [], passed);
    await expect(assertVerificationInputsFresh(root, harnixRoot, passed)).resolves.toBeUndefined();
    const afterSave = await computeVerificationInputSnapshot(root, passed, "check");
    expect(afterSave.inputDigest).toBe(snapshot.inputDigest);
    expect(afterSave.entries.map((entry) => entry.path)).not.toContain(activeSidecar);

    await writeFile(join(root, historicalSidecar), "{\"historical\":false}\n");
    await expect(assertVerificationInputsFresh(root, harnixRoot, passed)).rejects.toThrow(new RegExp(`changed:${historicalSidecar.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}`, "u"));
  });

  it("detects task-contract drift without treating the active task record as a raw input", async () => {
    const root = await fixtureRepository();
    const task = taskFixture();
    const activePath = `.harnix/tasks/${task.id}/task.json`;
    const withActiveRecord = {
      ...task,
      validationPlan: [{ ...task.validationPlan[0]!, inputs: [activePath, "@task-contract"] }],
    };
    await writeFile(join(root, activePath), `${JSON.stringify(withActiveRecord, null, 2)}\n`);
    const previous = await computeVerificationInputSnapshot(root, withActiveRecord, "check");

    const changedContract = {
      ...withActiveRecord,
      acceptanceCriteria: [{ ...withActiveRecord.acceptanceCriteria[0]!, text: "Changed acceptance contract" }],
    };
    await writeFile(join(root, activePath), `${JSON.stringify(changedContract, null, 2)}\n`);
    const changed = await computeVerificationInputSnapshot(root, changedContract, "check");

    expect(previous.entries.map((entry) => entry.path)).not.toContain(activePath);
    expect(changed.taskContractHash).not.toBe(previous.taskContractHash);
    expect(changed.inputDigest).not.toBe(previous.inputDigest);
    expect(compareVerificationInputSnapshots(previous, changed)).toEqual([]);
  });

  it("changes the digest and reports only safe relative changed or missing paths", async () => {
    const root = await fixtureRepository();
    const task = taskFixture();
    const previous = await computeVerificationInputSnapshot(root, task, "check");
    await writeFile(join(root, "src", "a.ts"), "export const a = 2;\n");
    const changed = await computeVerificationInputSnapshot(root, task, "check");
    expect(changed.inputDigest).not.toBe(previous.inputDigest);
    expect(compareVerificationInputSnapshots(previous, changed)).toEqual([{ path: "src/a.ts", kind: "changed" }]);

    const withoutB = { ...task, validationPlan: [{ ...task.validationPlan[0]!, inputs: ["@task-contract", "src/a.ts"] }] };
    const missing = await computeVerificationInputSnapshot(root, withoutB, "check");
    expect(compareVerificationInputSnapshots(previous, missing)).toContainEqual({ path: "src/b.ts", kind: "missing" });
  });

  it("changes the digest when the canonical task contract changes", async () => {
    const root = await fixtureRepository();
    const task = taskFixture();
    const previous = await computeVerificationInputSnapshot(root, task, "check");
    const changed = await computeVerificationInputSnapshot(root, { ...task, goal: "A changed non-contract field" }, "check");
    const changedCriterion = await computeVerificationInputSnapshot(root, {
      ...task,
      acceptanceCriteria: [{ ...task.acceptanceCriteria[0]!, text: "changed contract" }],
    }, "check");

    expect(changed.inputDigest).toBe(previous.inputDigest);
    expect(changedCriterion.inputDigest).not.toBe(previous.inputDigest);
  });

  it("fails closed when a declared repository pattern matches no files", async () => {
    const root = await fixtureRepository();
    const task = taskFixture();
    const unmatched = { ...task, validationPlan: [{ ...task.validationPlan[0]!, inputs: ["@task-contract", "missing/**/*.ts"] }] };

    await expect(computeVerificationInputSnapshot(root, unmatched, "check")).rejects.toThrow(/matched no files/iu);
  });

  it("does not follow a repository symlink to hash files outside the project", async () => {
    const root = await fixtureRepository();
    const external = await temporaryRepository();
    await writeFile(join(external, "secret.ts"), "external secret body\n");
    await symlink(external, join(root, "linked"), process.platform === "win32" ? "junction" : "dir");
    const task = taskFixture();
    const linked = { ...task, validationPlan: [{ ...task.validationPlan[0]!, inputs: ["@task-contract", "linked/**/*.ts"] }] };

    await expect(computeVerificationInputSnapshot(root, linked, "check")).rejects.toThrow(/matched no files|missing or unreadable: linked\/secret\.ts/iu);
  });

  it("uses append order as the deterministic tie-break for equal evidence timestamps", async () => {
    const root = await fixtureRepository();
    const harnixRoot = join(root, ".harnix");
    const task = taskFixture();
    const first = await computeVerificationInputSnapshot(root, task, "check");
    const recordedAt = "2026-08-14T00:01:00.000Z";
    const evidenceOne = { id: "e1", checkId: "check", recordedAt, result: "pass" as const, exitCode: 0, summary: "first", artifactPaths: [], inputDigest: first.inputDigest };
    const firstTask: TaskRecordV2 = { ...task, evidence: [evidenceOne] };
    await persistNewVerificationInputSnapshots(root, harnixRoot, [], firstTask);
    await writeFile(join(root, "src", "a.ts"), "export const a = 2;\n");
    const second = await computeVerificationInputSnapshot(root, task, "check");
    const evidenceTwo = { ...evidenceOne, id: "e2", summary: "second", inputDigest: second.inputDigest };
    const secondTask: TaskRecordV2 = { ...task, evidence: [evidenceOne, evidenceTwo] };
    await persistNewVerificationInputSnapshots(root, harnixRoot, firstTask.evidence, secondTask);

    await expect(assertVerificationInputsFresh(root, harnixRoot, secondTask)).resolves.toBeUndefined();
  });

  it("keeps historical snapshot v1 raw semantics while new snapshots use v2", async () => {
    const root = await fixtureRepository();
    const harnixRoot = join(root, ".harnix");
    const task = taskFixture();
    const legacy = await computeVerificationInputSnapshot(root, task, "check", { schemaVersion: 1 });
    expect(legacy.schemaVersion).toBe(1);
    expect(legacy.entries.every((entry) => !("normalizer" in entry))).toBe(true);
    const evidence = { id: "legacy-pass", checkId: "check", recordedAt: "2026-08-14T00:01:00.000Z", result: "pass" as const, exitCode: 0, summary: "legacy", artifactPaths: [], inputDigest: legacy.inputDigest };
    const withLegacyEvidence: TaskRecordV2 = { ...task, evidence: [evidence] };
    await writeFile(join(harnixRoot, "tasks", task.id, "verification-inputs.json"), `${JSON.stringify({
      generator: "harnix",
      schemaVersion: 1,
      taskId: task.id,
      snapshots: [{ evidenceId: evidence.id, ...legacy }],
    })}\n`);

    await expect(assertVerificationInputsFresh(root, harnixRoot, withLegacyEvidence)).resolves.toBeUndefined();
    await writeFile(join(root, ".harnix", "tasks", task.id, "plan.md"), "# Plan\nbookkeeping changed raw bytes\n");
    await expect(assertVerificationInputsFresh(root, harnixRoot, withLegacyEvidence)).rejects.toThrow(/stale/iu);
  });

  it("fails closed on duplicate evidence keys in a modified sidecar", async () => {
    const root = await fixtureRepository();
    const harnixRoot = join(root, ".harnix");
    const task = taskFixture();
    const snapshot = await computeVerificationInputSnapshot(root, task, "check");
    const stored = { evidenceId: "e", ...snapshot };
    await writeFile(join(harnixRoot, "tasks", task.id, "verification-inputs.json"), `${JSON.stringify({ generator: "harnix", schemaVersion: 1, taskId: task.id, snapshots: [stored, stored] })}\n`);

    await expect(loadVerificationInputSidecar(harnixRoot, task.id)).rejects.toThrow(/invalid verification input sidecar/iu);
  });
});

async function fixtureRepository(): Promise<string> {
  const root = await temporaryRepository();
  const task = taskFixture();
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, ".harnix", "tasks", task.id), { recursive: true });
  await writeFile(join(root, "src", "b.ts"), "export const b = 1;\n");
  await writeFile(join(root, "src", "a.ts"), "export const a = 1;\n");
  await writeFile(join(root, ".harnix", "tasks", task.id, "prd.md"), "# PRD\n");
  await writeFile(join(root, ".harnix", "tasks", task.id, "plan.md"), "# Plan\n");
  return root;
}

function taskFixture(): TaskRecordV2 {
  const timestamp = "2026-08-14T00:00:00.000Z";
  return {
    generator: "harnix",
    schemaVersion: 2,
    id: "20260814-120000-input-freshness",
    title: "Input freshness",
    mode: "full",
    status: "in_progress",
    checkpoint: "implementing",
    goal: "test",
    nonGoals: [],
    acceptanceCriteria: [{ id: "a", text: "Snapshot is fresh", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [{ id: "check", description: "Run source tests", command: "pnpm test", scope: "full", required: true, criterionIds: ["a"], inputs: ["@task-contract", "src/**/*.ts"] }],
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
