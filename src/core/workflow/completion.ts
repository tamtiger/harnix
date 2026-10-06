import { basename, dirname } from "node:path";
import { compareCodeUnits } from "src/utils/order.js";
import { selectLatestEvidence, type Evidence, type TaskRecord } from "src/core/tasks/task.js";
import { assertInputDigestsFresh } from "src/core/verification/input-digest.js";
import { assertSuiteGateFinishing, authorizedRedBaseline } from "./suite-gate.js";

export function canCompleteTask(task: TaskRecord, now = Date.now(), maxEvidenceAgeMs = 60 * 60 * 1000): boolean {
  const required = task.validationPlan.filter((check) => check.required);
  if (task.acceptanceCriteria.length === 0 || required.length === 0) return false;
  const latestByCheck = new Map<string, Evidence>();
  for (const checkId of new Set(
    task.evidence.map((evidence) => evidence.checkId).filter((id): id is string => Boolean(id)),
  )) {
    const latest = selectLatestEvidence(task.evidence, checkId, now);
    if (latest) latestByCheck.set(checkId, latest);
  }
  const freshPasses = task.evidence.filter((evidence) => {
    if (evidence.result !== "pass" || !isFresh(evidence, now, maxEvidenceAgeMs, task.schemaVersion === 1)) return false;
    if (evidence.checkId !== undefined) {
      const latest = latestByCheck.get(evidence.checkId);
      if (task.schemaVersion === 1) {
        if (latest?.id !== evidence.id) return false;
      } else if (latest === undefined || latest.result !== "pass" || latest.inputDigest !== evidence.inputDigest) {
        return false;
      }
    }
    return task.schemaVersion === 1 || isInputDigest(evidence.inputDigest);
  });
  const proved = (check: (typeof required)[number]) =>
    freshPasses.some((evidence) => evidence.checkId === check.id) || authorizedRedBaseline(task, check);
  if (!required.every(proved)) return false;
  if (task.schemaVersion === 1) {
    return task.acceptanceCriteria.every(
      (criterion) =>
        criterion.status === "waived" ||
        (criterion.status === "met" &&
          criterion.evidenceIds.some((id) => freshPasses.some((evidence) => evidence.id === id))),
    );
  }
  const checks = new Map(task.validationPlan.map((check) => [check.id, check]));
  return task.acceptanceCriteria.every(
    (criterion) =>
      criterion.status === "waived" ||
      (criterion.status === "met" &&
        criterion.evidenceIds.some((id) => {
          const evidence = freshPasses.find((candidate) => candidate.id === id);
          return (
            evidence?.checkId !== undefined &&
            checks.get(evidence.checkId)?.criterionIds.includes(criterion.id) === true
          );
        })),
  );
}
export type VerificationRetryDisposition = "run" | "debug" | "stop";
export function verificationRetryDisposition(
  task: TaskRecord,
  checkId: string,
  now = Date.now(),
): VerificationRetryDisposition {
  const attempts = task.evidence
    .map((evidence, index) => ({ evidence, index }))
    .filter(
      ({ evidence }) =>
        evidence.checkId === checkId &&
        evidence.result !== "skipped" &&
        (evidence.result !== "pass" || isFresh(evidence, now, Number.POSITIVE_INFINITY, false)),
    )
    .sort((left, right) =>
      evidenceTime(left.evidence) === evidenceTime(right.evidence)
        ? left.index - right.index
        : evidenceTime(left.evidence) < evidenceTime(right.evidence)
          ? -1
          : 1,
    )
    .map(({ evidence }) => evidence);
  const latest = attempts.at(-1);
  if (latest?.result !== "fail") return "run";
  const previous = attempts.at(-2);
  if (previous?.result !== "fail") return "debug";
  return "stop";
}
export function evidenceSupportsScope(
  evidence: Evidence,
  requiredScope: "focused" | "full",
  checkScope: "focused" | "full",
): boolean {
  return evidence.result === "pass" && (requiredScope === "focused" || checkScope === "full");
}

function isFresh(evidence: Evidence, now: number, maxAgeMs: number, enforceMaxAge = true): boolean {
  const timestamp = Date.parse(evidence.recordedAt);
  return Number.isFinite(timestamp) && timestamp <= now && (!enforceMaxAge || now - timestamp <= maxAgeMs);
}
function evidenceTime(evidence: Evidence): number {
  const parsed = Date.parse(evidence.recordedAt);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}
function isInputDigest(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}
export function completionEvidenceIds(task: TaskRecord): string[] {
  const supporting = new Set(
    task.acceptanceCriteria
      .filter((criterion) => criterion.status === "met")
      .flatMap((criterion) => criterion.evidenceIds),
  );
  for (const check of task.validationPlan.filter((candidate) => candidate.required)) {
    let latest: Evidence | undefined;
    for (const evidence of task.evidence) {
      if (
        evidence.checkId === check.id &&
        evidence.result === "pass" &&
        (latest === undefined || evidenceTime(evidence) >= evidenceTime(latest))
      )
        latest = evidence;
    }
    if (latest) supporting.add(latest.id);
  }
  return [...supporting].sort(compareCodeUnits);
}
export async function assertTaskReadyForFinishing(harnixRoot: string, task: TaskRecord, now: string): Promise<void> {
  if (task.status !== "verifying" || task.checkpoint !== "finishing")
    throw new Error("Workflow learning capture requires an active verifying/finishing task.");
  if (task.schemaVersion !== 3)
    throw new Error(`Unfinished TaskRecord v${task.schemaVersion} tasks must migrate to schema v3 before finishing.`);
  const projectRoot = basename(harnixRoot) === ".harnix" ? dirname(harnixRoot) : harnixRoot;
  await assertInputDigestsFresh(projectRoot, task);
  await assertSuiteGateFinishing(projectRoot, task);
  if (!canCompleteTask(task, Date.parse(now)))
    throw new Error("Task requires fresh complete verification before finishing.");
}
