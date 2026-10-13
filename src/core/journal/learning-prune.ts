import { effectiveLearningStatus } from "src/core/journal/learning.js";
import { lowValueReason, type LowValueReason } from "src/core/journal/learning-quality.js";
import { reviewLearning, type ReviewLearningInput } from "src/core/journal/learning-review.js";
import { readLearningStates } from "src/core/journal/learning-store.js";
import { compareCodeUnits } from "src/utils/order.js";

export const MAX_PRUNE_BATCH = 100;

export interface PruneMatch {
  id: string;
  reason: LowValueReason;
  statement: string;
}

/**
 * Live drafts and candidates that the capture quality filter would no longer accept. A lapsed entry is left alone (it
 * already stopped reaching the agent), and the list is capped so one call stays bounded.
 */
export async function findLowValueLearning(journalRoot: string, now: string): Promise<PruneMatch[]> {
  const matches: PruneMatch[] = [];
  for (const { entry, candidate } of (await readLearningStates(journalRoot)).values()) {
    if (candidate.status !== "draft" && candidate.status !== "candidate") continue;
    if (effectiveLearningStatus(candidate.status, entry.recordedAt, Date.parse(now)) === "archived") continue;
    const reason = lowValueReason(candidate.statement);
    if (reason !== undefined) matches.push({ id: candidate.id, reason, statement: candidate.statement });
  }
  return matches.sort((left, right) => compareCodeUnits(left.id, right.id)).slice(0, MAX_PRUNE_BATCH);
}

/** Rejects every match with a new journal entry; the earlier entries stay untouched. Returns the rejected ids. */
export async function pruneLearning(
  base: Omit<ReviewLearningInput, "id" | "action" | "reason">,
  matches: readonly PruneMatch[],
): Promise<string[]> {
  const rejected: string[] = [];
  for (const match of matches) {
    await reviewLearning({ ...base, id: match.id, action: "reject", reason: `low value: ${match.reason}` });
    rejected.push(match.id);
  }
  return rejected;
}
