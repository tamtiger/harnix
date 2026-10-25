import { collectEpicMembers, listEpicIds, loadEpicRecord } from "src/core/epics/epic.js";
import { orderEpicMembers } from "src/core/epics/order.js";

export interface EpicContext {
  id: string;
  title: string;
  nextTask: { id: string; status: string; title?: string } | null;
  resumeCommand: string;
}

/** Quiet by default: only an epic with a task already in progress is worth resuming. Best effort. */
export async function findEpicContext(root: string, harnixRoot: string): Promise<EpicContext | undefined> {
  try {
    for (const epicId of await listEpicIds(harnixRoot)) {
      const epic = await loadEpicRecord(root, epicId);
      if (epic === undefined) continue;
      const members = orderEpicMembers(await collectEpicMembers(harnixRoot, epicId), epic.order);
      const next = members.find((member) => member.status === "in_progress");
      if (next !== undefined) {
        return {
          id: epicId,
          title: epic.title,
          nextTask: { id: next.id, status: next.status, title: next.title },
          resumeCommand: `harnix resume ${next.id}`,
        };
      }
    }
  } catch {
    // Best effort
  }
  return undefined;
}
