import { appendJournalIdempotent, type JournalEntry } from "src/core/journal/journal.js";
import {
  createLearningCandidate,
  effectiveLearningStatus,
  observationCandidateId,
  type LearningStatus,
} from "src/core/journal/learning.js";
import { extractObservations } from "src/core/journal/learning-notes.js";
import { readLearningStates } from "src/core/journal/learning-store.js";
import type { TaskRecord } from "src/core/tasks/task.js";
import { compareCodeUnits } from "src/utils/order.js";

const MAX_EVIDENCE_PER_TASK = 4;

export {
  extractObservations,
  MAX_OBSERVATION_CHARACTERS,
  MAX_OBSERVATIONS_PER_TASK,
  reviewNotes,
} from "src/core/journal/learning-notes.js";

/**
 * Called after a task completes. A new observation becomes a `draft` (one source task); the same observation from a
 * later task joins that candidate and it becomes a `candidate` once it meets the existing eligibility threshold.
 * Never writes to `.harnix/spec`: promotion stays a manual, reviewed step.
 */
export async function captureLearningAtFinish(
  journalRoot: string,
  journalPath: string,
  developer: string,
  task: TaskRecord,
  now: string,
): Promise<number> {
  const observations = extractObservations(task);
  if (observations.length === 0) return 0;
  const states = await readLearningStates(journalRoot);
  const evidenceIds = task.evidence
    .filter((evidence) => evidence.result === "pass" && evidence.checkId !== undefined)
    .map((evidence) => evidence.id)
    .sort(compareCodeUnits)
    .slice(0, MAX_EVIDENCE_PER_TASK);
  let created = 0;
  for (const statement of observations) {
    const id = observationCandidateId(statement);
    const state = states.get(id);
    const status =
      state === undefined
        ? undefined
        : effectiveLearningStatus(state.candidate.status, state.entry.recordedAt, Date.parse(now));
    if (status === "approved" || status === "promoted" || status === "rejected") continue;
    const previous = state !== undefined && status !== "archived" ? state.candidate : undefined;
    const sourceTaskIds = [...(previous?.sourceTaskIds ?? []), task.id];
    if (previous?.sourceTaskIds.includes(task.id) === true) continue;
    const mergedEvidence = [...(previous?.evidenceIds ?? []), ...evidenceIds];
    const next = grade({ id, statement: previous?.statement ?? statement, sourceTaskIds, evidenceIds: mergedEvidence });
    const entry: JournalEntry = {
      generator: "harnix",
      schemaVersion: 1,
      id: `${task.id}-${id}-learning`,
      recordedAt: now,
      developer,
      taskId: task.id,
      kind: "learning",
      summary: `Learning ${next.status}: ${id}`,
      evidenceIds: next.evidenceIds,
      learning: next,
    };
    const result = await appendJournalIdempotent(journalRoot, journalPath, entry);
    if (result.created) created += 1;
  }
  return created;
}

function grade(input: { id: string; statement: string; sourceTaskIds: string[]; evidenceIds: string[] }) {
  const candidate = createLearningCandidate({ ...input, status: "candidate" });
  const eligible =
    candidate.sourceTaskIds.length >= 2 && candidate.evidenceIds.length >= 2 && candidate.confidence >= 0.8;
  const status: LearningStatus = eligible ? "candidate" : "draft";
  return { ...candidate, status };
}
