import { monthBucket, listTaskIds, taskFilePath } from "src/core/tasks/task-location.js";
import { loadTask, type TaskRecord } from "src/core/tasks/task.js";
import { mapWithLimit } from "src/utils/concurrency.js";

export interface EpicMember {
  id: string;
  status: string;
  mode: string;
  title: string;
  goal: string;
  acceptanceCriteriaCount: number;
}

export interface EpicMemberOptions {
  /** Task loader; injected so a test can count reads. */
  load?: (path: string) => Promise<TaskRecord>;
}

const READ_CONCURRENCY = 16;

/**
 * Members of every given epic from one scan of the live and archived stores. A member's ID is never earlier than its
 * epic's, so the scan starts at the earliest epic month (no bound when an epic ID has no date prefix).
 */
export async function collectEpicMembersByEpic(
  harnixRoot: string,
  epicIds: readonly string[],
  options: EpicMemberOptions = {},
): Promise<Map<string, EpicMember[]>> {
  const grouped = new Map<string, EpicMember[]>(epicIds.map((epicId) => [epicId, []]));
  const months = epicIds.map((epicId) => monthBucket(epicId));
  const fromMonth = months.includes(undefined) ? undefined : (months as string[]).sort()[0];
  let ids: string[];
  try {
    ids = await listTaskIds(harnixRoot, { scope: "all", ...(fromMonth === undefined ? {} : { fromMonth }) });
  } catch {
    return grouped;
  }
  const load = options.load ?? loadTask;
  const members = await mapWithLimit(ids, READ_CONCURRENCY, async (id) => {
    try {
      const task = await load(await taskFilePath(harnixRoot, id, "task.json"));
      if (task.schemaVersion === 1 || task.epicId === undefined || !grouped.has(task.epicId)) return undefined;
      const member: EpicMember = {
        id,
        status: task.status,
        mode: task.mode,
        title: task.title,
        goal: task.goal,
        acceptanceCriteriaCount: task.acceptanceCriteria.length,
      };
      return { epicId: task.epicId, member };
    } catch {
      return undefined; // Skip tasks that cannot be loaded.
    }
  });
  for (const entry of members) if (entry !== undefined) grouped.get(entry.epicId)?.push(entry.member);
  return grouped;
}

/** Tasks (schema v2+) that carry this epicId, live or archived, ordered by task ID; unreadable records are skipped. */
export async function collectEpicMembers(harnixRoot: string, epicId: string): Promise<EpicMember[]> {
  return (await collectEpicMembersByEpic(harnixRoot, [epicId])).get(epicId) ?? [];
}

export function nextEpicMember<T extends { status: string }>(members: readonly T[]): T | null {
  return members.find((member) => member.status !== "completed" && member.status !== "cancelled") ?? null;
}
