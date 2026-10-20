import { describe, expect, it } from "vitest";

import { resolveActiveTask } from "src/core/tasks/task.js";
import { addDecisionWorkflow, setCheckWorkflow } from "src/core/workflow/plan-edit.js";
import { removeCriterionWorkflow, removeDecisionWorkflow } from "src/core/workflow/plan-remove.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { snapshotWorkflow } from "src/core/workflow/snapshot.js";
import { buildCheck, buildCriterion, buildEvidence } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import {
  implementingTaskV3,
  initializeUtcProject,
  taskV3,
  writeProjectSource,
} from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();

async function planningWithTwoCriteria(root: string) {
  await initializeUtcProject(root);
  const base = taskV3("planning", "planning");
  const task = {
    ...base,
    acceptanceCriteria: [buildCriterion({ id: "a", text: "done" }), buildCriterion({ id: "b", text: "also" })],
    validationPlan: [
      buildCheck({ id: "check", criterionIds: ["a", "b"], inputs: ["src/**/*.ts"] }),
      buildCheck({ id: "second", criterionIds: ["b"], inputs: ["src/**/*.ts"] }),
    ],
  };
  await saveWorkflow(root, { task });
  return task;
}

describe("removeDecisionWorkflow", () => {
  it("drops one decision while the task is planning and keeps the others", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await saveWorkflow(root, { task: taskV3("planning", "planning") });
    await addDecisionWorkflow(root, { id: "dec-1", text: "một", rationale: "vì" });
    await addDecisionWorkflow(root, { id: "dec-2", text: "hai", rationale: "vì" });

    const task = await removeDecisionWorkflow(root, "dec-1");

    expect(task.decisions?.map((decision) => decision.id)).toEqual(["dec-2"]);
  });

  it("rejects an unknown decision while planning and any removal after planning", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await saveWorkflow(root, { task: taskV3("planning", "planning") });
    await expect(removeDecisionWorkflow(root, "zz")).rejects.toThrow(/zz/u);

    const frozen = await temporaryRepository();
    await implementingTaskV3(frozen);
    await addDecisionWorkflow(frozen, { id: "dec-1", text: "một", rationale: "vì" });
    await expect(removeDecisionWorkflow(frozen, "dec-1")).rejects.toThrow(/only while the task is in planning/u);
  });
});

describe("removeCriterionWorkflow", () => {
  it("drops the criterion and takes it out of every check that covered it", async () => {
    const root = await temporaryRepository();
    await planningWithTwoCriteria(root);

    const task = await removeCriterionWorkflow(root, "a");

    expect(task.acceptanceCriteria.map((criterion) => criterion.id)).toEqual(["b"]);
    expect(task.validationPlan.map((check) => [check.id, check.criterionIds])).toEqual([
      ["check", ["b"]],
      ["second", ["b"]],
    ]);
  });

  it("refuses when a required check would be left covering no criterion", async () => {
    const root = await temporaryRepository();
    await planningWithTwoCriteria(root);
    await setCheckWorkflow(root, {
      id: "only-b",
      description: "d",
      scope: "focused",
      criteria: ["b"],
      inputs: ["src/**/*.ts"],
    });

    await expect(removeCriterionWorkflow(root, "b")).rejects.toThrow(/only-b/u);
    expect((await resolveActiveTask(`${root}/.harnix`))?.acceptanceCriteria).toHaveLength(2);
  });

  it("refuses an unknown criterion and any removal after planning", async () => {
    const root = await temporaryRepository();
    await planningWithTwoCriteria(root);
    await expect(removeCriterionWorkflow(root, "zz")).rejects.toThrow(/zz/u);

    const frozen = await temporaryRepository();
    await implementingTaskV3(frozen);
    await expect(removeCriterionWorkflow(frozen, "a")).rejects.toThrow(/only while the task is in planning/u);
  });

  it("refuses a criterion whose check already recorded evidence while the task is still planning", async () => {
    const root = await temporaryRepository();
    const planning = await planningWithTwoCriteria(root);
    await writeProjectSource(root);
    const { inputDigest } = await snapshotWorkflow(root, "second");
    const evidence = buildEvidence({ id: "ev-second-1", checkId: "second", result: "fail", exitCode: 1, inputDigest });
    await saveWorkflow(root, { task: { ...planning, evidence: [evidence] } });

    await expect(removeCriterionWorkflow(root, "b")).rejects.toThrow(/check second already recorded evidence/u);
    expect((await resolveActiveTask(`${root}/.harnix`))?.acceptanceCriteria).toHaveLength(2);
  });
});
