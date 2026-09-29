import { resolveActiveTask, type TaskRecord } from "src/core/tasks/task.js";
import { laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";

/**
 * Bounded partial transport. It never accepts a task body: the persisted
 * active record is the only source, so a stage owner cannot drop evidence or
 * silently rewrite an obligation while changing state. Every guard, lock and
 * immutability rule of the full save path still applies.
 */
export async function transitionWorkflow(
  root: string,
  status: string,
  checkpoint: string,
  injectedNow?: string,
): Promise<TaskRecord> {
  const now = await currentInstant(root, injectedNow);
  if (status === "cancelled") throw new Error("Workflow cancellation must use workflow --cancel.");
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow transition requires an active task.");
  return saveWorkflow(root, { task: { ...task, status, checkpoint, updatedAt: laterTimestamp(task.updatedAt, now) } });
}
