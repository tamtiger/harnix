import { describe, expect, it } from "vitest";

import {
  explainProjectStatus,
  inspectProjectStatus,
  reportProjectCriteria,
  summarizeProjectStatus,
} from "src/commands/status.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, taskV3, writeProjectSource } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();

describe("commands/status", () => {
  it("inspects active project status and returns active status payload", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeProjectSource(root);

    // No active task
    const noActive = await inspectProjectStatus(root);
    expect(noActive.activeTask).toBeNull();
    expect(noActive.nextAction.code).toBe("no-active-task");

    const summaryNoActive = await summarizeProjectStatus(root);
    expect(summaryNoActive.activeTask).toBeNull();
    expect(summaryNoActive.summary).toBe("No active task.");

    // With active task
    const task = taskV3("planning", "planning");
    await saveWorkflow(root, { task });

    const active = await inspectProjectStatus(root);
    expect(active.activeTask?.status).toBe("planning");

    const summaryActive = await summarizeProjectStatus(root);
    expect(summaryActive.activeTask).not.toBeNull();
    expect(summaryActive.activeTask?.id).toBe(task.id);

    const explain = await explainProjectStatus(root, 10);
    expect(explain.activeTask?.status).toBe("planning");
    expect(explain.explain.audit).toBeDefined();
    expect(explain.explain.checks).toBeDefined();
  });

  it("throws when run in uninitialized project", async () => {
    const root = await temporaryRepository();
    await expect(inspectProjectStatus(root)).rejects.toThrow(/initialized/u);
  });

  it("handles corrupt task syntax error gracefully in explainProjectStatus", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeProjectSource(root);
    const task = taskV3("planning", "planning");
    await saveWorkflow(root, { task });

    // Corrupt the task.json file
    const { writeFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    await writeFile(join(root, ".harnix", "tasks", task.id, "task.json"), "{ invalid json", "utf8");

    await expect(explainProjectStatus(root, 10)).rejects.toThrow(/doctor/u);
  });

  it("includes epicContext when no task is active but an unfinished epic exists", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeProjectSource(root);

    const epic = {
      generator: "harnix" as const,
      schemaVersion: 1 as const,
      id: "20261015-130000-sample-epic",
      title: "Sample Epic",
      goal: "Epic goal",
      createdAt: "2026-10-15T13:00:00.000Z",
      updatedAt: "2026-10-15T13:00:00.000Z",
    };
    const taskRecord = {
      ...taskV3("planning", "planning"),
      id: "20261015-130001-member-task",
      title: "Member Task",
      epicId: epic.id,
    };
    await saveWorkflow(root, {
      task: taskRecord,
      epic,
    });

    const { writeFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    await writeFile(join(root, ".harnix", "tasks", ".active"), "");

    const status = await inspectProjectStatus(root);
    expect(status.activeTask).toBeNull();
    expect(status.epicContext).toMatchObject({
      id: epic.id,
      title: epic.title,
      nextTask: {
        id: taskRecord.id,
        status: "planning",
        title: "Member Task",
      },
      resumeCommand: `harnix resume ${taskRecord.id}`,
    });
  });

  it("includes epicContext with task position and total in status when task belongs to an epic", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeProjectSource(root);

    const epic = {
      generator: "harnix" as const,
      schemaVersion: 1 as const,
      id: "20261015-130000-sample-epic",
      title: "Sample Epic",
      goal: "Epic goal",
      createdAt: "2026-10-15T13:00:00.000Z",
      updatedAt: "2026-10-15T13:00:00.000Z",
    };
    const taskRecord = {
      ...taskV3("planning", "planning"),
      id: "20261015-130001-member-task",
      title: "Member Task",
      epicId: epic.id,
    };
    await saveWorkflow(root, {
      task: taskRecord,
      epic,
    });

    const status = await inspectProjectStatus(root);
    expect(status.activeTask).not.toBeNull();
    expect(status.epicContext).toMatchObject({
      id: epic.id,
      title: epic.title,
      taskIndex: 1,
      totalTasks: 1,
    });

    const summary = await summarizeProjectStatus(root);
    expect(summary.summary).toContain(`(Epic ${epic.id} [1/1])`);
    expect(summary.epicContext).toMatchObject({
      id: epic.id,
      taskIndex: 1,
      totalTasks: 1,
    });

    const explain = await explainProjectStatus(root, 10);
    expect(explain.epicContext).toMatchObject({
      id: epic.id,
      taskIndex: 1,
      totalTasks: 1,
    });
  });

  it("includes git read-only context in status when in a git repository", async () => {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const { writeFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const execFileAsync = promisify(execFile);

    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await execFileAsync("git", ["init", "-b", "feature/status-git"], { cwd: root });
    await execFileAsync("git", ["config", "user.name", "Test User"], { cwd: root });
    await execFileAsync("git", ["config", "user.email", "test@example.com"], { cwd: root });
    await writeFile(join(root, "init.txt"), "hello");
    await execFileAsync("git", ["add", "-A"], { cwd: root });
    await execFileAsync("git", ["commit", "-m", "init"], { cwd: root });

    const status = await inspectProjectStatus(root);
    expect(status.git).toBeDefined();
    expect(status.git?.branch).toBe("feature/status-git");
    expect(status.git?.clean).toBe(true);
    expect(status.git?.commit).toMatch(/^[0-9a-f]{7,}/u);
  });

  it("reports project criteria lean status and a null task without an active task, like the other status modes", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeProjectSource(root);

    await expect(reportProjectCriteria(root)).resolves.toEqual({ taskId: null, criteria: [] });

    const task = taskV3("planning", "planning");
    await saveWorkflow(root, { task });

    const result = await reportProjectCriteria(root);
    expect(result.taskId).toBe(task.id);
    expect(result.criteria).toHaveLength(1);
    expect(result.criteria[0]).toMatchObject({
      id: "a",
      status: "pending",
      text: "done",
      coveredBy: ["check"],
    });
  });
});
