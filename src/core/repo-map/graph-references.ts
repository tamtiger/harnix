import { compareCodeUnits } from "src/utils/order.js";
import { MAX_NAME_DECLARERS } from "./references.js";
import type { RepoMapRecordV1 } from "./types.js";

export const MAX_REFERENCE_EDGES_PER_FILE = 8;
export const MAX_REFERENCE_EDGES = 50_000;

export interface ReferenceEdgeLimits {
  readonly maxReferenceEdges?: number | undefined;
  readonly maxReferenceEdgesPerFile?: number | undefined;
}

function declarerIndex(records: readonly RepoMapRecordV1[]): ReadonlyMap<string, readonly string[]> {
  const index = new Map<string, string[]>();
  for (const record of records) {
    if (record.kind !== "source") continue;
    for (const name of record.identifiers) {
      const paths = index.get(name);
      if (paths === undefined) index.set(name, [record.path]);
      else paths.push(record.path);
    }
  }
  return index;
}

/**
 * Adds an edge from each file to the files declaring the names it references. Import edges are already in place, so
 * they keep their budget; this pass only spends what is left, at most a few edges per file, and prefers names that
 * point to the fewest files.
 */
export function addReferenceEdges(
  records: readonly RepoMapRecordV1[],
  adjacency: Map<string, Set<string>>,
  reverse: Map<string, Set<string>>,
  budget: number,
  limits: ReferenceEdgeLimits,
): number {
  const declarers = declarerIndex(records);
  const totalCap = Math.min(budget, limits.maxReferenceEdges ?? MAX_REFERENCE_EDGES);
  const perFileCap = limits.maxReferenceEdgesPerFile ?? MAX_REFERENCE_EDGES_PER_FILE;
  let added = 0;
  for (const record of records) {
    const adjacent = adjacency.get(record.path);
    if (record.references === undefined || adjacent === undefined) continue;
    let own = 0;
    const names = record.references
      .filter((name) => (declarers.get(name)?.length ?? 0) <= MAX_NAME_DECLARERS)
      .sort(
        (left, right) =>
          (declarers.get(left)?.length ?? 0) - (declarers.get(right)?.length ?? 0) || compareCodeUnits(left, right),
      );
    for (const name of names) {
      for (const target of declarers.get(name) ?? []) {
        if (added >= totalCap || own >= perFileCap) break;
        if (target === record.path || adjacent.has(target)) continue;
        adjacent.add(target);
        reverse.get(target)?.add(record.path);
        added += 1;
        own += 1;
      }
    }
  }
  return added;
}
