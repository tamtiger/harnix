import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { saveTask, setActiveTask, type TaskRecordV3 } from "src/core/tasks/task.js";
import { upsertEpic } from "src/core/epics/epic.js";
import { at, buildEpic } from "test/support/builders.js";
import { buildGatedTask } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

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
    await expect(readFile(join(harnixRoot, "tasks", candidate.id, "task.json"), "utf8")).resolves.toContain(
      "PRIVATE_TITLE_CANARY",
    );

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
    expect(JSON.parse(raw)).toMatchObject({
      generator: "harnix",
      schemaVersion: 1,
      ok: false,
      error: { exitCode: 2, message: "Resume cannot replace another active task." },
    });
    for (const canary of ["PRIVATE_TITLE_CANARY", "PRIVATE_GOAL_CANARY", "PRIVATE_COMMAND_CANARY", root])
      expect(raw).not.toContain(canary);
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
    await writeFile(join(harnixRoot, "tasks", malformedId, "task.json"), '{"private":"PRIVATE_MALFORMED_CANARY"}\n');
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
      expect(JSON.parse(raw)).toMatchObject({
        generator: "harnix",
        schemaVersion: 1,
        ok: false,
        error: { exitCode: 2 },
      });
      for (const canary of ["PRIVATE_MALFORMED_CANARY", "PRIVATE_TITLE_CANARY", root])
        expect(raw).not.toContain(canary);
      await expect(snapshotTree(root)).resolves.toEqual(before);
    }

    const valid = task("20260826-160006-valid-task", "planning");
    await saveTask(harnixRoot, valid);
    await writeFile(join(harnixRoot, "tasks", ".active"), "../PRIVATE_POINTER_CANARY\n");
    const before = await snapshotTree(root);
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "resume", valid.id])).resolves.toBe(2);
    const raw = output(stdout.mock.calls);
    expect(JSON.parse(raw)).toMatchObject({
      ok: false,
      error: { message: "Active task state is unavailable; run harnix doctor." },
    });
    expect(raw).not.toContain("PRIVATE_POINTER_CANARY");
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });
});

describe.sequential("resume --epic", () => {
  const EPIC = "20260826-150000-resume-epic";

  async function epicProject(statuses: Array<"done" | "planning" | "ready" | "in_progress">): Promise<string[]> {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await upsertEpic(root, buildEpic({ id: EPIC }));
    const ids = statuses.map((_status, index) => `20260826-16000${index}-epic-member-${index}`);
    for (const [index, status] of statuses.entries()) {
      const base = status === "done" ? terminalTask(ids[index] as string) : task(ids[index] as string, status);
      await saveTask(join(root, ".harnix"), { ...base, epicId: EPIC });
    }
    process.chdir(root);
    return ids;
  }

  async function resume(...args: string[]): Promise<{ code: number; out: string; err: string }> {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const code = await runCli(["node", "harnix", "resume", ...args]);
    const captured = { code, out: output(stdout.mock.calls), err: output(stderr.mock.calls) };
    stdout.mockRestore();
    stderr.mockRestore();
    return captured;
  }

  it("previews and then activates the next unfinished member of the epic in order", async () => {
    const ids = await epicProject(["done", "planning", "ready"]);

    const preview = await resume("--epic", EPIC, "--dry-run");
    const real = await resume("--epic", EPIC);

    expect(JSON.parse(preview.out)).toMatchObject({ dryRun: true, outcome: "would-resume", task: { id: ids[1] } });
    expect(JSON.parse(real.out)).toMatchObject({ dryRun: false, outcome: "resumed", task: { id: ids[1] } });
    await expect(readFile(join(process.cwd(), ".harnix", "tasks", ".active"), "utf8")).resolves.toBe(`${ids[1]}\n`);
  });

  it("refuses an epic with nothing left, a task id together with --epic, and no argument at all", async () => {
    await epicProject(["done"]);

    expect((await resume("--epic", EPIC)).err).toMatch(/no unfinished task/u);
    expect((await resume("--epic", "20260826-150000-unknown-epic")).code).not.toBe(0);
    expect((await resume("20260826-160000-epic-member-0", "--epic", EPIC)).err).toMatch(/either a task id or --epic/u);
    expect((await resume()).err).toMatch(/task id or --epic/u);
  });

  it("fails closed when another task is already active", async () => {
    const ids = await epicProject(["planning", "ready"]);
    const harnixRoot = join(process.cwd(), ".harnix");
    const other = task("20260826-160009-other-active", "in_progress");
    await saveTask(harnixRoot, other);
    await setActiveTask(harnixRoot, other.id);

    const result = await resume("--epic", EPIC);

    expect(result.code).not.toBe(0);
    await expect(readFile(join(harnixRoot, "tasks", ".active"), "utf8")).resolves.toBe(`${other.id}\n`);
    expect(ids).toHaveLength(2);
  });
});
function result(taskRecord: TaskRecordV3, dryRun: boolean, outcome: "would-resume" | "resumed" | "already-active") {
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

function task(id: string, status: "planning" | "ready" | "in_progress"): TaskRecordV3 {
  const checkpoint = status === "planning" ? "planning" : status === "ready" ? "ready" : "implementing";
  return buildGatedTask({
    id,
    title: "PRIVATE_TITLE_CANARY",
    mode: "full",
    status,
    checkpoint,
    goal: "PRIVATE_GOAL_CANARY",
    criterion: { text: "PRIVATE_CRITERION_CANARY" },
    gate: { description: "PRIVATE_COMMAND_CANARY" },
  });
}

function terminalTask(id: string): TaskRecordV3 {
  return buildGatedTask({
    id,
    title: "PRIVATE_TITLE_CANARY",
    mode: "full",
    status: "completed",
    checkpoint: "finishing",
    goal: "PRIVATE_GOAL_CANARY",
    criterion: { text: "PRIVATE_CRITERION_CANARY", status: "waived", waiverReason: "Not needed." },
    gate: { description: "PRIVATE_COMMAND_CANARY" },
    completedAt: at(0),
  });
}

function output(calls: readonly (readonly unknown[])[]): string {
  return calls.map((call) => String(call[0])).join("");
}

async function snapshotTree(root: string): Promise<Array<{ path: string; sha256: string }>> {
  const files = await walk(root);
  return Promise.all(
    files.map(async (path) => ({
      path: relative(root, path).replaceAll("\\", "/"),
      sha256: createHash("sha256")
        .update(await readFile(path))
        .digest("hex"),
    })),
  );
}

async function walk(root: string): Promise<string[]> {
  const paths: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) paths.push(...(await walk(path)));
    else if (entry.isFile()) paths.push(path);
  }
  return paths.sort();
}
