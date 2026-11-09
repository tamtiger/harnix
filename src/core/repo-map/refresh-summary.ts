import { secretPath } from "./inventory.js";

/** How many skipped paths a refresh names; the rest are only counted. */
export const MAX_LISTED_SKIPPED = 10;
/** The marker the inventory leaves in its skipped list when it stops at a size or count limit. */
const LIMIT_MARKER = "limit";

export interface SkippedSummary {
  readonly skipped: string[];
  readonly skippedTotal: number;
  readonly limitReached: boolean;
}

/**
 * Turns the inventory's skipped list into a bounded summary: the limit marker becomes a flag, credential-looking
 * file names are counted but never listed, and at most {@link MAX_LISTED_SKIPPED} paths are named.
 */
export function summarizeSkipped(skipped: readonly string[]): SkippedSummary {
  const files = skipped.filter((path) => path !== LIMIT_MARKER);
  return {
    limitReached: files.length !== skipped.length,
    skipped: files.filter((path) => !secretPath.test(path)).slice(0, MAX_LISTED_SKIPPED),
    skippedTotal: files.length,
  };
}
