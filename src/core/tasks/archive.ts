import { mkdir, readFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { epicFolder, epicStorePath, listEpicIds, locateEpicFile } from "src/core/epics/epic-location.js";
import { withWorkflowLock } from "src/core/workflow/workflow-lock.js";
import { mapWithLimit } from "src/utils/concurrency.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";
import { errorCode, renameWithRetry, type MoveFunction } from "src/utils/rename-retry.js";
import {
  directoryExists,
  listTaskIds,
  locateTask,
  monthBucket,
  resolveTaskDirectory,
  taskStorePath,
} from "./task-location.js";
import { loadTask, type TaskRecord } from "./task.js";

const DAY_MS = 86_400_000;
const READ_CONCURRENCY = 16;
const FAILURES: Record<string, string> = { EEXIST: "destination exists", ACTIVE: "became active" };
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;

export type SkipReason =
  | "active"
  | "not-terminal"
  | "too-recent"
  | "epic-unfinished"
  | "follow-up-open"
  | "no-members"
  | "legacy-layout"
  | "archived-copy-exists"
  | "unreadable-member";

export interface ArchiveSkip {
  kind: "task" | "epic";
  id: string;
  reason: SkipReason;
}

export interface ArchivePlan {
  days: number;
  /** Standalone tasks to move. */
  tasks: string[];
  /** Epics to move, each after its members. */
  epics: string[];
  /** The still-live members of each epic in `epics`, in ID order. */
  epicMembers: Record<string, string[]>;
  skipped: ArchiveSkip[];
  /** Live task folders whose record could not be read; they are never moved. */
  invalid: string[];
}

export interface ArchiveResult {
  tasks: string[];
  epics: string[];
  /** One line per move that did not happen. */
  failed: string[];
}

interface Entry {
  task: TaskRecord;
  archived: boolean;
}

const isTerminal = (task: TaskRecord): boolean => task.status === "completed" || task.status === "cancelled";
const endedAt = (task: TaskRecord): string =>
  (task.status === "completed" ? task.completedAt : task.cancelledAt) ?? task.updatedAt;
const epicOf = (task: TaskRecord): string | undefined => (task.schemaVersion === 1 ? undefined : task.epicId);
const followUpOf = (task: TaskRecord): string | undefined => (task.schemaVersion === 3 ? task.followUpOf : undefined);

interface LoadedEntries {
  entries: Map<string, Entry>;
  invalid: string[];
  /** IDs that exist both live and in the archive; the live copy stays authoritative and is never moved. */
  duplicates: Set<string>;
  /** The epic a live but unreadable task claims, taken from its raw text, so that epic is not archived without it. */
  unreadableMembers: Map<string, string>;
}

async function readableTask(harnixRoot: string, id: string, archived: boolean): Promise<TaskRecord | undefined> {
  try {
    const directory = archived
      ? await resolveSafeProjectPath(harnixRoot, taskStorePath(id, "archive"))
      : (await locateTask(harnixRoot, id))?.directory;
    return directory === undefined ? undefined : await loadTask(`${directory}/task.json`);
  } catch {
    return undefined;
  }
}

async function claimedEpic(harnixRoot: string, id: string): Promise<string | undefined> {
  try {
    const location = await locateTask(harnixRoot, id);
    const text = await readFile(`${location?.directory ?? ""}/task.json`, "utf8");
    return /"epicId"\s*:\s*"([^"]+)"/u.exec(text)?.[1];
  } catch {
    return undefined;
  }
}

async function loadEntries(harnixRoot: string): Promise<LoadedEntries> {
  const entries = new Map<string, Entry>();
  const invalid: string[] = [];
  const duplicates = new Set<string>();
  const unreadableMembers = new Map<string, string>();
  for (const [scope, archived] of [["live", false] as const, ["archive", true] as const]) {
    const ids = await listTaskIds(harnixRoot, { scope });
    const loaded = await mapWithLimit(ids, READ_CONCURRENCY, (id) => readableTask(harnixRoot, id, archived));
    for (const [index, id] of ids.entries()) {
      const task = loaded[index];
      if (task === undefined || task.id !== id) {
        if (archived) continue;
        invalid.push(id);
        const epic = await claimedEpic(harnixRoot, id);
        if (epic !== undefined) unreadableMembers.set(id, epic);
      } else if (archived && entries.has(id)) duplicates.add(id);
      else entries.set(id, { task, archived });
    }
  }
  return { entries, invalid, duplicates, unreadableMembers };
}

