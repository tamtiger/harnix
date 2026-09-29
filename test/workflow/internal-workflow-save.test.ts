import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { cancelWorkflow, finishWorkflow, saveWorkflow } from "src/commands/internal-workflow.js";
import { initializeProject } from "src/commands/init.js";
import { saveTask, setActiveTask } from "src/core/tasks/task.js";
import type { TaskRecordV3 } from "src/core/tasks/task.js";
import { buildEpic, buildEvidence } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { taskV3, timestamp } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();

describe("hidden workflow save epic envelope", () => {
  it("upserts an epic record and generates markdown when the epic field is present", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV3("planning", "planning");

    const epic = buildEpic({
      id: "my-epic",
      title: "Epic title",
      goal: "Epic goal",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await saveWorkflow(root, { task: planning, epic });

    const jsonContent = await readFile(join(root, ".harnix", "epics", "my-epic.json"), "utf8");
    expect(JSON.parse(jsonContent).id).toBe("my-epic");

    const mdContent = await readFile(join(root, ".harnix", "epics", "my-epic.md"), "utf8");
    expect(mdContent).toContain("Epic title");
    expect(mdContent).toContain("Epic goal");
  });

  it("refreshes markdown when saving a task whose epicId matches an existing epic without resending epic", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV3("planning", "planning");

    const epic = buildEpic({
      id: "my-epic",
      title: "Epic title",
      goal: "Epic goal",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await saveWorkflow(root, { task: planning, epic });

    const withEpicId = {
      ...planning,
      epicId: "my-epic",
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: withEpicId });

    const mdContent = await readFile(join(root, ".harnix", "epics", "my-epic.md"), "utf8");
    expect(mdContent).toContain(planning.id);
    expect(mdContent).toContain("ready");
    // The refresh must reload the persisted epic record for title/goal
    // instead of falling back to the bare epic ID, since this save omits epic.
    expect(mdContent).toContain("Epic title");
    expect(mdContent).toContain("Epic goal");
  });

  it("preserves prior save behavior exactly when no epic or epicId is present (regression)", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV3("planning", "planning");

    const result = await saveWorkflow(root, { task: planning });

    expect(result.id).toBe(planning.id);
    expect(result.status).toBe("planning");
    await expect(readFile(join(root, ".harnix", "epics", "my-epic.json"), "utf8")).rejects.toThrow();
  });

  it("refreshes epic markdown with the final completed status when finishing a task with epicId", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const epic = buildEpic({
      id: "finish-epic",
      title: "Finish epic title",
      goal: "Finish epic goal",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await saveWorkflow(root, { task: taskV3("planning", "planning"), epic });

    const completedAt = "2026-08-13T00:05:00.000Z";
    const completionEvidence = buildEvidence({ id: "e", recordedAt: completedAt, summary: "verified" });
    const completedTask: TaskRecordV3 = {
      ...taskV3("completed", "finishing"),
      epicId: "finish-epic",
      acceptanceCriteria: [{ id: "a", text: "done", status: "met", evidenceIds: [completionEvidence.id] }],
      evidence: [completionEvidence],
      completedAt,
      updatedAt: completedAt,
    };
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, completedTask);
    await setActiveTask(harnixRoot, completedTask.id);

    await expect(finishWorkflow(root, completedAt)).resolves.toMatchObject({ status: "completed" });

    const mdContent = await readFile(join(root, ".harnix", "epics", "finish-epic.md"), "utf8");
    expect(mdContent).toContain("Finish epic title");
    expect(mdContent).toContain("Finish epic goal");
    expect(mdContent).toContain(completedTask.id);
    expect(mdContent).toContain("completed");
  });

  it("refreshes epic markdown with the final cancelled status when cancelling a task with epicId", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const epic = buildEpic({
      id: "cancel-epic",
      title: "Cancel epic title",
      goal: "Cancel epic goal",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await saveWorkflow(root, { task: { ...taskV3("planning", "planning"), epicId: "cancel-epic" }, epic });

    await expect(
      cancelWorkflow(root, { reason: "no longer needed", authorizedBy: "user" }, "2026-08-13T00:05:00.000Z"),
    ).resolves.toMatchObject({ status: "cancelled" });

    const mdContent = await readFile(join(root, ".harnix", "epics", "cancel-epic.md"), "utf8");
    expect(mdContent).toContain("Cancel epic title");
    expect(mdContent).toContain("Cancel epic goal");
    expect(mdContent).toContain("cancelled");
  });

  it("leaves finish/cancel behavior unaffected when the task has no epicId (regression)", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });

    await expect(
      cancelWorkflow(root, { reason: "no longer needed", authorizedBy: "user" }, "2026-08-13T00:01:00.000Z"),
    ).resolves.toMatchObject({ status: "cancelled" });
  });

  it("scaffolds planned epic member tasks and regenerates markdown when epicMembers is present", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const epic = buildEpic({
      id: "batch-epic",
      title: "Batch epic title",
      goal: "Batch epic goal",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const member1 = {
      ...taskV3("planning", "planning"),
      id: "20260813-120000-member-1",
      title: "Member 1",
      goal: "Goal 1",
      epicId: "batch-epic",
    };
    const member2 = {
      ...taskV3("planning", "planning"),
      id: "20260813-120001-member-2",
      title: "Member 2",
      goal: "Goal 2",
      epicId: "batch-epic",
    };

    await saveWorkflow(root, {
      task: member1,
      epic,
      epicMembers: [member2],
    });

    const mdContent = await readFile(join(root, ".harnix", "epics", "batch-epic.md"), "utf8");
    expect(mdContent).toContain("Batch epic title");
    expect(mdContent).toContain("Member 1");
    expect(mdContent).toContain("Member 2");
    expect(mdContent).toContain("Members (2 tasks)");
  });
});
