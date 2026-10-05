import { describe, expect, it } from "vitest";

import {
  explainProjectStatus,
  inspectProjectStatus,
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
});