async function activeTaskId(harnixRoot: string): Promise<string | undefined> {
  try {
    const value = (await readFile(await resolveSafeProjectPath(harnixRoot, "tasks/.active"), "utf8")).trim();
    return value.length === 0 ? undefined : value;
  } catch {
    return undefined;
  }
}

/** Decides what `harnix archive` would move; reads only, so a dry run and the real run agree. */
export async function planArchive(harnixRoot: string, options: { days: number; now: number }): Promise<ArchivePlan> {
  const cutoff = options.now - options.days * DAY_MS;
  const { entries, invalid, duplicates, unreadableMembers } = await loadEntries(harnixRoot);
  const brokenEpics = new Set(unreadableMembers.values());
  const active = await activeTaskId(harnixRoot);
  const plan: ArchivePlan = { days: options.days, tasks: [], epics: [], epicMembers: {}, skipped: [], invalid };
  const isOld = (task: TaskRecord): boolean => isTerminal(task) && Date.parse(endedAt(task)) < cutoff;
  const openParents = new Set(
    [...entries.values()].flatMap(({ task }) => (!isTerminal(task) ? [followUpOf(task)] : [])).filter(Boolean),
  );
  const skip = (kind: ArchiveSkip["kind"], id: string, reason: SkipReason): void => {
    plan.skipped.push({ kind, id, reason });
  };

  const epicIds = await listEpicIds(harnixRoot);
  const membersOf = new Map<string, [string, Entry][]>(epicIds.map((epicId) => [epicId, []]));
  for (const entry of [...entries].sort(([left], [right]) => (left < right ? -1 : 1)))
    membersOf.get(epicOf(entry[1].task) ?? "")?.push(entry);

  for (const epicId of epicIds) {
    const members = membersOf.get(epicId) ?? [];
    const location = await locateEpicFile(harnixRoot, epicId, "json");
    const reason = ((): SkipReason | undefined => {
      if (members.length === 0) return "no-members";
      if (location === undefined || basename(location.path) !== "epic.json" || monthBucket(epicId) === undefined)
        return "legacy-layout";
      if (brokenEpics.has(epicId)) return "unreadable-member";
      if (members.some(([id]) => duplicates.has(id))) return "archived-copy-exists";
      if (members.some(([id]) => id === active)) return "active";
      if (members.some(([, { task }]) => !isTerminal(task))) return "epic-unfinished";
      if (members.some(([, { task }]) => !isOld(task))) return "too-recent";
      if (members.some(([id]) => openParents.has(id))) return "follow-up-open";
      return undefined;
    })();
    const live = members.filter(([, { archived }]) => !archived);
    if (reason === undefined) {
      plan.epics.push(epicId);
      plan.epicMembers[epicId] = live.map(([id]) => id);
      continue;
    }
    skip("epic", epicId, reason);
    for (const [id, { task }] of live)
      skip("task", id, !isTerminal(task) ? "not-terminal" : reason === "too-recent" ? "too-recent" : "epic-unfinished");
  }

  const clustered = new Set([...membersOf.values()].flatMap((members) => members.map(([id]) => id)));
  for (const [id, { task, archived }] of [...entries].sort(([left], [right]) => (left < right ? -1 : 1))) {
    if (archived || clustered.has(id)) continue;
    if (duplicates.has(id)) skip("task", id, "archived-copy-exists");
    else if (id === active) skip("task", id, "active");
    else if (!isTerminal(task)) skip("task", id, "not-terminal");
    else if (!isOld(task)) skip("task", id, "too-recent");
    else if (openParents.has(id)) skip("task", id, "follow-up-open");
    else plan.tasks.push(id);
  }
  return plan;
}

export interface ArchiveOptions {
  /** Injectable so a test can make a move fail. */
  rename?: MoveFunction;
  /** Plans again under the workflow lock; an item the fresh plan no longer lists is left where it is. */
  replan?: () => Promise<ArchivePlan>;
}

async function moveFolder(
  harnixRoot: string,
  source: string,
  destinationRelative: string,
  options: ArchiveOptions,
): Promise<void> {
  const destination = await resolveSafeProjectPath(harnixRoot, destinationRelative);
  if (await directoryExists(destination)) throw Object.assign(new Error("destination exists"), { code: "EEXIST" });
  await mkdir(dirname(destination), { recursive: true });
  await renameWithRetry(source, destination, options.rename);
}

