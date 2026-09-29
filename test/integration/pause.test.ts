import { createHash } from "node:crypto";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runCli } from "../../src/cli-program.js";
import { initializeProject } from "../../src/commands/init.js";
import { saveTask, setActiveTask, type TaskRecordV2 } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const temporaryRepository = useTemporaryRepositories("harnix-pause-");

afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe.sequential("pause command", () => {
  it("previews without writing, then atomically pauses an active task from a nested directory", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const harnixRoot = join(root, ".harnix");
    const active = task("20260928-144800-active-task", "in_progress");
    await saveTask(harnixRoot, active);
    await setActiveTask(harnixRoot, active.id);

    const nested = join(root, "packages", "app");
    await mkdir(nested, { recursive: true });
    process.chdir(nested);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const before = await snapshotTree(root);

    // 1. Dry run
    await expect(runCli(["node", "harnix", "pause", "--dry-run"])).resolves.toBe(0);
    expect(JSON.parse(output(stdout.mock.calls))).toEqual(result(active, true, "would-pause"));
    await expect(snapshotTree(root)).resolves.toEqual(before);

    // 2. Real pause
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "pause"])).resolves.toBe(0);
    expect(JSON.parse(output(stdout.mock.calls))).toEqual(result(active, false, "paused"));
    await expect(readFile(join(harnixRoot, "tasks", ".active"), "utf8")).resolves.toBe("");

    // 3. Pause again when no active task
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "pause"])).resolves.toBe(0);
    expect(JSON.parse(output(stdout.mock.calls))).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      scope: "project",
      dryRun: false,
      outcome: "no-active-task",
      task: null,
      nextAction: {
        code: "no-action-needed",
        message: "There is no active task to pause.",
      },
    });
  });

  it("fails closed when uninitialized", async () => {
    const root = await temporaryRepository();
    process.chdir(root);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "pause"])).resolves.toBe(2);
  });
});

function task(id: string, status: "planning" | "ready" | "in_progress"): TaskRecordV2 {
  const timestamp = "2026-09-28T00:00:00.000Z";
  return {
    generator: "harnix",
    schemaVersion: 2,
    id,
    title: "PRIVATE_TITLE_CANARY",
    mode: "lite",
    status,
    checkpoint: status === "ready" ? "ready" : status === "in_progress" ? "implementing" : "planning",
    goal: "private",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "private", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [
      {
        id: "gate",
        description: "private",
        scope: "focused",
        required: true,
        criterionIds: ["criterion"],
        inputs: ["@task-contract"],
      },
    ],
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function result(taskRecord: TaskRecordV2, dryRun: boolean, outcome: "would-pause" | "paused") {
  return {
    generator: "harnix",
    schemaVersion: 1,
    scope: "project",
    dryRun,
    outcome,
    task: {
      id: taskRecord.id,
      mode: taskRecord.mode,
      status: taskRecord.status,
      checkpoint: taskRecord.checkpoint,
    },
    nextAction: {
      code: "resume-guidance",
      message: `Run harnix resume ${taskRecord.id} when ready to continue.`,
    },
  };
}

function output(calls: unknown[][]): string {
  return calls.map((call) => String(call[0] ?? "")).join("");
}

async function snapshotTree(root: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  async function visit(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(fullPath);
      } else {
        const content = await readFile(fullPath);
        files[relative(root, fullPath).replace(/\\/g, "/")] = createHash("sha256").update(content).digest("hex");
      }
    }
  }
  await visit(root);
  return files;
}
