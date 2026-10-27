import { access, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  archiveTask,
  clearActiveTask,
  loadTask,
  resolveActiveTask,
  saveTask,
  saveTaskWithArtifacts,
  setActiveTask,
  TaskValidationError,
  transitionTask,
} from "src/core/tasks/task.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { taskFixture, timestamp } from "test/support/tasks-fixtures.js";
import { at, buildCriterion, buildEvidence, buildTaskV3 } from "test/support/builders.js";
import type { CodeImpactGitRunner } from "src/core/tasks/code-impact.js";
import { taskMonth } from "test/support/task-paths.js";

const temporaryRepository = useTemporaryRepositories();

describe("task store", () => {
  it("creates Full artifacts and rejects ceremony files for Lite", async () => {
    const root = await temporaryRepository();
    await saveTaskWithArtifacts(root, { ...taskFixture(), mode: "full" }, { prd: "# PRD\n", plan: "# Plan\n" });
    expect(
      await readFile(join(root, "tasks", taskMonth("20260807-120000-x"), "20260807-120000-x", "prd.md"), "utf8"),
    ).toContain("PRD");
    await expect(saveTaskWithArtifacts(root, taskFixture(), { prd: "# no\n" })).rejects.toThrow("Lite");
  });

  it("should_reject_external_symlink_when_writing_task_artifacts", async () => {
    const root = await temporaryRepository();
    const external = await temporaryRepository();
    await symlink(external, join(root, "tasks"), process.platform === "win32" ? "junction" : "dir");

    await expect(
      saveTaskWithArtifacts(root, { ...taskFixture(), mode: "full" }, { prd: "# PRD\n", plan: "# Plan\n" }),
    ).rejects.toThrow("symbolic link");

    await expect(access(join(external, "20260807-120000-x", "task.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_reject_external_symlink_when_resolving_active_task", async () => {
    const root = await temporaryRepository();
    const external = await temporaryRepository();
    const task = taskFixture();
    await saveTask(external, task);
    await setActiveTask(external, task.id);
    await symlink(external, join(root, "tasks"), process.platform === "win32" ? "junction" : "dir");

    await expect(resolveActiveTask(root)).rejects.toThrow("symbolic link");
    await expect(clearActiveTask(root, task.id)).rejects.toThrow("symbolic link");

    await expect(readFile(join(external, "tasks", ".active"), "utf8")).resolves.toBe(`${task.id}\n`);
  });

  it("wraps a corrupt task.json in a TaskValidationError naming the file instead of a raw JSON.parse SyntaxError", async () => {
    const root = await temporaryRepository();
    const task = taskFixture();
    await saveTask(root, task);
    await setActiveTask(root, task.id);
    const taskJsonPath = join(root, "tasks", taskMonth(task.id), task.id, "task.json");
    await writeFile(taskJsonPath, '{"generator":"harnix","schemaVersion":2,"id":"20260807-1200', "utf8"); // truncated mid-string

    await expect(resolveActiveTask(root)).rejects.toThrow(TaskValidationError);
    await expect(resolveActiveTask(root)).rejects.toThrow(taskJsonPath);
    await expect(loadTask(taskJsonPath)).rejects.toThrow(TaskValidationError);
  });

  it("archives only terminal tasks and preserves task data", async () => {
    const root = await temporaryRepository();
    const task = taskFixture();
    const evidence = { id: "e", recordedAt: timestamp, result: "pass" as const, summary: "ok", artifactPaths: [] };
    const completed = transitionTask(
      {
        ...task,
        evidence: [evidence],
        acceptanceCriteria: [{ ...task.acceptanceCriteria[0]!, status: "met", evidenceIds: ["e"] }],
      },
      "ready",
      "ready",
    );
    const inProgress = transitionTask(completed, "in_progress", "implementing");
    const verifying = transitionTask(inProgress, "verifying", "verifying");
    const done = transitionTask(verifying, "completed", "finishing");
    await saveTask(root, done);
    await setActiveTask(root, done.id);
    await archiveTask(root, done);
    expect(await resolveActiveTask(root)).toBeUndefined();
    expect(await readFile(join(root, "tasks", taskMonth(done.id), done.id, "task.json"), "utf8")).toContain(done.id);
  });

  it("fails closed when the active pointer references a missing task record", async () => {
    const root = await temporaryRepository();
    const task = taskFixture();
    await saveTask(root, task);
    await setActiveTask(root, task.id);
    await rm(join(root, "tasks", taskMonth(task.id), task.id), { recursive: true });

    await expect(resolveActiveTask(root)).rejects.toThrow(/active task pointer|missing task/iu);
    await expect(readFile(join(root, "tasks", ".active"), "utf8")).resolves.toBe(`${task.id}\n`);
  });

  describe("review.md code impact", () => {
    const gitRunner: CodeImpactGitRunner = (_cwd, args) =>
      Promise.resolve(args.includes("status") ? "? src/new.ts\0" : "");
    const review = async (root: string, id: string): Promise<string> =>
      readFile(join(root, "tasks", taskMonth(id), id, "review.md"), "utf8");

    it("writes ## Code impact while in progress or verifying and not while planning", async () => {
      const root = await temporaryRepository();
      const options = { gitRunner, projectRoot: "/project" };
      const working = buildTaskV3({ checkpoint: "implementing", id: "20260807-120001-impact", status: "in_progress" });
      await saveTask(root, working, options);
      expect(await review(root, working.id)).toContain("| `src/new.ts` | added | - |");

      const verifying = { ...working, checkpoint: "verifying" as const, status: "verifying" as const };
      await saveTask(root, verifying, options);
      expect(await review(root, working.id)).toContain("## Code impact");

      const planning = buildTaskV3({ id: "20260807-120002-planning" });
      await saveTask(root, planning, options);
      expect(await review(root, planning.id)).not.toContain("## Code impact");
    });

    it("keeps the earlier section once the task is completed and never fails on a git error", async () => {
      const root = await temporaryRepository();
      const working = buildTaskV3({ checkpoint: "implementing", id: "20260807-120003-keep", status: "in_progress" });
      await saveTask(root, working, { gitRunner, projectRoot: "/project" });
      const done = buildTaskV3({
        acceptanceCriteria: [buildCriterion({ evidenceIds: ["ev-check"], status: "met" })],
        checkpoint: "finishing",
        completedAt: at(20),
        evidence: [buildEvidence()],
        id: working.id,
        status: "completed",
      });

      await saveTask(root, done, { gitRunner: () => Promise.reject(new Error("no git")), projectRoot: "/project" });

      expect(await review(root, working.id)).toContain("| `src/new.ts` | added | - |");
      const failing = buildTaskV3({ checkpoint: "implementing", id: "20260807-120004-nogit", status: "in_progress" });
      await saveTask(root, failing, { gitRunner: () => Promise.reject(new Error("no git")), projectRoot: "/project" });
      expect(await review(root, failing.id)).not.toContain("## Code impact");
    });

    it("keeps the last section when git cannot answer and when finishing without a project root", async () => {
      const root = await temporaryRepository();
      const working = buildTaskV3({ checkpoint: "implementing", id: "20260807-120005-last", status: "in_progress" });
      await saveTask(root, working, { gitRunner, projectRoot: "/project" });

      await saveTask(root, working, { gitRunner: () => Promise.reject(new Error("slow")), projectRoot: "/project" });
      expect(await review(root, working.id)).toContain("| `src/new.ts` | added | - |");

      const done = buildTaskV3({
        acceptanceCriteria: [buildCriterion({ evidenceIds: ["ev-check"], status: "met" })],
        checkpoint: "finishing",
        completedAt: at(20),
        evidence: [buildEvidence()],
        id: working.id,
        status: "completed",
      });
      await saveTask(root, done);
      expect(await review(root, working.id)).toContain("| `src/new.ts` | added | - |");
    });
  });
});

describe("task store archive guard", () => {
  it("rejects saving a task, or its artifacts, that lives in the read-only archive", async () => {
    const root = await temporaryRepository();
    const task = taskFixture();
    await mkdir(join(root, "tasks", "_archive", taskMonth(task.id), task.id), { recursive: true });

    await expect(saveTask(root, task)).rejects.toThrow("harnix archive --restore");
    await expect(saveTaskWithArtifacts(root, task, {})).rejects.toThrow("harnix archive --restore");
  });
});
