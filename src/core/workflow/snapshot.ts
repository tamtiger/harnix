import { resolveActiveTask } from "src/core/tasks/task.js";
import { computeInputDigest, type InputDigestSnapshot } from "src/core/verification/input-digest.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { noActiveTaskError } from "src/core/workflow/no-active-task.js";

/** The digest of the former formula only recognises old evidence; it is never part of the public snapshot. */
export type PublicInputDigestSnapshot = Omit<InputDigestSnapshot, "legacyInputDigest">;

export async function snapshotWorkflow(root: string, checkId: string): Promise<PublicInputDigestSnapshot> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (task === undefined) throw noActiveTaskError("Workflow verification snapshot");
  if (task.schemaVersion !== 3)
    throw new Error("Workflow verification snapshot requires TaskRecord schema v3; migrate the task first.");
  const { legacyInputDigest, ...snapshot } = await computeInputDigest(root, task, checkId);
  void legacyInputDigest;
  return snapshot;
}
