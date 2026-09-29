import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import {
  saveTask,
  setActiveTask,
  type TaskRecordV1,
  type TaskRecordV2,
  type TaskRecordV3,
} from "src/core/tasks/task.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { buildTaskV1 } from "test/support/builders.js";
import {
  buildGatedTask,
  buildLegacyEvidence,
  buildLegacyV2GatedTask,
  snapshotTree,
} from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-status-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe.sequential("status command", () => {
  it("should_reject_the_removed_human_flag_on_status_and_status_explain_without_writing", async () => {
    // `--human` was removed: task review happens by opening the task's
    // generated `review.md`, not by running a CLI summary flag. This guards
    // against silently reintroducing a half-wired flag on status (which now
    // subsumes the former audit/checks projections via --explain).
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "status", "--human"])).resolves.toBe(2);
    expect(stderr.mock.calls.map((call) => String(call[0])).join("")).toContain("unknown option");
    stderr.mockClear();
    await expect(runCli(["node", "harnix", "status", "--explain", "--human"])).resolves.toBe(2);
    expect(stderr.mock.calls.map((call) => String(call[0])).join("")).toContain("unknown option");
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "status"])).resolves.toBe(0);
    const json = stdout.mock.calls.map((call) => String(call[0])).join("");

    expect(JSON.parse(json)).toMatchObject({ generator: "harnix", activeTask: null });
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

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
    // A legacy v1 pass cannot be re-proven under the v3 contract, so it is stale until migration.
    expect(result.activeTask.progress.requiredChecks).toEqual({
      passed: 0,
      failed: 1,
      stale: 2,
      pending: 1,
      total: 4,
    });
    expect(result.nextAction.code).toBe("run-verification");
    expect(result.attention).toEqual([
      { code: "required-check-failed", count: 1 },
      { code: "required-check-stale", count: 2 },
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
      {
        id: "e-z",
        checkId: "tie",
        recordedAt: new Date(now - 1_000).toISOString(),
        result: "pass",
        summary: "first",
        artifactPaths: [],
      },
      {
        id: "e-a",
        checkId: "tie",
        recordedAt: new Date(now - 1_000).toISOString(),
        result: "fail",
        summary: "appended winner",
        artifactPaths: [],
      },
      {
        id: "e-future",
        checkId: "future",
        recordedAt: new Date(now + 1_000).toISOString(),
        result: "pass",
        summary: "future",
        artifactPaths: [],
      },
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

  it("requires the inline v3 digest to match the current inputs for a passed check", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const now = Date.parse("2026-08-26T01:00:00.000Z");
    const base = digestTask(now);
    const snapshot = await computeInputDigest(root, base, "gate");
    const task: TaskRecordV3 = {
      ...base,
      evidence: [
        {
          id: "e-current",
          checkId: "gate",
          recordedAt: new Date(now - 1_000).toISOString(),
          result: "pass",
          exitCode: 0,
          summary: "passed",
          artifactPaths: [],
          inputDigest: snapshot.inputDigest,
        },
      ],
    };
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, task);
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
  return buildLegacyV2GatedTask({
    id: "20260826-000000-status-fixture",
    title: "PRIVATE_TITLE_CANARY",
    status: "planning",
    checkpoint: "planning",
    goal: "PRIVATE_GOAL_CANARY",
    criterion: { text: "PRIVATE_CRITERION_CANARY" },
    gate: { description: "PRIVATE_CHECK_CANARY" },
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
  });
}

function verificationTask(now: number): TaskRecordV1 {
  const current = new Date(now - 1_000).toISOString();
  const stale = new Date(now - 2 * 60 * 60 * 1_000).toISOString();
  const evidence = (id: string, result: "pass" | "fail" | "skipped", recordedAt: string, summary: string) =>
    buildLegacyEvidence({ id: `e-${id}`, checkId: id, recordedAt, result, summary });
  return buildTaskV1({
    id: "20260826-000001-status-evidence",
    title: "Status evidence",
    status: "verifying",
    checkpoint: "verifying",
    goal: "Summarize evidence",
    validationPlan: ["failed", "passed", "pending", "stale"].map((id) => ({
      id,
      description: `${id} check`,
      scope: "focused" as const,
      required: true,
    })),
    evidence: [
      evidence("failed", "fail", current, "failed"),
      evidence("passed", "pass", current, "passed"),
      evidence("pending", "skipped", current, "skipped"),
      evidence("stale", "pass", stale, "old pass"),
    ],
    createdAt: stale,
    updatedAt: current,
  });
}

function digestTask(now: number): TaskRecordV3 {
  const timestamp = new Date(now - 2_000).toISOString();
  return buildGatedTask({
    id: "20260826-000002-status-digest",
    title: "Digest status",
    status: "verifying",
    checkpoint: "verifying",
    goal: "Check current inputs",
    relevantPaths: ["input.ts"],
    criterion: { text: "done" },
    gate: { description: "verify input", command: "pnpm test", inputs: ["input.ts"] },
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}
