import { appendJournalIdempotent, type JournalEntry } from "src/core/journal/journal.js";
import { effectiveLearningStatus, type LearningCandidate, type LearningStatus } from "src/core/journal/learning.js";
import { readLearningStates, type LearningState } from "src/core/journal/learning-store.js";

export type LearningAction = "reject" | "promote" | "retire";

export const MAX_REVIEW_REASON_CHARACTERS = 200;

/** Which stored status an action may start from, and the status it records. */
const TRANSITIONS: Record<LearningAction, { from: readonly LearningStatus[]; to: LearningStatus }> = {
  reject: { from: ["draft", "candidate"], to: "rejected" },
  promote: { from: ["draft", "candidate"], to: "promoted" },
  retire: { from: ["promoted"], to: "archived" },
};

export interface ReviewLearningInput {
  journalRoot: string;
  journalPath: string;
  developer: string;
  id: string;
  action: LearningAction;
  now: string;
  reason?: string | undefined;
}

export interface ReviewLearningResult {
  entry: JournalEntry;
  candidate: LearningCandidate;
}

/**
 * Records a manual decision as a new journal entry; the journal stays append-only and the newest entry of a
 * candidate is its state. A draft or candidate that lapsed by age is refused, so nobody promotes stale text unseen.
 */
export async function planLearningReview(
  input: Pick<ReviewLearningInput, "journalRoot" | "id" | "action" | "now">,
): Promise<{ state: LearningState; candidate: LearningCandidate }> {
  const state = (await readLearningStates(input.journalRoot)).get(input.id);
  if (state === undefined) throw new Error(`Learning ${input.id} does not exist.`);
  const transition = TRANSITIONS[input.action];
  const effective = effectiveLearningStatus(state.candidate.status, state.entry.recordedAt, Date.parse(input.now));
  if (effective === "archived" && state.candidate.status !== "archived") {
    throw new Error(`Learning ${input.id} has lapsed; it can only return through a new capture.`);
  }
  if (!transition.from.includes(state.candidate.status)) {
    throw new Error(
      `Learning ${input.id} is ${state.candidate.status}; it cannot be ${transition.to} (${input.action}).`,
    );
  }
  return { state, candidate: { ...state.candidate, status: transition.to } };
}

export async function reviewLearning(input: ReviewLearningInput): Promise<ReviewLearningResult> {
  const { state, candidate } = await planLearningReview(input);
  const transition = TRANSITIONS[input.action];
  const reason = input.reason?.replace(/\s+/gu, " ").trim().slice(0, MAX_REVIEW_REASON_CHARACTERS);
  const entry: JournalEntry = {
    generator: "harnix",
    schemaVersion: 1,
    id: `${input.id}-${transition.to}-${input.now.replace(/\D/gu, "")}`,
    recordedAt: input.now,
    developer: input.developer,
    ...(state.entry.taskId === undefined ? {} : { taskId: state.entry.taskId }),
    kind: "learning",
    summary: `Learning ${transition.to}: ${input.id}${reason ? ` (${reason})` : ""}`,
    evidenceIds: candidate.evidenceIds,
    learning: candidate,
  };
  return { ...(await appendJournalIdempotent(input.journalRoot, input.journalPath, entry)), candidate };
}
