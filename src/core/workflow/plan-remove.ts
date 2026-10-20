import type { TaskRecordV3 } from "src/core/tasks/task.js";
import { laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { activeV3 } from "./plan-edit.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";

/** Removal is a planning-time cleanup: once the task leaves planning its obligations and notes are frozen history. */
function requirePlanning(task: TaskRecordV3, what: string): void {
  if (task.status !== "planning") throw new Error(`Removing ${what} is allowed only while the task is in planning.`);
}

/** Drops one decision (review data) while the task is still in planning, for example one a later decision replaced. */
export async function removeDecisionWorkflow(root: string, id: string, injectedNow?: string): Promise<TaskRecordV3> {
  const now = await currentInstant(root, injectedNow);
  const task = await activeV3(root);
  requirePlanning(task, "a decision");
  const decisions = task.decisions ?? [];
  if (!decisions.some((decision) => decision.id === id)) throw new Error(`Decision ${id} does not exist.`);
  return (await saveWorkflow(root, {
    task: {
      ...task,
      decisions: decisions.filter((decision) => decision.id !== id),
      updatedAt: laterTimestamp(task.updatedAt, now),
    },
  })) as TaskRecordV3;
}

/**
 * Drops one acceptance criterion while the task is still in planning and takes it out of every check that covered
 * it. It refuses when a check of the criterion already recorded evidence, or when a required check would be left with
 * no criterion; the ordinary save then validates the result like any other edit.
 */
export async function removeCriterionWorkflow(root: string, id: string, injectedNow?: string): Promise<TaskRecordV3> {
  const now = await currentInstant(root, injectedNow);
  const task = await activeV3(root);
  requirePlanning(task, "an acceptance criterion");
  if (!task.acceptanceCriteria.some((criterion) => criterion.id === id))
    throw new Error(`Acceptance criterion ${id} does not exist.`);
  const covering = task.validationPlan.filter((check) => check.criterionIds.includes(id));
  const recorded = covering.find((check) => task.evidence.some((evidence) => evidence.checkId === check.id));
  if (recorded !== undefined)
    throw new Error(`Acceptance criterion ${id} cannot be removed: check ${recorded.id} already recorded evidence.`);
  const emptied = covering.filter(
    (check) => check.required && check.criterionIds.every((criterionId) => criterionId === id),
  );
  if (emptied.length > 0)
    throw new Error(
      `Acceptance criterion ${id} cannot be removed: required check(s) ${emptied.map((check) => check.id).join(", ")} would cover no criterion; edit or retire them first.`,
    );
  return (await saveWorkflow(root, {
    task: {
      ...task,
      acceptanceCriteria: task.acceptanceCriteria.filter((criterion) => criterion.id !== id),
      validationPlan: task.validationPlan.map((check) => ({
        ...check,
        criterionIds: check.criterionIds.filter((criterionId) => criterionId !== id),
      })),
      updatedAt: laterTimestamp(task.updatedAt, now),
    },
  })) as TaskRecordV3;
}
