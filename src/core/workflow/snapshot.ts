import { resolveActiveTask } from "src/core/tasks/task.js";
import { computeInputDigest, type InputDigestSnapshot } from "src/core/verification/input-digest.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";

export async function snapshotWorkflow(root: string, checkId: string): Promise<InputDigestSnapshot> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (task === undefined) throw new Error("Workflow verification snapshot requires an active task.");
  if (task.schemaVersion !== 3)
    throw new Error("Workflow verification snapshot requires TaskRecord schema v3; migrate the task first.");
  return computeInputDigest(root, task, checkId);
}
