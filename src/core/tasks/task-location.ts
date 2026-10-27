import { readdir, stat } from "node:fs/promises";
import { resolveSafeProjectPath } from "src/utils/paths.js";
import { isMissing, TaskValidationError } from "./task-validate-common.js";

/** Read-only store below `tasks/` and `epics/`; its children are month buckets. */
export const ARCHIVE_DIRECTORY = "_archive";

export type StorageKind = "bucket" | "legacy" | "archive";

/** Which stores a listing reads: live tasks (bucket + flat), the archive, or both. */
export type ListScope = "live" | "archive" | "all";

export interface TaskLocation {
  readonly kind: StorageKind;
  readonly directory: string;
}

const taskIdPattern = /^\d{8}-\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
/** A task folder name: one safe path segment (the strict task ID grammar is checked where records are read). */
const segmentPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const bucketPattern = /^\d{4}-(?:0[1-9]|1[0-2])$/u;

/** `YYYY-MM` taken from the date prefix of a task or epic ID; undefined when the ID carries no valid month. */
export function monthBucket(id: string): string | undefined {
  const bucket = /^(\d{4})(\d{2})/u.exec(id);
  if (bucket === null) return undefined;
  const candidate = `${bucket[1]}-${bucket[2]}`;
  return bucketPattern.test(candidate) ? candidate : undefined;
}

export function isMonthBucket(name: string): boolean {
  return bucketPattern.test(name);
}

/** Path persisted in evidence and used by the digest exemption: it names a task whatever its physical layout. */
export function taskLogicalPath(taskId: string, file: string): string {
  return `.harnix/tasks/${taskId}/${file}`;
}

/** Path shown in diagnostics (relative to `.harnix`); like the logical path it ignores the physical layout. */
export function taskDisplayPath(taskId: string, file: string): string {
  return `tasks/${taskId}/${file}`;
}

export async function directoryExists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch (error: unknown) {
    if (isMissing(error)) return false;
    throw error;
  }
}

function candidates(taskId: string): { kind: StorageKind; path: string }[] {
  const month = monthBucket(taskId);
  return [
    ...(month === undefined ? [] : [{ kind: "bucket" as const, path: `tasks/${month}/${taskId}` }]),
    { kind: "legacy", path: `tasks/${taskId}` },
    ...(month === undefined
      ? []
      : [{ kind: "archive" as const, path: `tasks/${ARCHIVE_DIRECTORY}/${month}/${taskId}` }]),
  ];
}

async function locateRelative(
  harnixRoot: string,
  taskId: string,
): Promise<{ kind: StorageKind; relative: string } | undefined> {
  if (!segmentPattern.test(taskId)) throw new TaskValidationError("Task ID is unsafe.");
  for (const candidate of candidates(taskId)) {
    if (await directoryExists(await resolveSafeProjectPath(harnixRoot, candidate.path)))
      return { kind: candidate.kind, relative: candidate.path };
  }
  return undefined;
}

/** Where a task lives now: month bucket first, then the flat layout, then the archive; undefined when absent. */
export async function locateTask(harnixRoot: string, taskId: string): Promise<TaskLocation | undefined> {
  const found = await locateRelative(harnixRoot, taskId);
  if (found === undefined) return undefined;
  return { kind: found.kind, directory: await resolveSafeProjectPath(harnixRoot, found.relative) };
}

export async function taskRelativeDirectory(harnixRoot: string, taskId: string): Promise<string> {
  const found = await locateRelative(harnixRoot, taskId);
  if (found !== undefined) return found.relative;
  const month = monthBucket(taskId);
  return month === undefined ? `tasks/${taskId}` : `tasks/${month}/${taskId}`;
}

/** Directory of an existing task wherever it is, otherwise where a new task is created (its month bucket). */
export async function resolveTaskDirectory(harnixRoot: string, taskId: string): Promise<string> {
  return resolveSafeProjectPath(harnixRoot, await taskRelativeDirectory(harnixRoot, taskId));
}

export async function taskFilePath(harnixRoot: string, taskId: string, file: string): Promise<string> {
  return resolveSafeProjectPath(harnixRoot, `${await taskRelativeDirectory(harnixRoot, taskId)}/${file}`);
}

