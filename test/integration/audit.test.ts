import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "../../src/cli-program.js";
import { initializeProject } from "../../src/commands/init.js";
import { saveTask, saveTaskWithArtifacts, setActiveTask, type TaskRecordV2 } from "../../src/core/tasks/task.js";
import { computeVerificationInputSnapshot, persistNewVerificationInputSnapshots } from "../../src/core/verification/input-freshness.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-audit-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe.sequential("audit command", () => {
  it("returns no-active success without changing project files", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "audit"])).resolves.toBe(0);

    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toEqual({ generator: "harnix", schemaVersion: 1, activeTask: null });
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("audits Full readiness and completion blockers without exposing task prose", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const task = fullTask();
    const harnixRoot = join(root, ".harnix");
    await saveTaskWithArtifacts(harnixRoot, task, {
      prd: "# PRD\n### AC `criterion`\nDone.\n",
      plan: "# Plan\n- [ ] `SLICE` — implement\n### Slice `SLICE`\nCriteria: `criterion`\nChecks: `gate`\nPaths: `src/a.ts`\n",
    });
    await setActiveTask(harnixRoot, task.id);
    const nested = join(root, "packages", "app");
    await mkdir(nested, { recursive: true });
    process.chdir(nested);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "audit"])).resolves.toBe(0);

    const output = stdout.mock.calls.map((call) => String(call[0])).join("");
    expect(JSON.parse(output)).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      activeTask: {
        id: task.id,
        mode: "full",
        status: "planning",
        checkpoint: "planning",
        readiness: { status: "pass", diagnostics: [] },
        completion: {
          status: "fail",
          criteria: { met: 0, waived: 0, pending: 1, total: 1, pendingIds: ["criterion"] },
          requiredChecks: { passed: 0, failed: 0, stale: 0, pending: 1, total: 1, failedIds: [], staleIds: [], pendingIds: ["gate"] },
        },
      },
    });
    for (const canary of ["PRIVATE_TITLE_CANARY", "PRIVATE_GOAL_CANARY", "PRIVATE_CHECK_CANARY", "PRIVATE_COMMAND_CANARY"]) expect(output).not.toContain(canary);
    expect(output).not.toContain(root);
    expect(Buffer.byteLength(output, "utf8")).toBeLessThan(4_096);
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("uses current v2 input freshness without executing or mutating checks", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const current = Date.parse("2026-08-26T01:00:00.000Z");
    const base = digestTask();
    const snapshot = await computeVerificationInputSnapshot(root, base, "gate");
    const task: TaskRecordV2 = {
      ...base,
      acceptanceCriteria: [{ ...base.acceptanceCriteria[0]!, status: "met", evidenceIds: ["e-pass"] }],
      evidence: [{
        id: "e-pass",
        checkId: "gate",
        recordedAt: "2026-08-26T00:59:00.000Z",
        result: "pass",
        exitCode: 0,
        summary: "PRIVATE_EVIDENCE_CANARY",
        artifactPaths: [],
        inputDigest: snapshot.inputDigest,
      }],
    };
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, task);
    await persistNewVerificationInputSnapshots(root, harnixRoot, [], task);
    await setActiveTask(harnixRoot, task.id);
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "audit"], { statusClock: () => current })).resolves.toBe(0);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({
      activeTask: { completion: { status: "pass", criteria: { met: 1, pending: 0 }, requiredChecks: { passed: 1, stale: 0 } } },
    });

    await writeFile(join(root, "input.ts"), "export const value = 2;\n");
    const beforeStaleAudit = await snapshotTree(root);
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "audit"], { statusClock: () => current })).resolves.toBe(0);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({
      activeTask: {
        completion: {
          status: "fail",
          criteria: { met: 0, pending: 1, pendingIds: ["criterion"] },
          requiredChecks: { passed: 0, stale: 1, staleIds: ["gate"] },
        },
      },
    });
    await expect(snapshotTree(root)).resolves.toEqual(beforeStaleAudit);
  });
});

function fullTask(): TaskRecordV2 {
  return {
    generator: "harnix",
    schemaVersion: 2,
    id: "20260826-120000-full-audit",
    title: "PRIVATE_TITLE_CANARY",
    mode: "full",
    status: "planning",
    checkpoint: "planning",
    goal: "PRIVATE_GOAL_CANARY",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "PRIVATE_CRITERION_CANARY", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [{ id: "gate", description: "PRIVATE_CHECK_CANARY", command: "PRIVATE_COMMAND_CANARY", scope: "focused", required: true, criterionIds: ["criterion"], inputs: ["@task-contract", "src/**/*.ts"] }],
    evidence: [],
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:30:00.000Z",
  };
}

function digestTask(): TaskRecordV2 {
  return {
    ...fullTask(),
    id: "20260826-120001-digest-audit",
    mode: "lite",
    status: "verifying",
    checkpoint: "verifying",
    relevantPaths: ["input.ts"],
    validationPlan: [{ id: "gate", description: "verify input", command: "pnpm test", scope: "focused", required: true, criterionIds: ["criterion"], inputs: ["@task-contract", "input.ts"] }],
  };
}

async function snapshotTree(root: string): Promise<Array<{ path: string; sha256: string }>> {
  const files = await walk(root);
  return Promise.all(files.map(async (path) => ({
    path: relative(root, path).replaceAll("\\", "/"),
    sha256: createHash("sha256").update(await readFile(path)).digest("hex"),
  })));
}

async function walk(root: string): Promise<string[]> {
  const paths: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(path));
    else if (entry.isFile()) paths.push(path);
  }
  return paths.sort();
}
