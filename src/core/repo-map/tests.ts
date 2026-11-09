import { compareCodeUnits } from "src/utils/order.js";
import { normalizeRepositoryPath } from "src/utils/paths.js";
import { buildRepoMapGraph } from "./graph.js";
import { MAX_NAME_DECLARERS } from "./references.js";
import { findConventionTests } from "./test-convention.js";
import { repoMapRefreshHint, type RepoMapRecordV1, type RepoMapV1 } from "./types.js";

export interface RepoMapTestsOptions {
  readonly target: string;
  readonly limit: number;
}

/** Why a test is listed, from the strongest link to the weakest; a test written for the file outranks mere importers. */
export type RepoMapTestReason = "direct" | "convention" | "symbol" | "transitive";

export interface RepoMapTestsResultV1 {
  readonly hint?: string | undefined;
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly scope: "project";
  readonly status: "ready" | "missing" | "invalid" | "not-found";
  readonly target: string;
  readonly limit: number;
  readonly tests: readonly string[];
  /** For each listed test, the strongest link that selected it; absent when the target is itself a test. */
  readonly reasons?: Readonly<Record<string, RepoMapTestReason>> | undefined;
  readonly truncated: boolean;
}

const tierOrder: Readonly<Record<RepoMapTestReason, number>> = {
  convention: 0,
  direct: 1,
  symbol: 2,
  transitive: 3,
};
/** Transitive tests only fill in what the closer links did not find, so they stay few. */
const MAX_TRANSITIVE_TESTS = 5;
const MAX_TRAVERSAL_DEPTH = 5;

interface Link {
  readonly reason: RepoMapTestReason;
  readonly distance: number;
}

function strongerLink(current: Link | undefined, candidate: Link): boolean {
  if (current === undefined) return true;
  const tier = tierOrder[candidate.reason] - tierOrder[current.reason];
  return tier < 0 || (tier === 0 && candidate.distance < current.distance);
}

export function findAffectedTests(map: RepoMapV1, options: RepoMapTestsOptions): RepoMapTestsResultV1 {
  assertTestsOptions(options);
  const targetRecord = map.records.find((record) => record.path === options.target);
  if (!targetRecord) return emptyResult("not-found", options);

  if (targetRecord.kind === "test") {
    return {
      generator: "harnix",
      limit: options.limit,
      scope: "project",
      schemaVersion: 1,
      status: "ready",
      target: options.target,
      tests: [options.target],
      truncated: false,
    };
  }

  const links = new Map<string, Link>();
  const link = (path: string, reason: RepoMapTestReason, distance: number): void => {
    if (strongerLink(links.get(path), { distance, reason })) links.set(path, { distance, reason });
  };
  for (const path of findConventionTests(options.target, map.records)) link(path, "convention", 1);
  for (const path of findSymbolTests(targetRecord, map.records)) link(path, "symbol", 1);
  linkDependents(options.target, map, link);

  const ordered = [...links.entries()].sort(
    ([leftPath, left], [rightPath, right]) =>
      tierOrder[left.reason] - tierOrder[right.reason] ||
      left.distance - right.distance ||
      compareCodeUnits(leftPath, rightPath),
  );
  let transitive = 0;
  const kept = ordered.filter(
    ([, found]) => found.reason !== "transitive" || (transitive += 1) <= MAX_TRANSITIVE_TESTS,
  );
  const listed = kept.slice(0, options.limit);
  return {
    generator: "harnix",
    limit: options.limit,
    reasons: Object.fromEntries(listed.map(([path, found]) => [path, found.reason])),
    schemaVersion: 1,
    scope: "project",
    status: "ready",
    target: options.target,
    tests: listed.map(([path]) => path),
    truncated: kept.length > listed.length,
  };
}

/** Tests that use a name the target declares, when that name belongs to at most a few files. */
function findSymbolTests(target: RepoMapRecordV1, records: readonly RepoMapRecordV1[]): string[] {
  const declarers = new Map<string, number>();
  for (const record of records) {
    if (record.kind !== "source") continue;
    for (const name of record.identifiers) declarers.set(name, (declarers.get(name) ?? 0) + 1);
  }
  const symbols = new Set<string>();
  const add = (name: string): void => {
    const count = declarers.get(name) ?? 0;
    if (count >= 1 && count <= MAX_NAME_DECLARERS) symbols.add(name);
  };
  for (const name of target.identifiers) {
    add(name);
    if (!name.startsWith("I") && name.length > 1) add(`I${name}`);
    else if (name.startsWith("I") && name.length > 1 && /[A-Z]/u.test(name[1] ?? "")) add(name.slice(1));
  }
  return records
    .filter((record) => record.kind === "test" && record.identifiers.some((name) => symbols.has(name)))
    .map((record) => record.path);
}

function linkDependents(
  target: string,
  map: RepoMapV1,
  link: (path: string, reason: RepoMapTestReason, distance: number) => void,
): void {
  const graph = buildRepoMapGraph(map.records);
  const kinds = new Map(map.records.map((record) => [record.path, record.kind]));
  const visited = new Set<string>([target]);
  let frontier = [target];
  for (let distance = 1; distance <= MAX_TRAVERSAL_DEPTH && frontier.length > 0; distance += 1) {
    const next = new Set<string>();
    for (const current of frontier) {
      for (const dependent of graph.reverseAdjacency.get(current) ?? []) {
        if (visited.has(dependent)) continue;
        visited.add(dependent);
        if (kinds.get(dependent) === "test") {
          link(dependent, distance === 1 ? "direct" : "transitive", distance);
          continue;
        }
        for (const path of findConventionTests(dependent, map.records)) link(path, "transitive", distance + 1);
        next.add(dependent);
      }
    }
    frontier = [...next].sort(compareCodeUnits);
  }
}

export function createUnavailableRepoMapTests(
  status: "missing" | "invalid",
  options: RepoMapTestsOptions,
): RepoMapTestsResultV1 {
  assertTestsOptions(options);
  return { ...emptyResult(status, options), hint: repoMapRefreshHint };
}

function emptyResult(status: "missing" | "invalid" | "not-found", options: RepoMapTestsOptions): RepoMapTestsResultV1 {
  return {
    generator: "harnix",
    limit: options.limit,
    schemaVersion: 1,
    scope: "project",
    status,
    target: options.target,
    tests: [],
    truncated: false,
  };
}

function assertTestsOptions(options: RepoMapTestsOptions): void {
  let normalized: string;
  try {
    normalized = normalizeRepositoryPath(options.target);
  } catch {
    throw new Error("Tests target must be an exact normalized repository-relative POSIX path.");
  }
  if (normalized !== options.target || options.target.includes("\\"))
    throw new Error("Tests target must be an exact normalized repository-relative POSIX path.");
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 20)
    throw new Error("Tests limit must be an integer between 1 and 20.");
}
