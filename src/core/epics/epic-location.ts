import { access, readdir } from "node:fs/promises";
import { directoryExists, isMonthBucket, monthBucket, ARCHIVE_DIRECTORY } from "src/core/tasks/task-location.js";
import type { ListScope, StorageKind } from "src/core/tasks/task-location.js";
import { isMissing } from "src/core/tasks/task-validate-common.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";

export const EPICS_DIRECTORY = "epics";
/** Pre-2.0 directory name; still read as a fallback until `harnix update` moves the files. */
export const LEGACY_EPICS_DIRECTORY = "roadmaps";

export interface EpicFileLocation {
  readonly kind: StorageKind;
  readonly path: string;
}

/** Path persisted in references to an epic file; it names the epic whatever its physical layout. */
export function epicLogicalPath(epicId: string, file: string): string {
  return `.harnix/${EPICS_DIRECTORY}/${epicId}/${file}`;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function folderPaths(epicId: string): { kind: StorageKind; path: string }[] {
  const month = monthBucket(epicId);
  return [
    ...(month === undefined ? [] : [{ kind: "bucket" as const, path: `${EPICS_DIRECTORY}/${month}/${epicId}` }]),
    { kind: "legacy", path: `${EPICS_DIRECTORY}/${epicId}` },
    ...(month === undefined
      ? []
      : [{ kind: "archive" as const, path: `${EPICS_DIRECTORY}/${ARCHIVE_DIRECTORY}/${month}/${epicId}` }]),
  ];
}

/** Epic file: bucket folder, legacy folder, flat file, roadmaps, then the archive; undefined when absent. */
export async function locateEpicFile(
  harnixRoot: string,
  epicId: string,
  extension: "json" | "md",
): Promise<EpicFileLocation | undefined> {
  const folders = folderPaths(epicId);
  for (const folder of folders.filter((candidate) => candidate.kind !== "archive")) {
    const path = await resolveSafeProjectPath(harnixRoot, `${folder.path}/epic.${extension}`);
    if (await fileExists(path)) return { kind: folder.kind, path };
    if (folder.kind === "legacy") {
      const flat = await resolveSafeProjectPath(harnixRoot, `${EPICS_DIRECTORY}/${epicId}.${extension}`);
      if (await fileExists(flat)) return { kind: "legacy", path: flat };
      const roadmap = await resolveSafeProjectPath(harnixRoot, `${LEGACY_EPICS_DIRECTORY}/${epicId}.${extension}`);
      if (await fileExists(roadmap)) return { kind: "legacy", path: roadmap };
    }
  }
  for (const folder of folders.filter((candidate) => candidate.kind === "archive")) {
    const path = await resolveSafeProjectPath(harnixRoot, `${folder.path}/epic.${extension}`);
    if (await fileExists(path)) return { kind: "archive", path };
  }
  return undefined;
}

/** Folder of an existing epic wherever it is, otherwise where a new epic is created (its month bucket). */
export async function epicFolder(harnixRoot: string, epicId: string): Promise<string> {
  for (const folder of folderPaths(epicId)) {
    const path = await resolveSafeProjectPath(harnixRoot, folder.path);
    if (await directoryExists(path)) return path;
  }
  const month = monthBucket(epicId);
  return resolveSafeProjectPath(
    harnixRoot,
    month === undefined ? `${EPICS_DIRECTORY}/${epicId}` : `${EPICS_DIRECTORY}/${month}/${epicId}`,
  );
}

async function entries(path: string): Promise<{ name: string; file: boolean; directory: boolean }[]> {
  try {
    return (await readdir(path, { withFileTypes: true })).map((entry) => ({
      name: entry.name,
      file: entry.isFile(),
      directory: entry.isDirectory(),
    }));
  } catch (error: unknown) {
    if (isMissing(error)) return [];
    throw error;
  }
}

async function folderIds(harnixRoot: string, base: string, ids: Set<string>): Promise<void> {
  for (const entry of await entries(await resolveSafeProjectPath(harnixRoot, base)))
    if (
      entry.directory &&
      (await fileExists(await resolveSafeProjectPath(harnixRoot, `${base}/${entry.name}/epic.json`)))
    )
      ids.add(entry.name);
}

async function bucketedIds(harnixRoot: string, base: string, ids: Set<string>): Promise<void> {
  for (const bucket of await entries(await resolveSafeProjectPath(harnixRoot, base)))
    if (bucket.directory && isMonthBucket(bucket.name)) await folderIds(harnixRoot, `${base}/${bucket.name}`, ids);
}

/** Sorted epic IDs from every layout; an ID present in several places is listed once. */
export async function listEpicIds(harnixRoot: string, options: { scope?: ListScope } = {}): Promise<string[]> {
  const scope = options.scope ?? "live";
  const ids = new Set<string>();
  if (scope !== "archive") {
    for (const entry of await entries(await resolveSafeProjectPath(harnixRoot, EPICS_DIRECTORY))) {
      if (entry.file && entry.name.endsWith(".json")) ids.add(entry.name.slice(0, -".json".length));
    }
    await folderIds(harnixRoot, EPICS_DIRECTORY, ids);
    await bucketedIds(harnixRoot, EPICS_DIRECTORY, ids);
    for (const entry of await entries(await resolveSafeProjectPath(harnixRoot, LEGACY_EPICS_DIRECTORY)))
      if (entry.file && entry.name.endsWith(".json")) ids.add(entry.name.slice(0, -".json".length));
  }
  if (scope !== "live") await bucketedIds(harnixRoot, `${EPICS_DIRECTORY}/${ARCHIVE_DIRECTORY}`, ids);
  return [...ids].sort();
}

/** Epic folders still in the flat layout (`epics/<id>/epic.json`) that carry a month, so they can move to a bucket. */
export async function listLegacyEpicIds(harnixRoot: string): Promise<string[]> {
  const ids = new Set<string>();
  await folderIds(harnixRoot, EPICS_DIRECTORY, ids);
  return [...ids].filter((id) => monthBucket(id) !== undefined).sort();
}

/** The read-only archive refuses writes; the message names the command that brings the epic back. */
export async function assertEpicWritable(harnixRoot: string, epicId: string): Promise<void> {
  if ((await locateEpicFile(harnixRoot, epicId, "json"))?.kind === "archive")
    throw new Error(`Epic ${epicId} is archived and read-only; run harnix archive --restore ${epicId}.`);
}

/** Folder of an epic in the archive or in its month bucket, relative to `.harnix`, for moves. */
export function epicStorePath(epicId: string, store: "archive" | "bucket"): string {
  const month = monthBucket(epicId);
  if (month === undefined) throw new Error("Epic ID has no month and cannot be moved.");
  return store === "archive"
    ? `${EPICS_DIRECTORY}/${ARCHIVE_DIRECTORY}/${month}/${epicId}`
    : `${EPICS_DIRECTORY}/${month}/${epicId}`;
}
