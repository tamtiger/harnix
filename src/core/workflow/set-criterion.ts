import type { TaskRecordV3 } from "src/core/tasks/task.js";
import { laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { activeV3, saveObligationEdit, type PlanEditOptions } from "./plan-edit.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";

/**
 * A Lite task still implementing with no evidence recorded has nothing to protect, so the revision goes straight back
 * through ready to implementing (the contract revision already carries the reason as the trace).
 */
async function resumeImplementing(root: string, revised: TaskRecordV3, now: string): Promise<TaskRecordV3> {
  const ready = (await saveWorkflow(root, {
    task: { ...revised, status: "ready", checkpoint: "ready", updatedAt: laterTimestamp(revised.updatedAt, now) },
  })) as TaskRecordV3;
  return (await saveWorkflow(root, {
    task: {
      ...ready,
      status: "in_progress",
      checkpoint: "implementing",
      updatedAt: laterTimestamp(ready.updatedAt, now),
    },
  })) as TaskRecordV3;
}

/**
 * Rewrites the text of one criterion. A draft in planning is an ordinary save; afterwards it is the guarded replan save
 * with a reason (a Lite task implementing without evidence resumes implementing by itself), and a criterion that
 * recorded check evidence maps stays immutable (the save refuses it).
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
    criterion.id === input.id ? { ...criterion, text, status: "pending" as const, evidenceIds: [] } : criterion,
  );
  const revised = await saveObligationEdit(root, task, { ...task, acceptanceCriteria }, options, now);
  const resumable =
    task.mode === "lite" &&
    task.status === "in_progress" &&
    task.checkpoint === "implementing" &&
    task.evidence.length === 0;
  return resumable ? resumeImplementing(root, revised, now) : revised;
}
