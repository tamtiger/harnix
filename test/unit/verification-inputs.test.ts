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
    expect(first.inputDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(first.entries.map((entry) => entry.path)).toEqual([
      `.harnix/tasks/${task.id}/plan.md`,
      `.harnix/tasks/${task.id}/prd.md`,
      "src/a.ts",
      "src/b.ts",
    ]);
    expect(JSON.stringify(first)).not.toContain(root);
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
