import { access, readFile, rm, symlink, writeFile } from "node:fs/promises";
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

const temporaryRepository = useTemporaryRepositories();

describe("task store", () => {
  it("creates Full artifacts and rejects ceremony files for Lite", async () => {
    const root = await temporaryRepository();
    await saveTaskWithArtifacts(root, { ...taskFixture(), mode: "full" }, { prd: "# PRD\n", plan: "# Plan\n" });
    expect(await readFile(join(root, "tasks", "20260807-120000-x", "prd.md"), "utf8")).toContain("PRD");
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
    const taskJsonPath = join(root, "tasks", task.id, "task.json");
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
    expect(await readFile(join(root, "tasks", done.id, "task.json"), "utf8")).toContain(done.id);
  });

  it("fails closed when the active pointer references a missing task record", async () => {
    const root = await temporaryRepository();
    const task = taskFixture();
    await saveTask(root, task);
    await setActiveTask(root, task.id);
    await rm(join(root, "tasks", task.id), { recursive: true });

    await expect(resolveActiveTask(root)).rejects.toThrow(/active task pointer|missing task/iu);
    await expect(readFile(join(root, "tasks", ".active"), "utf8")).resolves.toBe(`${task.id}\n`);
  });
});
