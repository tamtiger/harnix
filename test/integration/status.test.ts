import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "../../src/cli-program.js";
import { initializeProject } from "../../src/commands/init.js";
import { saveTask, setActiveTask, type TaskRecordV1, type TaskRecordV2 } from "../../src/core/tasks/task.js";
import { computeVerificationInputSnapshot, persistNewVerificationInputSnapshots } from "../../src/core/verification/input-freshness.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-status-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe.sequential("status command", () => {
  it("returns a bounded no-active-task result without changing project files", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "status"])).resolves.toBe(0);

    const output = stdout.mock.calls.map((call) => String(call[0])).join("");
    expect(JSON.parse(output)).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      activeTask: null,
      nextAction: {
        code: "no-active-task",
        message: "No active task; classify the next request.",
      },
      attention: [],
    });
    expect(Buffer.byteLength(output, "utf8")).toBeLessThan(2_048);
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("summarizes an active task from a nested directory without exposing task prose", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const task = planningTask();
    await saveTask(join(root, ".harnix"), task);
    await setActiveTask(join(root, ".harnix"), task.id);
    const nested = join(root, "packages", "app");
    await mkdir(nested, { recursive: true });
    process.chdir(nested);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "status"])).resolves.toBe(0);

    const output = stdout.mock.calls.map((call) => String(call[0])).join("");
    expect(JSON.parse(output)).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      activeTask: {
        id: task.id,
        mode: "lite",
        status: "planning",
        checkpoint: "planning",
        progress: {
          acceptance: { met: 0, waived: 0, pending: 1, total: 1 },
          requiredChecks: { passed: 0, failed: 0, stale: 0, pending: 1, total: 1 },
        },
        context: { state: "not-recorded", changeCount: 0, selectionChangeCount: 0 },
      },
      nextAction: {
        code: "complete-planning",
        message: "Complete planning and pass the ready gate.",
      },
      attention: [],
    });
    expect(output).not.toContain("PRIVATE_TITLE_CANARY");
    expect(output).not.toContain("PRIVATE_GOAL_CANARY");
    expect(output).not.toContain("PRIVATE_CHECK_CANARY");
    expect(Buffer.byteLength(output, "utf8")).toBeLessThan(2_048);
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("classifies required-check evidence and orders actionable attention", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const now = Date.now();
    const task = verificationTask(now);
    await saveTask(join(root, ".harnix"), task);
    await setActiveTask(join(root, ".harnix"), task.id);
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "status"])).resolves.toBe(0);

    const result = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      activeTask: { progress: { requiredChecks: unknown } };
      nextAction: { code: string };
      attention: unknown[];
    };
    expect(result.activeTask.progress.requiredChecks).toEqual({
      passed: 1,
      failed: 1,
      stale: 1,
      pending: 1,
      total: 4,
    });
    expect(result.nextAction.code).toBe("run-verification");
    expect(result.attention).toEqual([
      { code: "required-check-failed", count: 1 },
      { code: "required-check-stale", count: 1 },
    ]);
  });

  it("uses persisted append order for evidence ties and treats future passes as stale", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const now = Date.parse("2026-08-26T01:00:00.000Z");
    const task = verificationTask(now);
    task.id = "20260826-000004-status-evidence-order";
    task.validationPlan = ["tie", "future"].map((id) => ({
      id,
      description: `${id} check`,
      scope: "focused" as const,
      required: true,
    }));
    task.evidence = [
      { id: "e-z", checkId: "tie", recordedAt: new Date(now - 1_000).toISOString(), result: "pass", summary: "first", artifactPaths: [] },
      { id: "e-a", checkId: "tie", recordedAt: new Date(now - 1_000).toISOString(), result: "fail", summary: "appended winner", artifactPaths: [] },
      { id: "e-future", checkId: "future", recordedAt: new Date(now + 1_000).toISOString(), result: "pass", summary: "future", artifactPaths: [] },
    ];
    await saveTask(join(root, ".harnix"), task);
    await setActiveTask(join(root, ".harnix"), task.id);
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "status"], { statusClock: () => now })).resolves.toBe(0);

    const result = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      activeTask: { progress: { requiredChecks: unknown } };
      attention: unknown[];
    };
    expect(result.activeTask.progress.requiredChecks).toEqual({ passed: 0, failed: 1, stale: 1, pending: 0, total: 2 });
    expect(result.attention).toEqual([
      { code: "required-check-failed", count: 1 },
      { code: "required-check-stale", count: 1 },
    ]);
  });

  it("requires a matching v2 sidecar and current input digest for a passed check", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const now = Date.parse("2026-08-26T01:00:00.000Z");
    const base = digestTask(now);
    const snapshot = await computeVerificationInputSnapshot(root, base, "gate");
    const task: TaskRecordV2 = {
      ...base,
      evidence: [{
        id: "e-current",
        checkId: "gate",
        recordedAt: new Date(now - 1_000).toISOString(),
        result: "pass",
        summary: "passed",
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

    await expect(runCli(["node", "harnix", "status"], { statusClock: () => now })).resolves.toBe(0);
    let result = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      activeTask: { progress: { requiredChecks: unknown } };
      nextAction: { code: string };
      attention: unknown[];
    };
    expect(result.activeTask.progress.requiredChecks).toEqual({ passed: 1, failed: 0, stale: 0, pending: 0, total: 1 });
    expect(result.nextAction.code).toBe("finish-task");
    expect(result.attention).toEqual([]);

    await writeFile(join(root, "input.ts"), "export const value = 2;\n");
    const beforeStaleStatus = await snapshotTree(root);
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "status"], { statusClock: () => now })).resolves.toBe(0);
    result = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as typeof result;
    expect(result.activeTask.progress.requiredChecks).toEqual({ passed: 0, failed: 0, stale: 1, pending: 0, total: 1 });
    expect(result.nextAction.code).toBe("run-verification");
    expect(result.attention).toEqual([{ code: "required-check-stale", count: 1 }]);
    await expect(snapshotTree(root)).resolves.toEqual(beforeStaleStatus);
  });
});