/** Moves the planned tasks and epics into `_archive`, epics after their members, so an interruption can resume. */
export async function applyArchive(
  harnixRoot: string,
  plan: ArchivePlan,
  options: ArchiveOptions = {},
): Promise<ArchiveResult> {
  return withWorkflowLock(harnixRoot, async () => {
    const result: ArchiveResult = { tasks: [], epics: [], failed: [] };
    const attempt = async (label: string, move: () => Promise<void>): Promise<boolean> => {
      try {
        await move();
        return true;
      } catch (error: unknown) {
        const code = errorCode(error);
        result.failed.push(`${label}: ${FAILURES[code ?? ""] ?? `rename failed (${code ?? "error"})`}`);
        return false;
      }
    };
    const fresh = options.replan === undefined ? plan : await options.replan();
    const kept = (label: string, ids: string[], current: string[]): string[] =>
      ids.filter((id) => current.includes(id) || !result.failed.push(`${label} ${id}: changed since plan`));
    const tasks = kept("task", plan.tasks, fresh.tasks);
    const epics = kept("epic", plan.epics, fresh.epics);
    const active = await activeTaskId(harnixRoot);
    const moveTask = (id: string): Promise<boolean> =>
      attempt(`task ${id}`, async () => {
        if (id === active) throw Object.assign(new Error("active"), { code: "ACTIVE" });
        const source = await resolveTaskDirectory(harnixRoot, id);
        await moveFolder(harnixRoot, source, taskStorePath(id, "archive"), options);
      });
    for (const id of tasks) if (await moveTask(id)) result.tasks.push(id);
    for (const epicId of epics) {
      let complete = true;
      for (const id of fresh.epicMembers[epicId] ?? []) complete = (await moveTask(id)) && complete;
      if (!complete) continue;
      const moved = await attempt(`epic ${epicId}`, async () => {
        const source = await epicFolder(harnixRoot, epicId);
        await moveFolder(harnixRoot, source, epicStorePath(epicId, "archive"), options);
      });
      if (moved) result.epics.push(epicId);
    }
    return result;
  });
}

export interface RestoreResult {
  kind: "task" | "epic";
  restored: string[];
}

/** Brings a task, or an epic together with its members, from `_archive` back into the month buckets. */
export async function restoreFromArchive(
  harnixRoot: string,
  id: string,
  options: ArchiveOptions = {},
): Promise<RestoreResult> {
  if (!SAFE_ID.test(id)) throw new Error(`${id} is not in the archive.`);
  return withWorkflowLock(harnixRoot, async () => {
    const restore = async (kind: "tasks" | "epics", itemId: string): Promise<void> => {
      const store = kind === "tasks" ? taskStorePath : epicStorePath;
      const source = await resolveSafeProjectPath(harnixRoot, store(itemId, "archive"));
      try {
        await moveFolder(harnixRoot, source, store(itemId, "bucket"), options);
      } catch (error: unknown) {
        throw new Error(
          `Cannot restore ${itemId}: ${errorCode(error) === "EEXIST" ? "destination exists" : "rename failed"}.`,
          { cause: error },
        );
      }
    };
    const archivedEpic = monthBucket(id) === undefined ? undefined : epicStorePath(id, "archive");
    if (archivedEpic !== undefined && (await directoryExists(await resolveSafeProjectPath(harnixRoot, archivedEpic)))) {
      const members: string[] = [];
      for (const taskId of await listTaskIds(harnixRoot, { scope: "archive" })) {
        const location = await locateTask(harnixRoot, taskId);
        if (location !== undefined && epicOf(await loadTask(`${location.directory}/task.json`)) === id)
          members.push(taskId);
      }
      for (const taskId of members) await restore("tasks", taskId);
      await restore("epics", id);
      return { kind: "epic", restored: [id, ...members] };
    }
    const directory =
      monthBucket(id) === undefined
        ? undefined
        : await resolveSafeProjectPath(harnixRoot, taskStorePath(id, "archive"));
    if (directory === undefined || !(await directoryExists(directory))) throw new Error(`${id} is not in the archive.`);
    const parent = epicOf(await loadTask(`${directory}/task.json`));
    if (
      parent !== undefined &&
      monthBucket(parent) !== undefined &&
      (await directoryExists(await resolveSafeProjectPath(harnixRoot, epicStorePath(parent, "archive"))))
    )
      throw new Error(`Task ${id} belongs to the archived epic ${parent}; restore the epic ${parent} instead.`);
    await restore("tasks", id);
    return { kind: "task", restored: [id] };
  });
}
