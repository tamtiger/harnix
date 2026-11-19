import { extractRepoMapFile, extractRepoMapRecord } from "./extract.js";
import { attachReferences } from "./references.js";
import { inventoryRepository } from "./inventory.js";
import { createRepoMap, isOlderExtractorCache, readRepoMap, writeRepoMap } from "./store.js";
import { searchRepoMap } from "./search.js";
import { withMatchedSymbols } from "./symbol-matches.js";
import {
  createRepoMapImpact,
  createUnavailableRepoMapImpact,
  type RepoMapImpactOptions,
  type RepoMapImpactResultV1,
} from "./impact.js";
import {
  createUnavailableRepoMapTests,
  findAffectedTests,
  type RepoMapTestsOptions,
  type RepoMapTestsResultV1,
} from "./tests.js";
import { findContentTests } from "./test-content.js";
import { refuseBody } from "./outline-body.js";
import { findDeclaredType, resolveTypeTarget } from "./class-lookup.js";
import { nearestPaths, withSuggestions } from "./path-hints.js";
import { createRepoMapOutline, type RepoMapOutlineOptions, type RepoMapOutlineResultV1 } from "./outline.js";
import {
  createUnavailableRepoMapRefs,
  findRepoMapReferences,
  type RepoMapRefsOptions,
  type RepoMapRefsResultV1,
} from "./refs.js";
import {
  defaultRepoMapLimits,
  type RepoMapLimits,
  type RepoMapQueryResult,
  type RepoMapQuerySignals,
  type RepoMapV1,
} from "./types.js";
import { isMissingPathError } from "src/utils/errno.js";

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

export type QueryRepoMapResult =
  | { status: "ready"; map: RepoMapV1; results: RepoMapQueryResult[]; fallback?: "references" }
  | { status: "missing" | "invalid"; results: []; fallback?: undefined };
export type RepoMapHealth = "ready" | "missing" | "invalid" | "stale";

export async function refreshRepoMap(options: RefreshRepoMapOptions): Promise<{ map: RepoMapV1; skipped: string[] }> {
  const inventory = await inventoryRepository(options.root, options.limits ?? defaultRepoMapLimits);
  const packageRoots = inventory.files
    .filter(({ path }) => path.endsWith("package.json"))
    .map(({ path }) => (path === "package.json" ? "" : path.slice(0, -"/package.json".length)));
  const extracted = (
    await mapConcurrent(
      inventory.files,
      (file) => extractRepoMapFile(file, packageRoots),
      options.limits?.concurrency ?? defaultRepoMapLimits.concurrency,
    )
  ).flatMap((file) => (file === undefined ? [] : [file]));
  const records = attachReferences(extracted);
  const map = createRepoMap(records);
  await writeRepoMap(options.root, map);
  return { map, skipped: inventory.skipped };
}

export async function queryRepoMap(options: QueryRepoMapOptions): Promise<QueryRepoMapResult> {
  let map: RepoMapV1;
  try {
    map = await readRepoMap(options.root);
  } catch (error: unknown) {
    return isMissingPathError(error) ? { results: [], status: "missing" } : { results: [], status: "invalid" };
  }
  const limit = options.limit ?? 20;
  const results = await withMatchedSymbols(
    options.root,
    searchRepoMap(map, options.query, limit, options.signals),
    options.query,
  );
  if (results.length === 0) {
    const fallback = await referenceFallback(map, options.root, options.query.trim(), limit);
    if (fallback.length > 0) return { fallback: "references", map, results: fallback, status: "ready" };
  }
  return { map, results, status: "ready" };
}

const identifierQuery = /^[A-Za-z_$][\w$]{0,127}$/u;

/**
 * A single name the index does not hold (a name that is only used, never declared) is looked up like `--refs` does,
 * by scanning the files, and the files that mention it are returned in order.
 */
async function referenceFallback(
  map: RepoMapV1,
  root: string,
  query: string,
  limit: number,
): Promise<RepoMapQueryResult[]> {
  if (!identifierQuery.test(query)) return [];
  const { references } = await findRepoMapReferences(map, { limit: 20, root, symbol: query });
  const records = new Map(map.records.map((record) => [record.path, record]));
  const results: RepoMapQueryResult[] = [];
  for (const { path } of references) {
    const record = records.get(path);
    if (record === undefined || results.some((result) => result.path === path)) continue;
    results.push({
      outline: {
        extension: record.extension,
        headings: record.headings,
        identifiers: record.identifiers,
        importTargets: record.importTargets,
        kind: record.kind,
        packagePath: record.packagePath,
        ...(record.language === undefined ? {} : { language: record.language }),
      },
      path,
      reasons: ["reference fallback"],
      score: 1000 - results.length,
    });
    if (results.length >= limit) break;
  }
  return results;
}

