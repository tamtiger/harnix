import { posix } from "node:path";

import { compareCodeUnits } from "../../utils/order.js";
import { normalizeRepositoryPath } from "../../utils/paths.js";
import type { RepoMapRecordV1 } from "./types.js";

export interface RepoMapGraphLimits {
  maxNodes: number;
  maxEdges: number;
  maxAmbiguousMatches: number;
}

export interface RepoMapGraph {
  adjacency: ReadonlyMap<string, readonly string[]>;
  reverseAdjacency: ReadonlyMap<string, readonly string[]>;
  nodeCount: number;
  edgeCount: number;
}

export const defaultRepoMapGraphLimits: RepoMapGraphLimits = Object.freeze({ maxAmbiguousMatches: 4, maxEdges: 100_000, maxNodes: 10_000 });

export function buildRepoMapGraph(records: readonly RepoMapRecordV1[], limits: RepoMapGraphLimits = defaultRepoMapGraphLimits): RepoMapGraph {
  assertLimits(limits);
  const selected = [...records].sort((left, right) => compareCodeUnits(left.path, right.path)).slice(0, limits.maxNodes);
  const paths = selected.map((record) => record.path);
  const indexed = new Set(paths);
  const adjacencySets = new Map(paths.map((path) => [path, new Set<string>()]));
  const reverseSets = new Map(paths.map((path) => [path, new Set<string>()]));
  let edgeCount = 0;
  for (const record of selected) {
    for (const target of [...record.importTargets].sort(compareCodeUnits)) {
      if (edgeCount >= limits.maxEdges) break;
      const resolved = resolveImportTarget(record.path, target, paths, indexed);
      if (resolved.length === 0 || resolved.length > limits.maxAmbiguousMatches) continue;
      for (const destination of resolved) {
        if (edgeCount >= limits.maxEdges) break;
        const adjacent = adjacencySets.get(record.path)!;
        if (adjacent.has(destination)) continue;
        adjacent.add(destination);
        reverseSets.get(destination)!.add(record.path);
        edgeCount += 1;
      }
    }
  }
  return { adjacency: sortedMap(adjacencySets), reverseAdjacency: sortedMap(reverseSets), nodeCount: selected.length, edgeCount };
}

function resolveImportTarget(sourcePath: string, importTarget: string, paths: readonly string[], indexed: ReadonlySet<string>): string[] {
  if (!/^(?:\.\/|\.\.\/)/u.test(importTarget) || importTarget.includes("\0") || importTarget.includes("\\")) return [];
  const joined = posix.normalize(posix.join(posix.dirname(sourcePath), importTarget));
  if (joined === "." || joined === ".." || joined.startsWith("../") || posix.isAbsolute(joined)) return [];
  let target: string;
  try { target = normalizeRepositoryPath(joined); } catch { return []; }
  const candidates = new Set<string>();
  if (indexed.has(target)) candidates.add(target);
  for (const path of paths) if (stripLastExtension(path) === target) candidates.add(path);
  for (const path of paths) if (posix.dirname(path) === target && /^index(?:\.|$)/u.test(posix.basename(path))) candidates.add(path);
  return [...candidates].sort(compareCodeUnits);
}

function stripLastExtension(path: string): string {
  const extension = posix.extname(path);
  return extension.length === 0 ? path : path.slice(0, -extension.length);
}

function sortedMap(values: ReadonlyMap<string, ReadonlySet<string>>): ReadonlyMap<string, readonly string[]> {
  return new Map([...values.entries()].sort(([left], [right]) => compareCodeUnits(left, right)).map(([path, edges]) => [path, [...edges].sort(compareCodeUnits)]));
}

function assertLimits(limits: RepoMapGraphLimits): void {
  if (![limits.maxNodes, limits.maxEdges, limits.maxAmbiguousMatches].every((value) => Number.isInteger(value) && value > 0)) throw new Error("Repo map graph limits must be positive integers.");
}
