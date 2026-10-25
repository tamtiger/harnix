import { describe, expect, it } from "vitest";

import { EDIT_HANDLERS } from "src/commands/workflow-edit-handlers.js";
import type { WorkflowContext } from "src/commands/workflow-handlers.js";
import { addDecisionWorkflow, addRiskWorkflow } from "src/core/workflow/plan-edit.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { buildCheck, buildCriterion } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, loadPersistedTask, taskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();

const context = (root: string, flags: WorkflowContext["flags"]): WorkflowContext => ({
  root,
  flags,
  operands: [],
  options: {},
});

describe("workflow edit handlers", () => {
  it("exposes the removal actions", () => {
    expect(Object.keys(EDIT_HANDLERS).sort()).toEqual(["removeCriterion", "removeDecision", "removeRisk"]);
  });

  it("removeDecision drops the decision and --brief reports only the state", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const task = taskV3("planning", "planning");
    await saveWorkflow(root, { task });
    await addDecisionWorkflow(root, { id: "dec-1", text: "một", rationale: "vì" });

    const result = await EDIT_HANDLERS.removeDecision!(context(root, { removeDecision: "dec-1", brief: true }));

    expect(Object.keys(result as object).sort()).toEqual(["checkpoint", "id", "status", "updatedAt"]);
    expect(((await loadPersistedTask(root, task.id)) as { decisions?: unknown[] }).decisions ?? []).toEqual([]);
  });

  it("removeCriterion reports an unknown criterion", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await saveWorkflow(root, { task: taskV3("planning", "planning") });

    await expect(EDIT_HANDLERS.removeCriterion!(context(root, { removeCriterion: "zz" }))).rejects.toThrow(/zz/u);
  });

  it("removeCriterion drops the criterion and takes it out of its checks, reporting the brief state", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const base = taskV3("planning", "planning");
    const task = {
      ...base,
      acceptanceCriteria: [buildCriterion({ id: "a", text: "done" }), buildCriterion({ id: "b", text: "also" })],
      validationPlan: [buildCheck({ id: "check", criterionIds: ["a", "b"], inputs: ["src/**/*.ts"] })],
    };
    await saveWorkflow(root, { task });

    const result = await EDIT_HANDLERS.removeCriterion!(context(root, { removeCriterion: "b", brief: true }));

    expect(Object.keys(result as object).sort()).toEqual(["checkpoint", "id", "status", "updatedAt"]);
    const persisted = (await loadPersistedTask(root, task.id)) as {
      acceptanceCriteria: { id: string }[];
      validationPlan: { criterionIds: string[] }[];
    };
    expect(persisted.acceptanceCriteria.map((criterion) => criterion.id)).toEqual(["a"]);
    expect(persisted.validationPlan[0]?.criterionIds).toEqual(["a"]);
  });

  it("removeRisk drops the residual risk and reports the brief state", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const task = taskV3("planning", "planning");
    await saveWorkflow(root, { task });
    await addRiskWorkflow(root, { id: "r-1", text: "mapping chưa chốt" });

    const result = await EDIT_HANDLERS.removeRisk!(context(root, { removeRisk: "r-1", brief: true }));

    expect(Object.keys(result as object).sort()).toEqual(["checkpoint", "id", "status", "updatedAt"]);
    expect(((await loadPersistedTask(root, task.id)) as { residualRisks?: unknown[] }).residualRisks ?? []).toEqual([]);
  });
});
