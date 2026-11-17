import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { compareCodeUnits } from "src/utils/order.js";
import { extractFileSymbols } from "./outline.js";
import { normalizeTerm, splitIdentifierWords } from "./search-terms.js";
import { defaultRepoMapLimits, type MatchedSymbolV1, type RepoMapQueryResult, type RepoMapRecordV1 } from "./types.js";

/** The most matched symbols one result lists. */
const MAX_MATCHED_SYMBOLS = 5;
/** The score added to a file that declares a name equal to a query word. */
const EXACT_SYMBOL_SCORE = 200;

/** The words of a query, lower case, as `--query` indexes names. */
export function queryWords(query: string): string[] {
  return [
    ...new Set(
      normalizeTerm(query)
        .split(/\s+/u)
        .filter((word) => word.length > 0),
    ),
  ];
}

/** 3 for a name equal to a query word (or to the whole query), 2 for a name that starts with one, 1 for one that holds it. */
function nameMatch(name: string, words: readonly string[]): number {
  const lower = name.toLowerCase();
  const parts = splitIdentifierWords(name);
  let best = 0;
  for (const word of words) {
    if (lower === word) return 3;
    if (lower.startsWith(word)) best = Math.max(best, 2);
    else if (lower.includes(word) || parts.includes(word)) best = Math.max(best, 1);
  }
  return best;
}

/** The score a file earns by declaring a name equal to a query word, and the reason to show for it. */
export function exactSymbolBonus(
  record: Pick<RepoMapRecordV1, "identifiers">,
  words: readonly string[],
): { score: number; reason: string } | undefined {
  const wanted = new Set(words.filter((word) => word.length >= 3));
  return record.identifiers.some((name) => wanted.has(name.toLowerCase()))
    ? { reason: "exact symbol", score: EXACT_SYMBOL_SCORE }
    : undefined;
}

async function readSource(root: string, path: string): Promise<string | undefined> {
  try {
    const file = join(root, path);
    if ((await stat(file)).size > defaultRepoMapLimits.maxBytesPerFile) return undefined;
    return await readFile(file, "utf8");
  } catch {
    return undefined;
  }
}

/** Up to five symbols of the file whose name matches a query word: closest match first, then by line. */
export function matchSymbols(text: string, extension: string, words: readonly string[]): MatchedSymbolV1[] {
  return extractFileSymbols(text, extension)
    .map((symbol) => ({ score: nameMatch(symbol.name, words), symbol }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.symbol.startLine - b.symbol.startLine || compareCodeUnits(a.symbol.name, b.symbol.name),
    )
    .slice(0, MAX_MATCHED_SYMBOLS)
    .map(({ symbol }) => ({
      kind: symbol.kind,
      name: symbol.name,
      startLine: symbol.startLine,
      ...(symbol.container === undefined ? {} : { container: symbol.container }),
    }));
}

/** The results with `matchedSymbols` read from each source file; a file that cannot be read, or has no match, gets none. */
export async function withMatchedSymbols(
  root: string,
  results: readonly RepoMapQueryResult[],
  query: string,
): Promise<RepoMapQueryResult[]> {
  const words = queryWords(query);
  return Promise.all(
    results.map(async (result) => {
      if (result.outline.kind === "documentation") return result;
      const text = await readSource(root, result.path);
      const matched = text === undefined ? [] : matchSymbols(text, result.outline.extension, words);
      return matched.length === 0 ? result : { ...result, matchedSymbols: matched };
    }),
  );
}
