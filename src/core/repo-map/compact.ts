import type { RepoMapFileKind, RepoMapQueryResult } from "./types.js";

export type RepoMapQueryFormat = "json" | "compact" | "outline";

export interface RepoMapCompactQueryResult {
  readonly path: string;
  readonly score: number;
  readonly symbols: readonly string[];
}

export interface RepoMapOutlineQueryResult extends RepoMapCompactQueryResult {
  readonly kind: RepoMapFileKind;
}

const MAX_SYMBOLS_PER_RESULT = 5;

export function parseRepoMapFormat(raw: string | undefined): RepoMapQueryFormat {
  if (raw === undefined || raw === "json") return "json";
  if (raw === "compact") return "compact";
  if (raw === "outline") return "outline";
  throw new Error("Repo map query format must be one of: json, compact, outline.");
}

export function formatQueryResults(
  results: readonly RepoMapQueryResult[],
  format: RepoMapQueryFormat,
): readonly unknown[] {
  if (format === "json") return results;
  if (format === "compact") {
    return results.map((r): RepoMapCompactQueryResult => ({
      path: r.path,
      score: r.score,
      symbols: extractPrimarySymbols(r),
    }));
  }
  return results.map((r): RepoMapOutlineQueryResult => ({
    kind: r.outline.kind,
    path: r.path,
    score: r.score,
    symbols: extractPrimarySymbols(r),
  }));
}

function extractPrimarySymbols(result: RepoMapQueryResult): string[] {
  if (result.outline.kind === "documentation" && result.outline.headings.length > 0) {
    return result.outline.headings.slice(0, MAX_SYMBOLS_PER_RESULT);
  }
  return result.outline.identifiers.slice(0, MAX_SYMBOLS_PER_RESULT);
}
