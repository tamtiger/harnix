import { extractRepoMapRecord } from "./extract.js";
import { inventoryRepository } from "./inventory.js";
import { createRepoMap, readRepoMap, writeRepoMap } from "./store.js";
import { searchRepoMap } from "./search.js";
import { defaultRepoMapLimits, type RepoMapLimits, type RepoMapQueryResult, type RepoMapQuerySignals, type RepoMapV1 } from "./types.js";

export interface RefreshRepoMapOptions {
  root: string;
  limits?: RepoMapLimits | undefined;
}

export interface QueryRepoMapOptions {
  root: string;
  query: string;
  limit?: number | undefined;
  signals?: RepoMapQuerySignals | undefined;
}

export type QueryRepoMapResult = { status: "ready"; map: RepoMapV1; results: RepoMapQueryResult[] } | { status: "missing" | "invalid"; results: [] };
export type RepoMapHealth = "ready" | "missing" | "invalid" | "stale";

export async function refreshRepoMap(options: RefreshRepoMapOptions): Promise<{ map: RepoMapV1; skipped: string[] }> {
  const inventory = await inventoryRepository(options.root, options.limits ?? defaultRepoMapLimits);
  const packageRoots = inventory.files.filter(({ path }) => path.endsWith("package.json")).map(({ path }) => path === "package.json" ? "" : path.slice(0, -"/package.json".length));
  const previousRecords = await readPreviousRecords(options.root);
  const records = (await mapConcurrent(inventory.files, async (file) => {
    const record = await extractRepoMapRecord(file, packageRoots);
    if (record === undefined) return undefined;
    const previous = previousRecords.get(record.path);
    return previous?.contentHash === record.contentHash ? previous : record;
  }, options.limits?.concurrency ?? defaultRepoMapLimits.concurrency)).flatMap((record) => record === undefined ? [] : [record]);
  const map = createRepoMap(records);
  await writeRepoMap(options.root, map);
  return { map, skipped: inventory.skipped };
}

export async function queryRepoMap(options: QueryRepoMapOptions): Promise<QueryRepoMapResult> {
  let map: RepoMapV1;
  try { map = await readRepoMap(options.root); }
  catch (error: unknown) {
    return isMissing(error) ? { results: [], status: "missing" } : { results: [], status: "invalid" };
  }
  return { map, results: searchRepoMap(map, options.query, options.limit ?? 20, options.signals), status: "ready" };
}

/** Explicit doctor inventory: scans safely but never writes or refreshes the cache. */
export async function diagnoseRepoMap(root: string): Promise<RepoMapHealth> {
  let current: RepoMapV1;
  try { current = await readRepoMap(root); }
  catch (error: unknown) { return isMissing(error) ? "missing" : "invalid"; }
  const inventory = await inventoryRepository(root);
  const packageRoots = inventory.files.filter(({ path }) => path.endsWith("package.json")).map(({ path }) => path === "package.json" ? "" : path.slice(0, -"/package.json".length));
  const records = (await mapConcurrent(inventory.files, (file) => extractRepoMapRecord(file, packageRoots), defaultRepoMapLimits.concurrency)).flatMap((record) => record === undefined ? [] : [record]);
  return createRepoMap(records).inventoryFingerprint === current.inventoryFingerprint ? "ready" : "stale";
}

async function mapConcurrent<T, U>(values: readonly T[], callback: (value: T) => Promise<U>, concurrency: number): Promise<U[]> {
  const results = new Array<U>(values.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= values.length) return;
      const value = values[index];
      if (value !== undefined) results[index] = await callback(value);
    }
  }));
  return results;
}

function isMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

async function readPreviousRecords(root: string): Promise<ReadonlyMap<string, RepoMapV1["records"][number]>> {
  try { return new Map((await readRepoMap(root)).records.map((record) => [record.path, record])); }
  catch { return new Map(); }
}
