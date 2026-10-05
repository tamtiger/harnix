/** Tolerated difference between the writer's clock and this process, so a fast clock never rejects honest evidence. */
export const EVIDENCE_CLOCK_SKEW_MS = 5_000;

interface TimedEvidence {
  id: string;
  recordedAt: string;
}

/**
 * Newly appended evidence must not claim a time that has not happened yet: once that instant passes, a future-dated
 * pass would sort after a real failure and hide it. Persisted evidence is exempt so an old record never blocks a save.
 */
export function assertNewEvidenceNotFuture(
  previous: readonly { id: string }[],
  candidate: readonly TimedEvidence[],
  now: number = Date.now(),
): void {
  const known = new Set(previous.map((evidence) => evidence.id));
  for (const evidence of candidate) {
    if (known.has(evidence.id)) continue;
    const recordedAt = Date.parse(evidence.recordedAt);
    if (!Number.isFinite(recordedAt)) throw new Error(`Evidence ${evidence.id} has an invalid recordedAt.`);
    if (recordedAt > now + EVIDENCE_CLOCK_SKEW_MS) {
      throw new Error(`Evidence ${evidence.id} is recorded in the future; recordedAt must not be later than now.`);
    }
  }
}
