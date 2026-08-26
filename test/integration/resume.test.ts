import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "../../src/cli-program.js";
import { initializeProject } from "../../src/commands/init.js";
import { saveTask, setActiveTask, type TaskRecordV2 } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-resume-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe.sequential("resume command", () => {
  it("previews without writing, then atomically activates an unfinished task from a nested directory", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = join(root, ".harnix");
    const candidate = task("20260826-160000-resume-target", "ready");
    await saveTask(harnixRoot, candidate);
    const nested = join(root, "packages", "app");
    await mkdir(nested, { recursive: true });
    process.chdir(nested);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const before = await snapshotTree(root);

    await expect(runCli(["node", "harnix", "resume", candidate.id, "--dry-run"])).resolves.toBe(0);

    expect(JSON.parse(output(stdout.mock.calls))).toEqual(result(candidate, true, "would-resume"));
    await expect(snapshotTree(root)).resolves.toEqual(before);

    stdout.mockClear();
    await expect(runCli(["node", "harnix", "resume", candidate.id])).resolves.toBe(0);
    expect(JSON.parse(output(stdout.mock.calls))).toEqual(result(candidate, false, "resumed"));
    await expect(readFile(join(harnixRoot, "tasks", ".active"), "utf8")).resolves.toBe(`${candidate.id}\n`);
    await expect(readFile(join(harnixRoot, "tasks", candidate.id, "task.json"), "utf8")).resolves.toContain("PRIVATE_TITLE_CANARY");

    const afterResume = await snapshotTree(root);
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "resume", candidate.id])).resolves.toBe(0);
    expect(JSON.parse(output(stdout.mock.calls))).toEqual(result(candidate, false, "already-active"));
    await expect(snapshotTree(root)).resolves.toEqual(afterResume);
  });

  it("fails closed when another valid task is active without exposing task prose", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = join(root, ".harnix");
    const active = task("20260826-160001-active-task", "in_progress");
    const candidate = task("20260826-160002-resume-target", "planning");
    await saveTask(harnixRoot, active);
    await saveTask(harnixRoot, candidate);
    await setActiveTask(harnixRoot, active.id);
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const before = await snapshotTree(root);

    await expect(runCli(["node", "harnix", "resume", candidate.id])).resolves.toBe(2);

    const raw = output(stdout.mock.calls);
    expect(JSON.parse(raw)).toMatchObject({ generator: "harnix", schemaVersion: 1, ok: false, error: { exitCode: 2, message: "Resume cannot replace another active task." } });
    for (const canary of ["PRIVATE_TITLE_CANARY", "PRIVATE_GOAL_CANARY", "PRIVATE_COMMAND_CANARY", root]) expect(raw).not.toContain(canary);
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("rejects malformed, oversized, and terminal task state without changing the pointer", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = join(root, ".harnix");
    const malformedId = "20260826-160003-malformed-task";
    const oversizedId = "20260826-160004-oversized-task";
    const terminal = terminalTask("20260826-160005-terminal-task");
    await mkdir(join(harnixRoot, "tasks", malformedId), { recursive: true });
    await mkdir(join(harnixRoot, "tasks", oversizedId), { recursive: true });
    await writeFile(join(harnixRoot, "tasks", malformedId, "task.json"), "{\"private\":\"PRIVATE_MALFORMED_CANARY\"}\n");
    await writeFile(join(harnixRoot, "tasks", oversizedId, "task.json"), `{"padding":"${"x".repeat(1_048_576)}"}`);
    await saveTask(harnixRoot, terminal);
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    for (const id of [malformedId, oversizedId, terminal.id]) {
      const before = await snapshotTree(root);
      stdout.mockClear();
      await expect(runCli(["node", "harnix", "resume", id])).resolves.toBe(2);
      const raw = output(stdout.mock.calls);
      expect(JSON.parse(raw)).toMatchObject({ generator: "harnix", schemaVersion: 1, ok: false, error: { exitCode: 2 } });
      for (const canary of ["PRIVATE_MALFORMED_CANARY", "PRIVATE_TITLE_CANARY", root]) expect(raw).not.toContain(canary);
      await expect(snapshotTree(root)).resolves.toEqual(before);
    }

    const valid = task("20260826-160006-valid-task", "planning");
    await saveTask(harnixRoot, valid);
    await writeFile(join(harnixRoot, "tasks", ".active"), "../PRIVATE_POINTER_CANARY\n");
    const before = await snapshotTree(root);
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "resume", valid.id])).resolves.toBe(2);
    const raw = output(stdout.mock.calls);
    expect(JSON.parse(raw)).toMatchObject({ ok: false, error: { message: "Active task state is unavailable; run harnix doctor." } });
    expect(raw).not.toContain("PRIVATE_POINTER_CANARY");
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });
});

function result(taskRecord: TaskRecordV2, dryRun: boolean, outcome: "would-resume" | "resumed" | "already-active") {
  return {
    generator: "harnix",
    schemaVersion: 1,
    scope: "project",
    dryRun,
    outcome,
    task: { id: taskRecord.id, mode: taskRecord.mode, status: taskRecord.status, checkpoint: taskRecord.checkpoint },
    nextAction: { code: "inspect-active-task", message: "Run harnix status to inspect the selected task." },
  };
}

function task(id: string, status: "planning" | "ready" | "in_progress"): TaskRecordV2 {
  const timestamp = "2026-08-26T00:00:00.000Z";
  return {
    generator: "harnix",
    schemaVersion: 2,
    id,
    title: "PRIVATE_TITLE_CANARY",
    mode: "full",
    status,
    checkpoint: status === "planning" ? "planning" : status === "ready" ? "ready" : "implementing",
    goal: "PRIVATE_GOAL_CANARY",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "PRIVATE_CRITERION_CANARY", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [{ id: "gate", description: "PRIVATE_COMMAND_CANARY", scope: "focused", required: true, criterionIds: ["criterion"], inputs: ["@task-contract"] }],
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function terminalTask(id: string): TaskRecordV2 {
  const base = task(id, "planning");
  return {
    ...base,
    status: "completed",
    checkpoint: "finishing",
    acceptanceCriteria: [{ ...base.acceptanceCriteria[0]!, status: "waived", waiverReason: "Not needed." }],
    completedAt: base.updatedAt,
  };
}

function output(calls: readonly (readonly unknown[])[]): string {
  return calls.map((call) => String(call[0])).join("");
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
