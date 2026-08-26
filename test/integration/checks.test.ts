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
const temporaryRepository = useTemporaryRepositories("harnix-checks-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe.sequential("checks command", () => {
  it("classifies and sorts required v1 checks without exposing private check or evidence prose", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const now = Date.parse("2026-08-26T01:00:00.000Z");
    const task = v1Task();
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, task);
    await setActiveTask(harnixRoot, task.id);
    process.chdir(root);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "checks", "--limit", "50"], { statusClock: () => now })).resolves.toBe(0);

    const raw = output(stdout.mock.calls);
    const result = JSON.parse(raw) as { activeTask: { summary: unknown; checks: Array<{ id: string; state: string; reasonCodes: string[]; changes: unknown[] }> } };
    expect(result).toMatchObject({ generator: "harnix", schemaVersion: 1, scope: "project", filter: { limit: 50 } });
    expect(result.activeTask.summary).toEqual({ passed: 1, failed: 1, stale: 1, pending: 2, total: 5, returned: 5, resultTruncated: false, detailsTruncated: false });
    expect(result.activeTask.checks.map(({ id, state, reasonCodes }) => ({ id, state, reasonCodes }))).toEqual([
      { id: "a-failed", state: "failed", reasonCodes: ["latest-failed"] },
      { id: "b-passed", state: "passed", reasonCodes: [] },
      { id: "c-skipped", state: "pending", reasonCodes: ["latest-skipped"] },
      { id: "m-expired", state: "stale", reasonCodes: ["evidence-expired"] },
      { id: "z-pending", state: "pending", reasonCodes: ["no-evidence"] },
    ]);
    expect(result.activeTask.checks.every((check) => check.changes.length === 0)).toBe(true);
    for (const canary of ["PRIVATE_TITLE_CANARY", "PRIVATE_GOAL_CANARY", "PRIVATE_CHECK_CANARY", "PRIVATE_COMMAND_CANARY", "PRIVATE_EVIDENCE_CANARY", root]) expect(raw).not.toContain(canary);
    await expect(snapshotTree(root)).resolves.toEqual(before);

    stdout.mockClear();
    await expect(runCli(["node", "harnix", "checks", "--limit", "2"], { statusClock: () => now })).resolves.toBe(0);
    expect(JSON.parse(output(stdout.mock.calls))).toMatchObject({ activeTask: { summary: { total: 5, returned: 2, resultTruncated: true, detailsTruncated: true } } });
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("explains v2 changed inputs from immutable snapshots without running or writing", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const harnixRoot = join(root, ".harnix");
    const base = v2Task();
    const snapshot = await computeVerificationInputSnapshot(root, base, "gate");
    const task: TaskRecordV2 = {
      ...base,
      evidence: [{ id: "e-pass", checkId: "gate", recordedAt: "2026-08-26T00:59:00.000Z", result: "pass", exitCode: 0, summary: "PRIVATE_EVIDENCE_CANARY", artifactPaths: [], inputDigest: snapshot.inputDigest }],
    };
    await saveTask(harnixRoot, task);
    await persistNewVerificationInputSnapshots(root, harnixRoot, [], task);
    await setActiveTask(harnixRoot, task.id);
    await writeFile(join(root, "input.ts"), "export const value = 2;\n");
    process.chdir(root);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "checks"], { statusClock: () => Date.parse("2026-08-26T01:00:00.000Z") })).resolves.toBe(0);

    const raw = output(stdout.mock.calls);
    expect(JSON.parse(raw)).toMatchObject({
      activeTask: {
        summary: { passed: 0, failed: 0, stale: 1, pending: 0, total: 1, returned: 1 },
        checks: [{
          id: "gate",
          state: "stale",
          reasonCodes: ["inputs-changed"],
          changeSummary: { changed: 1, missing: 0, returned: 1, truncated: false },
          changes: [{ path: "input.ts", kind: "changed" }],
        }],
      },
    });
    for (const canary of ["PRIVATE_EVIDENCE_CANARY", "PRIVATE_COMMAND_CANARY", snapshot.inputDigest, root]) expect(raw).not.toContain(canary);
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("returns no-active metadata and rejects invalid limits", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "checks"])).resolves.toBe(0);
    expect(JSON.parse(output(stdout.mock.calls))).toEqual({ generator: "harnix", schemaVersion: 1, scope: "project", filter: { limit: 20 }, activeTask: null });

    for (const limit of ["0", "51", "1.5", "private"]) {
      stdout.mockClear();
      await expect(runCli(["node", "harnix", "checks", "--limit", limit])).resolves.toBe(2);
      expect(JSON.parse(output(stdout.mock.calls))).toMatchObject({ ok: false, error: { exitCode: 2 } });
    }
  });

  it("redacts malformed active-task parser input", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = join(root, ".harnix");
    const id = "20260826-162002-checks-malformed";
    await mkdir(join(harnixRoot, "tasks", id), { recursive: true });
    await writeFile(join(harnixRoot, "tasks", id, "task.json"), "PRIVATE_TASK_PARSE_CANARY");
    await writeFile(join(harnixRoot, "tasks", ".active"), `${id}\n`);
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "checks"])).resolves.toBe(2);

    const raw = output(stdout.mock.calls);
    expect(JSON.parse(raw)).toMatchObject({
      generator: "harnix",
      schemaVersion: 1,
      ok: false,
      error: { exitCode: 2, message: "Checks task state is unavailable; run harnix doctor." },
    });
    expect(raw).not.toContain("PRIVATE_TASK_PARSE_CANARY");
    expect(raw).not.toContain(root);
  });
});