function planningTask(): TaskRecordV2 {
  const timestamp = "2026-08-26T00:00:00.000Z";
  return {
    generator: "harnix",
    schemaVersion: 2,
    id: "20260826-000000-status-fixture",
    title: "PRIVATE_TITLE_CANARY",
    mode: "lite",
    status: "planning",
    checkpoint: "planning",
    goal: "PRIVATE_GOAL_CANARY",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "PRIVATE_CRITERION_CANARY", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [{
      id: "gate",
      description: "PRIVATE_CHECK_CANARY",
      scope: "focused",
      required: true,
      criterionIds: ["criterion"],
      inputs: ["@task-contract"],
    }],
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function verificationTask(now: number): TaskRecordV1 {
  const current = new Date(now - 1_000).toISOString();
  const stale = new Date(now - 2 * 60 * 60 * 1_000).toISOString();
  return {
    generator: "harnix",
    schemaVersion: 1,
    id: "20260826-000001-status-evidence",
    title: "Status evidence",
    mode: "lite",
    status: "verifying",
    checkpoint: "verifying",
    goal: "Summarize evidence",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "done", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: ["failed", "passed", "pending", "stale"].map((id) => ({
      id,
      description: `${id} check`,
      scope: "focused" as const,
      required: true,
    })),
    evidence: [
      { id: "e-failed", checkId: "failed", recordedAt: current, result: "fail", summary: "failed", artifactPaths: [] },
      { id: "e-passed", checkId: "passed", recordedAt: current, result: "pass", summary: "passed", artifactPaths: [] },
      { id: "e-pending", checkId: "pending", recordedAt: current, result: "skipped", summary: "skipped", artifactPaths: [] },
      { id: "e-stale", checkId: "stale", recordedAt: stale, result: "pass", summary: "old pass", artifactPaths: [] },
    ],
    createdAt: stale,
    updatedAt: current,
  };
}

function digestTask(now: number): TaskRecordV2 {
  const timestamp = new Date(now - 2_000).toISOString();
  return {
    generator: "harnix",
    schemaVersion: 2,
    id: "20260826-000002-status-digest",
    title: "Digest status",
    mode: "lite",
    status: "verifying",
    checkpoint: "verifying",
    goal: "Check current inputs",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "done", status: "pending", evidenceIds: [] }],
    relevantPaths: ["input.ts"],
    relevantSpecs: [],
    validationPlan: [{
      id: "gate",
      description: "verify input",
      scope: "focused",
      required: true,
      criterionIds: ["criterion"],
      inputs: ["@task-contract", "input.ts"],
    }],
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
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
