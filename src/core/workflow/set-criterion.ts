import type { TaskRecordV3 } from "src/core/tasks/task.js";
import { activeV3, saveObligationEdit, type PlanEditOptions } from "./plan-edit.js";
import { currentInstant } from "./support.js";

/**
 * Rewrites the text of one criterion. A draft in planning is an ordinary save; afterwards it is the guarded replan save
 * with a reason, and a criterion that recorded check evidence maps stays immutable (the save refuses it).
 */
export async function setCriterionWorkflow(
  root: string,
  input: { id: string; text: string },
  options: PlanEditOptions = {},
  injectedNow?: string,
): Promise<TaskRecordV3> {
  const now = await currentInstant(root, injectedNow);
  const task = await activeV3(root);
  const text = input.text.trim();
  if (text === "") throw new Error("--text must not be empty.");
  if (!task.acceptanceCriteria.some((criterion) => criterion.id === input.id))
    throw new Error(`Acceptance criterion ${input.id} does not exist.`);
  const acceptanceCriteria = task.acceptanceCriteria.map((criterion) =>
    criterion.id === input.id ? { ...criterion, text } : criterion,
  );
  return saveObligationEdit(root, task, { ...task, acceptanceCriteria }, options, now);
}
