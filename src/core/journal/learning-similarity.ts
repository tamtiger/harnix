import { normalizeObservation } from "src/core/journal/learning.js";
import type { LearningState } from "src/core/journal/learning-store.js";
import { compareCodeUnits } from "src/utils/order.js";

export const SIMILARITY_THRESHOLD = 0.5;
export const MAX_SIMILAR = 5;
const MIN_TOKEN_CHARACTERS = 2;
const SIMILAR_STATUSES = new Set(["draft", "candidate", "promoted"]);

export interface SimilarLearning {
  id: string;
  score: number;
}

function withoutDiacritics(text: string): string {
  return text.replace(/đ/gu, "d").normalize("NFD").replace(/\p{M}/gu, "");
}

/** The normalized observation with Vietnamese diacritics removed; accents never decide whether two notes agree. */
export function foldObservation(text: string): string {
  return withoutDiacritics(normalizeObservation(text));
}

export function observationTokens(text: string): Set<string> {
  const tokens = foldObservation(text).split(/[^\p{L}\p{N}]+/u);
  return new Set(tokens.filter((token) => token.length >= MIN_TOKEN_CHARACTERS));
}

export function jaccard(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  if (left.size === 0 && right.size === 0) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / (left.size + right.size - shared);
}

function newer(left: LearningState, right: LearningState): boolean {
  const delta = Date.parse(left.entry.recordedAt) - Date.parse(right.entry.recordedAt);
  return delta > 0 || (delta === 0 && compareCodeUnits(left.candidate.id, right.candidate.id) > 0);
}

/**
 * The stored candidate that already holds this statement up to accents, case, spacing and edge punctuation, newest
 * first. Capture reuses its id, so a variant joins it instead of opening a second candidate; ids never change.
 */
export function findFoldedMatch(
  states: ReadonlyMap<string, LearningState>,
  statement: string,
): LearningState | undefined {
  const key = foldObservation(statement);
  let found: LearningState | undefined;
  for (const state of states.values()) {
    if (foldObservation(state.candidate.statement) !== key) continue;
    if (found === undefined || newer(state, found)) found = state;
  }
  return found;
}

/** Other live or promoted notes that read like this one (token Jaccard from the threshold), for the reviewer to judge. */
export function similarLearning(states: ReadonlyMap<string, LearningState>, id: string): SimilarLearning[] {
  const target = states.get(id);
  if (target === undefined) return [];
  const tokens = observationTokens(target.candidate.statement);
  const matches: SimilarLearning[] = [];
  for (const [otherId, other] of states) {
    if (otherId === id || !SIMILAR_STATUSES.has(other.candidate.status)) continue;
    const score = Math.round(jaccard(tokens, observationTokens(other.candidate.statement)) * 100) / 100;
    if (score >= SIMILARITY_THRESHOLD) matches.push({ id: otherId, score });
  }
  return matches
    .sort((left, right) => right.score - left.score || compareCodeUnits(left.id, right.id))
    .slice(0, MAX_SIMILAR);
}
