import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { saveWorkflow } from "../../src/commands/internal-workflow.js";
import { initializeProject } from "../../src/commands/init.js";
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
