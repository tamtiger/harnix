import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findEpicContext } from "src/core/workflow/epic-context.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { saveTask } from "src/core/tasks/task.js";
import { at, buildEpic } from "test/support/builders.js";
import { initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

async function epicWithMember(root: string, epicId: string, taskId: string) {
  const epic = buildEpic({ id: epicId, title: "Sample Epic", createdAt: at(10), updatedAt: at(10) });
  const task = { ...taskV3("planning", "planning"), id: taskId, title: "Member Task", epicId };
  await saveWorkflow(root, { task, epic });
  await writeFile(join(root, ".harnix", "tasks", ".active"), "");
  return task;
}

describe("epic context", () => {
  it("stays quiet about an epic whose members are only planning", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await epicWithMember(root, "20261015-120000-quiet-epic", "20261015-120001-idle-task");
    expect(await findEpicContext(root, join(root, ".harnix"))).toBeUndefined();
  });

  it("suggests the in-progress member with a resume command", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const task = await epicWithMember(root, "20261015-120000-busy-epic", "20261015-120001-busy-task");
    await saveTask(join(root, ".harnix"), { ...task, status: "in_progress", checkpoint: "implementing" });
    expect(await findEpicContext(root, join(root, ".harnix"))).toMatchObject({
      id: "20261015-120000-busy-epic",
      nextTask: { id: task.id, status: "in_progress", title: "Member Task" },
      resumeCommand: `harnix resume ${task.id}`,
    });
  });
});
