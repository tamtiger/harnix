import { compareCodeUnits } from "src/utils/order.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import {
  collectEpicMembers,
  listEpicIds,
  nextEpicMember,
  loadEpicOrThrow,
  type EpicRecord,
} from "src/core/epics/epic.js";

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
  readonly title?: string;
  readonly goal?: string;
}

export async function listPublicEpics(root: string, limit: number): Promise<PublicEpicListResult> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const epics: EpicSummary[] = [];
  for (const epicId of (await listEpicIds(harnixRoot)).slice(0, limit)) {
    try {
      const epic = await loadEpicOrThrow(harnixRoot, epicId);
      const members = await collectEpicMembers(harnixRoot, epicId);
      epics.push({
        id: epicId,
        title: epic.title,
        totalTasks: members.length,
        completedTasks: members.filter((member) => member.status === "completed").length,
        cancelledTasks: members.filter((member) => member.status === "cancelled").length,
      });
    } catch {
      // Skip epics that cannot be loaded.
    }
  }
  return { generator: "harnix", schemaVersion: 1, epics, total: epics.length };
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
  const members = (await collectEpicMembers(harnixRoot, epicId)).map(({ id, status, title, goal }) => ({
    id,
    status,
    title,
    goal,
  }));
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
