import type { TaskRecord } from "src/core/tasks/task.js";
import { verificationRetryDisposition } from "./completion.js";

/**
 * The convergence rule of Harnix: one automatic remediation round, then stop. Two consecutive failures of a check
 * therefore refuse any further pass or fail for it; the way on is a user-authorized replacement check.
 */
export function assertRetryAllowed(task: TaskRecord, checkId: string, now: number = Date.now()): void {
  if (verificationRetryDisposition(task, checkId, now) !== "stop") return;
  throw new Error(
    `Check ${checkId} failed twice in a row; stop and report to the user. Continue only with a user-authorized new hypothesis: harnix workflow --replace-check ${checkId} <new-id> --reason "<why>".`,
  );
}

/** Applies the breaker to every pass or fail a save appends, whichever transport produced it. */
export function assertNewEvidenceRetryAllowed(
  existing: TaskRecord | undefined,
  candidate: TaskRecord,
  now: number = Date.now(),
): void {
  if (existing === undefined || candidate.schemaVersion !== 3) return;
  const known = new Set(existing.evidence.map((evidence) => evidence.id));
  for (const evidence of candidate.evidence) {
    if (known.has(evidence.id) || evidence.checkId === undefined || evidence.result === "skipped") continue;
    assertRetryAllowed(existing, evidence.checkId, now);
  }
}