async function childNames(path: string): Promise<{ name: string; directory: boolean }[]> {
  try {
    return (await readdir(path, { withFileTypes: true })).map((entry) => ({
      name: entry.name,
      directory: entry.isDirectory(),
    }));
  } catch (error: unknown) {
    if (isMissing(error)) return [];
    throw error;
  }
}

async function bucketIds(root: string, base: string, fromMonth: string | undefined): Promise<string[]> {
  const ids: string[] = [];
  for (const bucket of await childNames(await resolveSafeProjectPath(root, base))) {
    if (!bucket.directory || !isMonthBucket(bucket.name) || (fromMonth !== undefined && bucket.name < fromMonth))
      continue;
    for (const child of await childNames(await resolveSafeProjectPath(root, `${base}/${bucket.name}`)))
      if (child.directory && taskIdPattern.test(child.name)) ids.push(child.name);
  }
  return ids;
}

function beforeMonth(id: string, fromMonth: string | undefined): boolean {
  const month = monthBucket(id);
  return fromMonth !== undefined && month !== undefined && month < fromMonth;
}

/** Sorted unique task IDs in the requested stores, from `fromMonth` (`YYYY-MM`) onward when given; the live store is the month buckets plus the flat layout. */
export async function listTaskIds(
  harnixRoot: string,
  options: { scope?: ListScope; fromMonth?: string } = {},
): Promise<string[]> {
  const scope = options.scope ?? "live";
  const ids = new Set<string>();
  if (scope !== "archive") {
    for (const child of await childNames(await resolveSafeProjectPath(harnixRoot, "tasks")))
      if (child.directory && taskIdPattern.test(child.name) && !beforeMonth(child.name, options.fromMonth))
        ids.add(child.name);
    for (const id of await bucketIds(harnixRoot, "tasks", options.fromMonth)) ids.add(id);
  }
  if (scope !== "live")
    for (const id of await bucketIds(harnixRoot, `tasks/${ARCHIVE_DIRECTORY}`, options.fromMonth)) ids.add(id);
  return [...ids].sort();
}

/** Names of every task folder in the live store, valid IDs or not, so `doctor` can report the broken ones. */
export async function listTaskDirectoryNames(harnixRoot: string): Promise<string[]> {
  const names = new Set<string>();
  for (const child of await childNames(await resolveSafeProjectPath(harnixRoot, "tasks"))) {
    if (!child.directory || child.name === ARCHIVE_DIRECTORY) continue;
    if (!isMonthBucket(child.name)) {
      names.add(child.name);
      continue;
    }
    for (const inner of await childNames(await resolveSafeProjectPath(harnixRoot, `tasks/${child.name}`)))
      if (inner.directory) names.add(inner.name);
  }
  return [...names].sort();
}

/** Every repository-relative spelling of one task file: logical, month bucket and archive. */
export function taskPhysicalPaths(taskId: string, file: string): string[] {
  const month = monthBucket(taskId);
  return [
    taskLogicalPath(taskId, file),
    ...(month === undefined
      ? []
      : [`.harnix/tasks/${month}/${taskId}/${file}`, `.harnix/tasks/${ARCHIVE_DIRECTORY}/${month}/${taskId}/${file}`]),
  ];
}

/** Task folders still in the flat layout (`tasks/<id>`), which the storage migration moves into month buckets. */
export async function listLegacyTaskIds(harnixRoot: string): Promise<string[]> {
  const ids = (await childNames(await resolveSafeProjectPath(harnixRoot, "tasks")))
    .filter((child) => child.directory && taskIdPattern.test(child.name))
    .map((child) => child.name);
  return ids.sort();
}

/** The read-only archive refuses workflow writes; the message names the command that brings the task back. */
export async function assertTaskWritable(harnixRoot: string, taskId: string): Promise<void> {
  if ((await locateTask(harnixRoot, taskId))?.kind === "archive")
    throw new TaskValidationError(`Task ${taskId} is archived and read-only; run harnix archive --restore ${taskId}.`);
}

/** Repository-relative (to `.harnix`) folder of a task in the archive or in its month bucket, for moves. */
export function taskStorePath(taskId: string, store: "archive" | "bucket"): string {
  const month = monthBucket(taskId);
  if (month === undefined) throw new TaskValidationError("Task ID has no month and cannot be moved.");
  return store === "archive" ? `tasks/${ARCHIVE_DIRECTORY}/${month}/${taskId}` : `tasks/${month}/${taskId}`;
}
