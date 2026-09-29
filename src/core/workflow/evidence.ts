import { resolveActiveTask, type TaskRecord } from "src/core/tasks/task.js";
import { laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { validateEvidenceEnvelope } from "./envelope.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";

/**
 * Appends exactly one evidence item to the active task. Existing evidence is
 * never sent by the caller, so a malformed round-trip cannot erase history.
 */
export async function appendEvidenceWorkflow(
  root: string,
  envelope: unknown,
  injectedNow?: string,
): Promise<TaskRecord> {
  const now = await currentInstant(root, injectedNow);
  const evidence = validateEvidenceEnvelope(envelope);
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow evidence capture requires an active task.");
  return saveWorkflow(root, {
    task: { ...task, evidence: [...task.evidence, evidence], updatedAt: laterTimestamp(task.updatedAt, now) },
  });
}