function v1Task(): TaskRecordV1 {
  const timestamp = "2026-08-25T00:00:00.000Z";
  const checks = ["z-pending", "m-expired", "a-failed", "c-skipped", "b-passed"].map((id) => ({ id, description: "PRIVATE_CHECK_CANARY", command: "PRIVATE_COMMAND_CANARY", scope: "focused" as const, required: true }));
  return {
    generator: "harnix",
    schemaVersion: 1,
    id: "20260826-162000-checks-v1",
    title: "PRIVATE_TITLE_CANARY",
    mode: "lite",
    status: "verifying",
    checkpoint: "verifying",
    goal: "PRIVATE_GOAL_CANARY",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "private", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: checks,
    evidence: [
      { id: "e-expired", checkId: "m-expired", recordedAt: "2026-08-25T22:00:00.000Z", result: "pass", exitCode: 0, summary: "PRIVATE_EVIDENCE_CANARY", artifactPaths: [] },
      { id: "e-failed", checkId: "a-failed", recordedAt: "2026-08-26T00:59:00.000Z", result: "fail", exitCode: 1, summary: "PRIVATE_EVIDENCE_CANARY", artifactPaths: [] },
      { id: "e-skipped", checkId: "c-skipped", recordedAt: "2026-08-26T00:59:00.000Z", result: "skipped", exitCode: 0, summary: "PRIVATE_EVIDENCE_CANARY", artifactPaths: [] },
      { id: "e-passed", checkId: "b-passed", recordedAt: "2026-08-26T00:59:00.000Z", result: "pass", exitCode: 0, summary: "PRIVATE_EVIDENCE_CANARY", artifactPaths: [] },
    ],
    createdAt: timestamp,
    updatedAt: "2026-08-26T00:59:00.000Z",
  };
}

function v2Task(): TaskRecordV2 {
  const timestamp = "2026-08-26T00:00:00.000Z";
  return {
    generator: "harnix",
    schemaVersion: 2,
    id: "20260826-162001-checks-v2",
    title: "PRIVATE_TITLE_CANARY",
    mode: "lite",
    status: "verifying",
    checkpoint: "verifying",
    goal: "PRIVATE_GOAL_CANARY",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "private", status: "pending", evidenceIds: [] }],
    relevantPaths: ["input.ts"],
    relevantSpecs: [],
    validationPlan: [{ id: "gate", description: "PRIVATE_CHECK_CANARY", command: "PRIVATE_COMMAND_CANARY", scope: "focused", required: true, criterionIds: ["criterion"], inputs: ["@task-contract", "input.ts"] }],
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function output(calls: readonly (readonly unknown[])[]): string { return calls.map((call) => String(call[0])).join(""); }

async function snapshotTree(root: string): Promise<Array<{ path: string; sha256: string }>> {
  const files = await walk(root);
  return Promise.all(files.map(async (path) => ({ path: relative(root, path).replaceAll("\\", "/"), sha256: createHash("sha256").update(await readFile(path)).digest("hex") })));
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
