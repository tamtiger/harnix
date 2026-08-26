import { compareCodeUnits } from "../../utils/order.js";
import { normalizeRepositoryPath } from "../../utils/paths.js";
import { buildRepoMapGraph } from "./graph.js";
import type { RepoMapV1 } from "./types.js";

export interface RepoMapImpactOptions {
  readonly target: string;
  readonly depth: number;
  readonly limit: number;
}

export interface RepoMapImpactResultV1 {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly scope: "project";
  readonly status: "ready" | "missing" | "invalid" | "not-found";
  readonly target: string;
  readonly depth: number;
  readonly limit: number;
  readonly dependencies: readonly string[];
  readonly dependents: readonly {
    readonly path: string;
    readonly distance: number;
  }[];
  readonly truncated: {
    readonly dependencies: boolean;
    readonly dependents: boolean;
  };
}

export function createRepoMapImpact(map: RepoMapV1, options: RepoMapImpactOptions): RepoMapImpactResultV1 {
  assertImpactOptions(options);
  if (!map.records.some((record) => record.path === options.target)) return emptyResult("not-found", options);

  const graph = buildRepoMapGraph(map.records);
  const allDependencies = (graph.adjacency.get(options.target) ?? []).filter((path) => path !== options.target);
  const allDependents = collectDependents(graph.reverseAdjacency, options.target, options.depth);
  const dependencies = allDependencies.slice(0, options.limit);
  const dependents = allDependents.slice(0, options.limit);

  return {
    generator: "harnix",
    schemaVersion: 1,
    scope: "project",
    status: "ready",
    target: options.target,
    depth: options.depth,
    limit: options.limit,
    dependencies,
    dependents,
    truncated: {
      dependencies: allDependencies.length > dependencies.length,
      dependents: allDependents.length > dependents.length,
    },
  };
}

export function createUnavailableRepoMapImpact(
  status: "missing" | "invalid",
  options: RepoMapImpactOptions,
): RepoMapImpactResultV1 {
  assertImpactOptions(options);
  return emptyResult(status, options);
}

function collectDependents(
  reverseAdjacency: ReadonlyMap<string, readonly string[]>,
  target: string,
  depth: number,
): Array<{ path: string; distance: number }> {
  const visited = new Set([target]);
  const distances = new Map<string, number>();
  let frontier = [target];
  for (let distance = 1; distance <= depth && frontier.length > 0; distance += 1) {
    const next = new Set<string>();
    for (const path of frontier) {
      for (const dependent of reverseAdjacency.get(path) ?? []) {
        if (visited.has(dependent)) continue;
        visited.add(dependent);
        distances.set(dependent, distance);
        next.add(dependent);
      }
    }
    frontier = [...next].sort(compareCodeUnits);
  }
  return [...distances.entries()]
    .map(([path, distance]) => ({ path, distance }))
    .sort((left, right) => left.distance - right.distance || compareCodeUnits(left.path, right.path));
}

function emptyResult(
  status: "missing" | "invalid" | "not-found",
  options: RepoMapImpactOptions,
): RepoMapImpactResultV1 {
  return {
    generator: "harnix",
    schemaVersion: 1,
    scope: "project",
    status,
    target: options.target,
    depth: options.depth,
    limit: options.limit,
    dependencies: [],
    dependents: [],
    truncated: { dependencies: false, dependents: false },
  };
}

function assertImpactOptions(options: RepoMapImpactOptions): void {
  let normalized: string;
  try { normalized = normalizeRepositoryPath(options.target); }
  catch { throw new Error("Impact target must be an exact normalized repository-relative POSIX path."); }
  if (normalized !== options.target || options.target.includes("\\")) throw new Error("Impact target must be an exact normalized repository-relative POSIX path.");
  if (!Number.isInteger(options.depth) || options.depth < 1 || options.depth > 3) throw new Error("Impact depth must be an integer between 1 and 3.");
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 20) throw new Error("Impact limit must be an integer between 1 and 20.");
}
