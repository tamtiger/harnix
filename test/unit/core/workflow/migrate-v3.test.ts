import { describe, expect, it } from "vitest";

import { saveTask, setActiveTask } from "src/core/tasks/task.js";
import { migrateToV3Workflow } from "src/core/workflow/migrate-v3.js";
import { buildCheck, buildCriterion, buildEvidence, buildTaskV1, buildTaskV2 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, legacyTask } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const NOW = "2026-10-01T00:00:00.000Z";
const TASK_ID = "20260813-120000-workflow";

async function activate(root: string, task: Parameters<typeof saveTask>[1]): Promise<void> {
  await initializeUtcProject(root);
  await saveTask(`${root}/.harnix`, task);
  await setActiveTask(`${root}/.harnix`, task.id);
}

describe("workflow --migrate to schema v3", () => {
  it("migrates a v2 task in one call and keeps state, criteria, evidence and required checks", async () => {
    const root = await temporaryRepository();
    const prior = buildEvidence({ id: "old", checkId: "check" });
    const legacy = buildTaskV2({
      id: TASK_ID,
      status: "in_progress",
      checkpoint: "implementing",
      acceptanceCriteria: [buildCriterion({ id: "a", text: "done" })],
      validationPlan: [buildCheck({ id: "check", criterionIds: ["a"], inputs: ["@task-contract", "src/**"] })],
      evidence: [prior],
    });
    await activate(root, legacy);

    const migrated = await migrateToV3Workflow(root, undefined, NOW);

    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.status).toBe("in_progress");
    expect(migrated.checkpoint).toBe("implementing");
    expect(migrated.acceptanceCriteria).toEqual(legacy.acceptanceCriteria);
    expect(migrated.validationPlan[0]).toMatchObject({ id: "check", criterionIds: ["a"], inputs: ["src/**"] });
    expect(migrated.evidence[0]).toEqual(prior);
    expect(migrated.evidence.at(-1)).toEqual({
      id: "task-schema-to-v3",
      recordedAt: NOW,
      result: "pass",
      summary: "Migrated TaskRecord schema to v3 with explicit authorization.",
      artifactPaths: [`.harnix/tasks/${TASK_ID}/task.json`],
    });
    expect(migrated.updatedAt).toBe(NOW);
  });

  it("takes criterionIds and inputs for a v1 check from the stdin overrides", async () => {
    const root = await temporaryRepository();
    await activate(root, legacyTask("in_progress", "implementing"));

    const migrated = await migrateToV3Workflow(
      root,
      { checks: { check: { criterionIds: ["a"], inputs: ["src/**/*.ts", "src/**"] } } },
      NOW,
    );

    expect(migrated.validationPlan[0]).toMatchObject({
      id: "check",
      command: "pnpm test",
      criterionIds: ["a"],
      inputs: ["src/**", "src/**/*.ts"],
    });
  });

  it("refuses to guess: lists every required check that still needs criterionIds or inputs", async () => {
    const root = await temporaryRepository();
    await activate(root, legacyTask("in_progress", "implementing"));

    await expect(migrateToV3Workflow(root, undefined, NOW)).rejects.toThrow(/check \(criterionIds, inputs\)/u);
    await expect(migrateToV3Workflow(root, { checks: { check: { criterionIds: ["a"] } } }, NOW)).rejects.toThrow(
      /check \(inputs\)/u,
    );
  });

  it("rejects malformed overrides", async () => {
    const root = await temporaryRepository();
    await activate(root, legacyTask("in_progress", "implementing"));

    await expect(migrateToV3Workflow(root, { nope: 1 }, NOW)).rejects.toThrow(/migration/iu);
    await expect(migrateToV3Workflow(root, { checks: { check: { criterionIds: "a" } } }, NOW)).rejects.toThrow(
      /criterionIds/u,
    );
  });

  it("rejects a v3 task, a completed task and a blocked task", async () => {
    const v3Root = await temporaryRepository();
    const { implementingTaskV3 } = await import("test/support/workflow-fixtures.js");
    await implementingTaskV3(v3Root);
    await expect(migrateToV3Workflow(v3Root, undefined, NOW)).rejects.toThrow(/already/u);

    const doneRoot = await temporaryRepository();
    await activate(
      doneRoot,
      buildTaskV1({
        id: TASK_ID,
        status: "completed",
        checkpoint: "finishing",
        completedAt: "2026-09-30T00:00:00.000Z",
        acceptanceCriteria: [buildCriterion({ id: "a", text: "done", status: "met", evidenceIds: ["e"] })],
        validationPlan: [{ id: "check", description: "verify", scope: "full", required: true }],
        evidence: [
          {
            id: "e",
            checkId: "check",
            recordedAt: "2026-09-29T00:10:00.000Z",
            result: "pass",
            summary: "ok",
            artifactPaths: [],
          },
        ],
      }),
    );
    await expect(migrateToV3Workflow(doneRoot, undefined, NOW)).rejects.toThrow(/unfinished/u);

    const blockedRoot = await temporaryRepository();
    await activate(
      blockedRoot,
      buildTaskV1({
        id: TASK_ID,
        status: "blocked",
        checkpoint: "planning",
        blocker: { kind: "decision", summary: "wait", nextAction: "ask", resumeStatus: "planning" },
      }),
    );
    await expect(migrateToV3Workflow(blockedRoot, undefined, NOW)).rejects.toThrow(/unfinished/u);
  });

  it("requires an active task", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    await expect(migrateToV3Workflow(root, undefined, NOW)).rejects.toThrow(/active task/u);
  });
});
