import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { cancelWorkflow, finishWorkflow, saveWorkflow } from "../../src/commands/internal-workflow.js";
import { initializeProject } from "../../src/commands/init.js";
import { saveTask, setActiveTask } from "../../src/core/tasks/task.js";
import type { TaskRecord, TaskRecordV1, TaskRecordV2 } from "../../src/core/tasks/task.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();
const timestamp = "2026-08-13T00:00:00.000Z";

describe("hidden workflow save epic envelope", () => {
  it("upserts an epic record and generates markdown when the epic field is present", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning");

    const epic = {
      generator: "harnix" as const,
      schemaVersion: 1 as const,
      id: "my-epic",
      title: "Epic title",
      goal: "Epic goal",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await saveWorkflow(root, { task: planning, epic });

    const jsonContent = await readFile(join(root, ".harnix", "roadmaps", "my-epic.json"), "utf8");
    expect(JSON.parse(jsonContent).id).toBe("my-epic");

    const mdContent = await readFile(join(root, ".harnix", "roadmaps", "my-epic.md"), "utf8");
    expect(mdContent).toContain("Epic title");
    expect(mdContent).toContain("Epic goal");
  });

  it("refreshes markdown when saving a task whose epicId matches an existing epic without resending epic", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning");

    const epic = {
      generator: "harnix" as const,
      schemaVersion: 1 as const,
      id: "my-epic",
      title: "Epic title",
      goal: "Epic goal",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await saveWorkflow(root, { task: planning, epic });

    const withEpicId = { ...planning, epicId: "my-epic", status: "ready" as const, checkpoint: "ready" as const, updatedAt: "2026-08-13T00:01:00.000Z" };
    await saveWorkflow(root, { task: withEpicId });

    const mdContent = await readFile(join(root, ".harnix", "roadmaps", "my-epic.md"), "utf8");
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
    const planning = taskV2("planning", "planning");

    const result = await saveWorkflow(root, { task: planning });

    expect(result.id).toBe(planning.id);
    expect(result.status).toBe("planning");
    await expect(readFile(join(root, ".harnix", "roadmaps", "my-epic.json"), "utf8")).rejects.toThrow();
  });

  it("refreshes roadmap markdown with the final completed status when finishing a task with epicId", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const epic = { generator: "harnix" as const, schemaVersion: 1 as const, id: "finish-epic", title: "Finish epic title", goal: "Finish epic goal", createdAt: timestamp, updatedAt: timestamp };
    await saveWorkflow(root, { task: taskV2("planning", "planning"), epic });

    const completedAt = "2026-08-13T00:05:00.000Z";
    const completionEvidence = { id: "e", checkId: "check", recordedAt: completedAt, result: "pass" as const, exitCode: 0, summary: "verified", artifactPaths: [], inputDigest: "a".repeat(64) };
    const completedTask: TaskRecordV2 = {
      ...taskV2("completed", "finishing"),
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

    const mdContent = await readFile(join(root, ".harnix", "roadmaps", "finish-epic.md"), "utf8");
    expect(mdContent).toContain("Finish epic title");
    expect(mdContent).toContain("Finish epic goal");
    expect(mdContent).toContain(completedTask.id);
    expect(mdContent).toContain("completed");
  });

  it("refreshes roadmap markdown with the final cancelled status when cancelling a task with epicId", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const epic = { generator: "harnix" as const, schemaVersion: 1 as const, id: "cancel-epic", title: "Cancel epic title", goal: "Cancel epic goal", createdAt: timestamp, updatedAt: timestamp };
    await saveWorkflow(root, { task: { ...taskV2("planning", "planning"), epicId: "cancel-epic" }, epic });

    await expect(cancelWorkflow(root, { reason: "no longer needed", authorizedBy: "user" }, "2026-08-13T00:05:00.000Z")).resolves.toMatchObject({ status: "cancelled" });

    const mdContent = await readFile(join(root, ".harnix", "roadmaps", "cancel-epic.md"), "utf8");
    expect(mdContent).toContain("Cancel epic title");
    expect(mdContent).toContain("Cancel epic goal");
    expect(mdContent).toContain("cancelled");
  });

  it("leaves finish/cancel behavior unaffected when the task has no epicId (regression)", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });
    const planning = taskV2("planning", "planning");
    await saveWorkflow(root, { task: planning });

    await expect(cancelWorkflow(root, { reason: "no longer needed", authorizedBy: "user" }, "2026-08-13T00:01:00.000Z")).resolves.toMatchObject({ status: "cancelled" });
    await expect(readdir(join(root, ".harnix", "roadmaps"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});

function task(status: TaskRecord["status"], checkpoint: TaskRecord["checkpoint"]): TaskRecordV1 {
  return { generator: "harnix", schemaVersion: 1, id: "20260813-120000-workflow", title: "workflow", mode: "lite", status, checkpoint, goal: "test", nonGoals: [], acceptanceCriteria: [{ id: "a", text: "done", status: "pending", evidenceIds: [] }], relevantPaths: [], relevantSpecs: [], validationPlan: [{ id: "check", description: "verify", command: "pnpm test", scope: "full", required: true }], evidence: [], createdAt: timestamp, updatedAt: timestamp };
}

function taskV2(status: TaskRecord["status"], checkpoint: TaskRecord["checkpoint"], inputs = ["@task-contract", "src/**/*.ts"]): TaskRecordV2 {
  return {
    ...task(status, checkpoint),
    schemaVersion: 2 as const,
    validationPlan: [{ id: "check", description: "Run tests", command: "pnpm test", scope: "full" as const, required: true, criterionIds: ["a"], inputs }],
    evidence: [],
  };
}