export async function impactRepoMap(
  options: RepoMapImpactOptions & { readonly root: string },
): Promise<RepoMapImpactResultV1> {
  let map: RepoMapV1;
  try {
    map = await readRepoMap(options.root);
  } catch (error: unknown) {
    return createUnavailableRepoMapImpact(isMissingPathError(error) ? "missing" : "invalid", options);
  }
  return suggestedFor(createRepoMapImpact(map, options), map, options.target);
}

export async function impactRepoMapTests(
  options: RepoMapTestsOptions & { readonly root: string },
): Promise<RepoMapTestsResultV1> {
  let map: RepoMapV1;
  try {
    map = await readRepoMap(options.root);
  } catch (error: unknown) {
    return createUnavailableRepoMapTests(isMissingPathError(error) ? "missing" : "invalid", options);
  }
  const contentMatches = await findContentTests(map, options.root, options.target);
  return suggestedFor(findAffectedTests(map, { ...options, contentMatches }), map, options.target);
}

export async function outlineRepoMap(
  options: RepoMapOutlineOptions & { readonly root: string },
): Promise<RepoMapOutlineResultV1> {
  let map: RepoMapV1 | undefined;
  try {
    map = await readRepoMap(options.root);
  } catch {
    // No readable map: a path is still outlined from the file; a name and a body need the map.
  }
  const lookup =
    map === undefined
      ? undefined
      : resolveTypeTarget(options, await findDeclaredType(options.root, map, options.target));
  if (lookup !== undefined && "result" in lookup) return lookup.result;
  const target = lookup === undefined ? options : { ...options, ...lookup.options };
  if (target.body === true) {
    const refusal = await refuseBody(target);
    if (refusal !== undefined) return refusal;
  }
  const result = await createRepoMapOutline(target);
  if (result.status !== "not-found") return lookup === undefined ? result : { ...result, resolvedFrom: options.target };
  return map === undefined ? result : suggestedFor(result, map, options.target);
}

/** A `not-found` result plus the paths of the map that end like the target; any other result is returned as it is. */
function suggestedFor<T extends { readonly status: string }>(result: T, map: RepoMapV1, target: string): T {
  return result.status === "not-found"
    ? withSuggestions(
        result,
        nearestPaths(
          map.records.map((record) => record.path),
          target,
        ),
      )
    : result;
}

export async function refsRepoMap(
  options: RepoMapRefsOptions & { readonly root: string },
): Promise<RepoMapRefsResultV1> {
  let map: RepoMapV1;
  try {
    map = await readRepoMap(options.root);
  } catch (error: unknown) {
    return createUnavailableRepoMapRefs(isMissingPathError(error) ? "missing" : "invalid", options);
  }
  return findRepoMapReferences(map, options);
}

/** Explicit doctor inventory: scans safely but never writes or refreshes the cache. */
export async function diagnoseRepoMap(root: string): Promise<RepoMapHealth> {
  let current: RepoMapV1;
  try {
    current = await readRepoMap(root);
  } catch (error: unknown) {
    if (isMissingPathError(error)) return "missing";
    return (await isOlderExtractorCache(root)) ? "stale" : "invalid";
  }
  const inventory = await inventoryRepository(root);
  const packageRoots = inventory.files
    .filter(({ path }) => path.endsWith("package.json"))
    .map(({ path }) => (path === "package.json" ? "" : path.slice(0, -"/package.json".length)));
  const records = (
    await mapConcurrent(
      inventory.files,
      (file) => extractRepoMapRecord(file, packageRoots),
      defaultRepoMapLimits.concurrency,
    )
  ).flatMap((record) => (record === undefined ? [] : [record]));
  return createRepoMap(records).inventoryFingerprint === current.inventoryFingerprint ? "ready" : "stale";
}

async function mapConcurrent<T, U>(
  values: readonly T[],
  callback: (value: T) => Promise<U>,
  concurrency: number,
): Promise<U[]> {
  const results = new Array<U>(values.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (true) {
        const index = next++;
        if (index >= values.length) return;
        const value = values[index];
        if (value !== undefined) results[index] = await callback(value);
      }
    }),
  );
  return results;
}
