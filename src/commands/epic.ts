import { compareCodeUnits } from "src/utils/order.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import {
  collectEpicMembers,
  collectEpicMembersByEpic,
  listEpicIds,
  nextEpicMember,
  loadEpicOrThrow,
  type EpicRecord,
} from "src/core/epics/epic.js";
import { orderEpicMembers } from "src/core/epics/order.js";

export interface PublicEpicListResult {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly epics: readonly EpicSummary[];
  readonly total: number;
}

export interface PublicEpicDetailResult {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly epic: EpicRecord;
  readonly members: readonly EpicTaskMember[];
  readonly nextTask: EpicTaskMember | null;
}

export interface EpicSummary {
  readonly id: string;
  readonly title: string;
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly cancelledTasks: number;
}

export interface EpicTaskMember {
  readonly id: string;
  readonly status: string;
  readonly mode?: string;
  readonly title?: string;
  readonly goal?: string;
}

export async function listPublicEpics(root: string, limit: number, archived = false): Promise<PublicEpicListResult> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  // Listed by descending ID: an ID that starts with its creation time (the convention) puts the newest first.
  const ids = (await listEpicIds(harnixRoot, { scope: archived ? "archive" : "live" })).reverse();
  // `total` counts only the epics that load, so it agrees with what a larger --limit would list.
  let total = 0;
  const shown: { id: string; title: string }[] = [];
  for (const epicId of ids) {
    try {
      const epic = await loadEpicOrThrow(harnixRoot, epicId);
      total += 1;
      if (shown.length < limit) shown.push({ id: epicId, title: epic.title });
    } catch {
      // Skip epics that cannot be loaded.
    }
  }
  const members = await collectEpicMembersByEpic(
    harnixRoot,
    shown.map((epic) => epic.id),
  );
  const epics: EpicSummary[] = shown.map(({ id, title }) => {
    const own = members.get(id) ?? [];
    return {
      id,
      title,
      totalTasks: own.length,
      completedTasks: own.filter((member) => member.status === "completed").length,
      cancelledTasks: own.filter((member) => member.status === "cancelled").length,
    };
  });
  return { generator: "harnix", schemaVersion: 1, epics, total };
}

/** Identity and progress only: no prose, so an agent can follow an epic without paying for every member's goal. */
export interface PublicEpicBriefResult {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly epic: Pick<EpicRecord, "id" | "title">;
  readonly counts: Readonly<Record<string, number>>;
  readonly members: readonly { readonly id: string; readonly status: string }[];
  readonly nextTask: { readonly id: string; readonly status: string; readonly title?: string } | null;
}

export async function detailPublicEpic(
  root: string,
  epicId: string,
  brief = false,
): Promise<PublicEpicDetailResult | PublicEpicBriefResult> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const epic = await loadEpicOrThrow(harnixRoot, epicId);
  const members = orderEpicMembers(await collectEpicMembers(harnixRoot, epicId), epic.order).map(
    ({ id, status, mode, title, goal }) => ({
      id,
      status,
      mode,
      title,
      goal,
    }),
  );
  const nextTask = nextEpicMember(members);
  if (!brief) return { generator: "harnix", schemaVersion: 1, epic, members, nextTask };
  const counts: Record<string, number> = {};
  for (const { status } of members) counts[status] = (counts[status] ?? 0) + 1;
  return {
    generator: "harnix",
    schemaVersion: 1,
    epic: { id: epic.id, title: epic.title },
    counts: Object.fromEntries(Object.entries(counts).sort(([left], [right]) => compareCodeUnits(left, right))),
    members: members.map(({ id, status }) => ({ id, status })),
    nextTask:
      nextTask === null
        ? null
        : {
            id: nextTask.id,
            status: nextTask.status,
            ...(nextTask.title === undefined ? {} : { title: nextTask.title }),
          },
  };
}
