import { stat } from "node:fs/promises";

import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { extractRepoMapRecord } from "./extract.js";
import { inventoryRepository } from "./inventory.js";
import { refreshRepoMap } from "./service.js";
import { isOlderExtractorCache, readRepoMap, repoMapRelativePath } from "./store.js";
import { defaultRepoMapLimits, repoMapRefreshHint, type RepoMapInventoryFile, type RepoMapV1 } from "./types.js";
import { isMissingPathError } from "src/utils/errno.js";

/** A file stamped this long before the cache was written is still re-checked, since a refresh reads files before it writes. */
export const FRESHNESS_SLACK_MS = 5_000;
/** More suspect files than this means the cache is plainly out of date; verifying each one would only repeat a refresh. */
export const MAX_VERIFIED_FILES = 200;

export type RepoMapFreshness =
  | { readonly state: "fresh" }
  | { readonly state: "stale"; readonly added: number; readonly changed: number; readonly removed: number };

export interface FreshnessDependencies {
  /** The modification time of the cache file; injected so a test controls the clock. */
  readonly cacheMtimeMs?: (root: string) => Promise<number>;
}

/**
 * Judges whether the cache still matches the working tree without writing anything. The inventory walk only stats a
 * file already in the cache with an unchanged size and an old modification time; only the remaining suspects (new,
 * resized or recently touched files) are read and hashed, and a touched file whose content hash is unchanged is fresh.
 */
export async function repoMapFreshness(
  root: string,
  map: RepoMapV1,
  dependencies: FreshnessDependencies = {},
): Promise<RepoMapFreshness> {
  const cacheMtime = await (dependencies.cacheMtimeMs ?? readCacheMtime)(root);
  const threshold = cacheMtime - FRESHNESS_SLACK_MS;
  const records = new Map(map.records.map((record) => [record.path, record]));
  const inventory = await inventoryRepository(root, defaultRepoMapLimits, {
    isUnchanged: (path, size, mtimeMs) => {
      const record = records.get(path);
      return record !== undefined && record.byteLength === size && mtimeMs < threshold;
    },
  });
  const present = new Set(inventory.files.map(({ path }) => path));
  const suspects = inventory.files.filter((file) => isSuspect(file, records.get(file.path), threshold));
  const removed = map.records.filter(({ path }) => !present.has(path)).length;
  if (suspects.length > MAX_VERIFIED_FILES) return { state: "stale", added: 0, changed: suspects.length, removed };
  const packageRoots = inventory.files
    .filter(({ path }) => path.endsWith("package.json"))
    .map(({ path }) => (path === "package.json" ? "" : path.slice(0, -"/package.json".length)));
  let added = 0;
  let changed = 0;
  for (const file of suspects) {
    const known = records.get(file.path);
    const current = await extractRepoMapRecord(file, packageRoots);
    if (known === undefined) added += current === undefined ? 0 : 1;
    else if (current?.contentHash !== known.contentHash) changed += 1;
  }
  return added + changed + removed === 0 ? { state: "fresh" } : { state: "stale", added, changed, removed };
}

/** What a query prints when it had to refresh, or could not; a fresh cache adds nothing to the output. */
export type FreshnessNote =
  | { readonly freshness: "refreshed"; readonly added?: number; readonly changed?: number; readonly removed?: number }
  | { readonly freshness: "refreshed"; readonly reason: "older-extractor" }
  | { readonly freshness: "stale"; readonly hint: string };

export interface EnsureFreshDependencies extends FreshnessDependencies {
  readonly refresh?: (root: string) => Promise<unknown>;
}

/**
 * Makes the cache current before a query reads it: a stale cache is rebuilt exactly once, a fresh one is left
 * untouched (no write, no output change). A missing or unreadable cache keeps its existing hint, a check that cannot
 * be made claims nothing, and a failed rebuild reports `stale` with the refresh hint instead of failing the command.
 */
export async function ensureFreshRepoMap(
  root: string,
  dependencies: EnsureFreshDependencies = {},
): Promise<FreshnessNote | undefined> {
  const refresh = dependencies.refresh ?? ((target: string) => refreshRepoMap({ root: target }));
  let map: RepoMapV1;
  try {
    map = await readRepoMap(root);
  } catch (error: unknown) {
    if (isMissingPathError(error) || !(await isOlderExtractorCache(root))) return undefined;
    return rebuild(() => refresh(root), { freshness: "refreshed", reason: "older-extractor" });
  }
  let verdict: RepoMapFreshness;
  try {
    verdict = await repoMapFreshness(root, map, dependencies);
  } catch {
    return undefined;
  }
  if (verdict.state === "fresh") return undefined;
  const { added, changed, removed } = verdict;
  return rebuild(() => refresh(root), { freshness: "refreshed", added, changed, removed });
}

async function rebuild(run: () => Promise<unknown>, done: FreshnessNote): Promise<FreshnessNote> {
  try {
    await run();
    return done;
  } catch {
    return { freshness: "stale", hint: repoMapRefreshHint };
  }
}

function isSuspect(file: RepoMapInventoryFile, known: RepoMapV1["records"][number] | undefined, threshold: number) {
  if (known === undefined) return true;
  return known.byteLength !== file.byteLength || (file.mtimeMs ?? Number.POSITIVE_INFINITY) >= threshold;
}

async function readCacheMtime(root: string): Promise<number> {
  return (await stat(await resolveSafeHarnixPath(root, repoMapRelativePath))).mtimeMs;
}
