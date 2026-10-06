import { collectEpicMembers, loadEpicOrThrow, upsertEpic, type EpicRecord } from "src/core/epics/epic.js";
import { validateEpicOrder } from "src/core/epics/order.js";
import { laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { currentInstant } from "./support.js";
import { withWorkflowLock } from "./workflow-lock.js";

/**
 * Sets the explicit run order of an epic (no ids clears it). Only the epic record and its derived page change: no task
 * file is read for writing, so a member's status, evidence and obligations stay exactly as they were.
 */
export async function setEpicOrderWorkflow(
  root: string,
  epicId: string,
  taskIds: readonly string[],
  injectedNow?: string,
): Promise<EpicRecord> {
  const now = await currentInstant(root, injectedNow);
  const harnixRoot = await resolveSafeHarnixPath(root);
  return withWorkflowLock(harnixRoot, async () => {
    const epic = await loadEpicOrThrow(harnixRoot, epicId);
    const order = validateEpicOrder([...taskIds]);
    const members = new Set((await collectEpicMembers(harnixRoot, epicId)).map((member) => member.id));
    const outside = order.filter((id) => !members.has(id));
    if (outside.length > 0) throw new Error(`Epic ${epicId} has no member task ${outside.join(", ")}.`);
    const { order: previous, ...rest } = epic;
    void previous;
    const next: EpicRecord = {
      ...rest,
      ...(order.length > 0 ? { order } : {}),
      updatedAt: laterTimestamp(epic.updatedAt, now),
    };
    await upsertEpic(root, next);
    return next;
  });
}
