import type { RepoMapImpactResultV1 } from "./impact.js";
import type { RepoMapRefsResultV1 } from "./refs.js";
import type { RepoMapTestsResultV1 } from "./tests.js";
import type { RepoMapFileKind, RepoMapOutlineResultV1, RepoMapQueryResult } from "./types.js";

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

export type RepoMapListFormat = "json" | "compact";

/** The format of `--outline`, `--refs`, `--impact` and `--tests`: the query-only outline format is not one of them. */
export function parseRepoMapListFormat(raw: string | undefined): RepoMapListFormat {
  if (raw === undefined || raw === "json") return "json";
  if (raw === "compact") return "compact";
  throw new Error("Repo map format must be json or compact for this mode.");
}

/** `path:line kind` per reference; the preview text is dropped. */
export function compactRefs(result: RepoMapRefsResultV1): Record<string, unknown> {
  return {
    ...result,
    format: "compact",
    references: result.references.map((ref) => `${ref.path}:${ref.line} ${ref.kind}`),
  };
}

/** `path@distance` per dependent. */
export function compactImpact(result: RepoMapImpactResultV1): Record<string, unknown> {
  return {
    ...result,
    dependents: result.dependents.map((dependent) => `${dependent.path}@${dependent.distance}`),
    format: "compact",
  };
}

/** `path reason` per test; the separate reasons map is folded into the strings. */
export function compactTests(result: RepoMapTestsResultV1): Record<string, unknown> {
  const { reasons, ...rest } = result;
  return {
    ...rest,
    format: "compact",
    tests: result.tests.map((path) => (reasons?.[path] === undefined ? path : `${path} ${reasons[path]}`)),
  };
}

/** `name kind start-end` per symbol; signatures and bodies are dropped. */
export function compactOutline(result: RepoMapOutlineResultV1): Record<string, unknown> {
  return {
    ...result,
    format: "compact",
    symbols: result.symbols.map((symbol) => `${symbol.name} ${symbol.kind} ${symbol.startLine}-${symbol.endLine}`),
  };
}
