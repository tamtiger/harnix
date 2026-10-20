import { access } from "node:fs/promises";

import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { refreshRepoMap } from "./service.js";
import { readRepoMap } from "./store.js";
import type { RepoMapV1 } from "./types.js";

export const WORKSPACE_ROOT_NOT_INITIALIZED = "workspace root is not initialized: run harnix init";
export const MISSING_CACHE_HINT = 'Run "harnix repo-map --refresh" at the workspace root or inside this member.';

export type WorkspaceRootCache = { status: "ready"; map: RepoMapV1 } | { status: "missing" | "invalid" };

/** True when the directory holds a Harnix project (`.harnix/config.yaml`), the only place a cache may be written. */
export async function isInitializedDirectory(directory: string): Promise<boolean> {
  try {
    await access(await resolveSafeHarnixPath(directory, "config.yaml"));
    return true;
  } catch {
    return false;
  }
}

/** Reads the workspace root's own cache; a read failure is `missing` (no file) or `invalid` (unreadable or corrupt). */
export async function readWorkspaceRootCache(root: string): Promise<WorkspaceRootCache> {
  try {
    return { map: await readRepoMap(root), status: "ready" };
  } catch (error: unknown) {
    const missing = typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
    return { status: missing ? "missing" : "invalid" };
  }
}

/** The records of one member inside a root-level map, or undefined when the root cache has none under that prefix. */
export function memberSliceOfRootMap(map: RepoMapV1, memberName: string): RepoMapV1 | undefined {
  const prefix = `${memberName}/`;
  const records = map.records.filter((record) => record.path.startsWith(prefix));
  return records.length === 0 ? undefined : { ...map, records };
}

/**
 * Refreshes the workspace root cache once for members that have no project of their own. Nothing is written into an
 * uninitialized directory: when the root cannot hold the cache either, it fails before touching anything.
 */
export async function refreshWorkspaceRootCache(root: string): Promise<RepoMapV1> {
  if (!(await isInitializedDirectory(root))) throw new Error(WORKSPACE_ROOT_NOT_INITIALIZED);
  return (await refreshRepoMap({ root })).map;
}
