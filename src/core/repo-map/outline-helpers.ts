import { compareCodeUnits } from "src/utils/order.js";
import { normalizeRepositoryPath } from "src/utils/paths.js";
import type {
  RepoMapOutlineOptions,
  RepoMapOutlineResultV1,
  RepoMapSymbolKind,
  RepoMapSymbolOutlineV1,
} from "./types.js";

export type SymArgs = [string, RepoMapSymbolKind, boolean, number, number, string, (string | undefined)?];

export function makeSymbol([
  name,
  kind,
  exported,
  startLine,
  endLine,
  rawSig,
  container,
]: SymArgs): RepoMapSymbolOutlineV1 {
  const signature = rawSig.replace(/\s+/gu, " ").trim().slice(0, 160);
  return { ...(container === undefined ? {} : { container }), endLine, exported, kind, name, signature, startLine };
}

export function stripComments(raw: string): string {
  return raw
    .trim()
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/gu, '""')
    .replace(/(?:^|[=([:,;!&|?]\s*|return\s+)\/(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\\\n])+\/[dgimsuvy]*/gu, '""')
    .replace(/\/\/.*$/u, "")
    .trim();
}

export function filterSymbols(
  items: readonly RepoMapSymbolOutlineV1[],
  filter: string | undefined,
): RepoMapSymbolOutlineV1[] {
  const needle = filter?.trim().toLowerCase();
  const list =
    needle === undefined || needle.length === 0
      ? [...items]
      : items.filter((s) => {
          const qualified = s.container ? `${s.container}.${s.name}`.toLowerCase() : s.name.toLowerCase();
          return s.name.toLowerCase().includes(needle) || qualified.includes(needle);
        });
  return list.sort((a, b) => a.startLine - b.startLine || compareCodeUnits(a.name, b.name));
}

export function makeResult(
  status: "ready" | "not-found" | "skipped",
  opts: RepoMapOutlineOptions,
  symbols: readonly RepoMapSymbolOutlineV1[] = [],
  truncated = false,
  language?: string,
): RepoMapOutlineResultV1 {
  return {
    generator: "harnix",
    limit: opts.limit,
    schemaVersion: 1,
    scope: "project",
    status,
    symbols,
    target: opts.target,
    truncated,
    ...(language !== undefined ? { language } : {}),
    ...(opts.symbol !== undefined ? { symbolFilter: opts.symbol.trim() } : {}),
  };
}

export function assertOutlineOptions(options: RepoMapOutlineOptions): void {
  let normalized = "";
  try {
    normalized = normalizeRepositoryPath(options.target);
  } catch {
    throw new Error("Outline target must be an exact normalized repository-relative POSIX path.");
  }
  if (normalized !== options.target || options.target.includes("\\"))
    throw new Error("Outline target must be an exact normalized repository-relative POSIX path.");
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 50)
    throw new Error("Outline limit must be an integer between 1 and 50.");
  if (options.symbol !== undefined && (options.symbol.trim().length === 0 || options.symbol.trim().length > 128))
    throw new Error("Outline symbol filter must contain 1 to 128 characters.");
}
