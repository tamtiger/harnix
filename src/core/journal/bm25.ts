import type { JournalEntry } from "./journal.js";
import { compareCodeUnits } from "src/utils/order.js";

/**
 * Tokenizes text by normalizing to NFC, lowercasing, and extracting Unicode word tokens (\p{L}\p{N}+).
 */
export function tokenize(text: string): string[] {
  return (
    text
      .normalize("NFC")
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

/**
 * Converts a journal entry to searchable text representation for BM25 indexing.
 */
export function entryToSearchText(entry: JournalEntry): string {
  const parts: string[] = [entry.summary];
  if (entry.taskId) parts.push(entry.taskId);
  if (entry.learning?.statement) parts.push(entry.learning.statement);
  return parts.join(" ");
}

function computeRSJIdf(n: number, docTokens: string[][], queryTerms: string[]): Map<string, number> {
  const idf = new Map<string, number>();
  for (const term of queryTerms) {
    let nq = 0;
    for (const tokens of docTokens) {
      if (tokens.includes(term)) nq += 1;
    }
    if (nq === 0) {
      idf.set(term, 0);
    } else {
      const val = Math.log(1 + (n - nq + 0.5) / (nq + 0.5));
      idf.set(term, Math.max(0, val));
    }
  }
  return idf;
}

function scoreDocument(
  tokens: string[],
  docLen: number,
  avgdl: number,
  queryTerms: string[],
  idf: Map<string, number>,
): number {
  const k1 = 1.2;
  const b = 0.75;
  const tfMap = new Map<string, number>();
  for (const token of tokens) {
    tfMap.set(token, (tfMap.get(token) ?? 0) + 1);
  }
  let docScore = 0;
  for (const term of queryTerms) {
    const tf = tfMap.get(term) ?? 0;
    if (tf === 0) continue;
    const termIdf = idf.get(term) ?? 0;
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (docLen / avgdl));
    docScore += termIdf * (numerator / denominator);
  }
  return docScore;
}

/**
 * Ranks journal entries using Robertson-Spärck Jones Okapi BM25 scoring.
 * Parameters: k1 = 1.2, b = 0.75.
 * Entries with score > 0 are returned in descending score order.
 * Tie-breaker: recordedAt desc, id desc (via compareCodeUnits).
 * If query is empty or no query terms, returns entries sorted by recency and sliced to limit.
 */
export function rankEntriesBM25(entries: readonly JournalEntry[], query: string, limit?: number): JournalEntry[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0 || entries.length === 0) {
    const sorted = [...entries].sort(
      (left, right) => compareCodeUnits(right.recordedAt, left.recordedAt) || compareCodeUnits(right.id, left.id),
    );
    return limit === undefined ? sorted : sorted.slice(0, limit);
  }

  const queryTerms = [...new Set(queryTokens)];
  const n = entries.length;

  const docTokens: string[][] = entries.map((entry) => tokenize(entryToSearchText(entry)));
  const docLengths: number[] = docTokens.map((tokens) => tokens.length);
  const totalLength = docLengths.reduce((sum, len) => sum + len, 0);
  const avgdl = n > 0 && totalLength > 0 ? totalLength / n : 1;

  const idf = computeRSJIdf(n, docTokens, queryTerms);
  const scored: { entry: JournalEntry; score: number }[] = [];

  for (let i = 0; i < n; i++) {
    const docScore = scoreDocument(docTokens[i]!, docLengths[i]!, avgdl, queryTerms, idf);
    if (docScore > 0) {
      scored.push({ entry: entries[i]!, score: docScore });
    }
  }

  scored.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return (
      compareCodeUnits(right.entry.recordedAt, left.entry.recordedAt) || compareCodeUnits(right.entry.id, left.entry.id)
    );
  });

  const result = scored.map((item) => item.entry);
  return limit === undefined ? result : result.slice(0, limit);
}
