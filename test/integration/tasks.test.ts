import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "../../src/cli-program.js";
import { initializeProject } from "../../src/commands/init.js";
import { saveTask, setActiveTask, type TaskRecordV1 } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-tasks-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe.sequential("tasks command", () => {
  it("lists task metadata from a nested directory without writing or exposing private prose", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = join(root, ".harnix");
    const active = task("20260826-100000-active-task", "2026-08-26T00:00:00.000Z", "planning");
    const newest = task("20260826-110000-newest-task", "2026-08-26T03:00:00.000Z", "ready");
    const middle = task("20260826-120000-middle-task", "2026-08-26T02:00:00.000Z", "planning");
    await Promise.all([saveTask(harnixRoot, active), saveTask(harnixRoot, newest), saveTask(harnixRoot, middle)]);
    await setActiveTask(harnixRoot, active.id);
    const nested = join(root, "packages", "app");
    await mkdir(nested, { recursive: true });
    process.chdir(nested);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "tasks", "--limit", "2"])).resolves.toBe(0);

    const output = stdout.mock.calls.map((call) => String(call[0])).join("");
    expect(JSON.parse(output)).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      filter: { status: null, limit: 2 },
      summary: {
        scanned: 3,
        valid: 3,
        invalid: 0,
        matched: 3,
        returned: 2,
        scanTruncated: false,
        resultTruncated: true,
      },
      activeTaskId: active.id,
      attention: [],
      tasks: [
        projection(active, true),
        projection(newest, false),
      ],
    });
    for (const canary of ["PRIVATE_TITLE_CANARY", "PRIVATE_GOAL_CANARY", "PRIVATE_CRITERION_CANARY", "PRIVATE_COMMAND_CANARY"]) {
      expect(output).not.toContain(canary);
    }
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("keeps valid history when the active task record is malformed", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = join(root, ".harnix");
    const good = task("20260826-100000-good-task", "2026-08-26T00:00:00.000Z", "planning");
    const badId = "20260826-110000-bad-task";
    await saveTask(harnixRoot, good);
    await mkdir(join(harnixRoot, "tasks", badId), { recursive: true });
    await writeFile(join(harnixRoot, "tasks", badId, "task.json"), "{\"private\":\"PRIVATE_MALFORMED_CANARY\"}\n");
    await writeFile(join(harnixRoot, "tasks", ".active"), `${badId}\n`);
    process.chdir(root);
    const before = await snapshotTree(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "tasks"])).resolves.toBe(0);

    const output = stdout.mock.calls.map((call) => String(call[0])).join("");
    expect(JSON.parse(output)).toMatchObject({
      status: "partial",
      activeTaskId: null,
      attention: [{ code: "active-task-unavailable" }],
      summary: { scanned: 2, valid: 1, invalid: 1, matched: 1, returned: 1 },
      tasks: [projection(good, false)],
    });
    expect(output).not.toContain("PRIVATE_MALFORMED_CANARY");
    expect(output).not.toContain(root);
    await expect(snapshotTree(root)).resolves.toEqual(before);
  });

  it("rejects out-of-range limits and unknown statuses through public JSON errors", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    for (const argv of [
      ["node", "harnix", "tasks", "--limit", "0"],
      ["node", "harnix", "tasks", "--limit", "101"],
      ["node", "harnix", "tasks", "--status", "finished"],
    ]) {
      stdout.mockClear();
      await expect(runCli(argv)).resolves.toBe(2);
      const result = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as { ok: boolean; error: { exitCode: number; message: string } };
      expect(result).toMatchObject({ ok: false, error: { exitCode: 2 } });
      expect(result.error.message).not.toContain(root);
    }
  });
});

function projection(record: TaskRecordV1, active: boolean) {
  return { id: record.id, mode: record.mode, status: record.status, checkpoint: record.checkpoint, active, updatedAt: record.updatedAt };
}

function task(id: string, updatedAt: string, status: "planning" | "ready"): TaskRecordV1 {
  return {
    generator: "harnix",
    schemaVersion: 1,
    id,
    title: "PRIVATE_TITLE_CANARY",
    mode: "lite",
    status,
    checkpoint: status === "ready" ? "ready" : "planning",
    goal: "PRIVATE_GOAL_CANARY",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "PRIVATE_CRITERION_CANARY", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [{ id: "gate", description: "PRIVATE_COMMAND_CANARY", command: "PRIVATE_COMMAND_CANARY", scope: "focused", required: true }],
    evidence: [],
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt,
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
