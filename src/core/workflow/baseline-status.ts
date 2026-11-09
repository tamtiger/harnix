import { selectLatestEvidence, type TaskRecord, type ValidationCheck } from "src/core/tasks/task.js";

export interface BaselineAssessment {
  /** True when the finish gate takes this check's red run as an authorized pre-existing failure. */
  readonly accepted: boolean;
  /** Why the baseline is not accepted yet; absent when it is. */
  readonly reason?: string;
}

const ACCEPTED_CLASSIFICATIONS = new Set(["pre-existing", "environment"]);

function declinedReason(task: TaskRecord, check: ValidationCheck): string | undefined {
  const baseline = (check as { baseline?: { result?: string; classification?: string; authorizedBy?: string } })
    .baseline;
  if (!check.required) return "the check is not required";
  if (baseline?.result !== "fail") return "baseline result is pass, so a red run is not covered";
  if ((baseline.authorizedBy ?? "").trim() === "") return "the baseline has no authorizer";
  if (!ACCEPTED_CLASSIFICATIONS.has(baseline.classification ?? ""))
    return `classification ${baseline.classification ?? "unknown"} is not accepted (pre-existing or environment)`;
  const latest = selectLatestEvidence(task.evidence, check.id);
  if (latest === undefined) return "no run recorded yet; run the check so the red run can match the baseline";
  if (latest.result !== "fail") return "the latest run is not red, so the ordinary rules judge this check";
  const proved = task.validationPlan.some(
    (proof) =>
      proof.id !== check.id &&
      proof.required &&
      (proof as { baseline?: unknown }).baseline === undefined &&
      selectLatestEvidence(task.evidence, proof.id)?.result === "pass" &&
      check.criterionIds?.every((id) => proof.criterionIds?.includes(id)) === true,
  );
  return proved
    ? undefined
    : "needs another required check without a baseline that passed and covers the same criteria";
}

/**
 * How the finish gate sees a check's baseline: accepted, or the one reason it is not yet. Undefined for a check that
 * declares no baseline. The single source for the gate (`authorizedRedBaseline`) and for what `status` shows.
 */
export function baselineAssessment(task: TaskRecord, check: ValidationCheck): BaselineAssessment | undefined {
  if ((check as { baseline?: unknown }).baseline === undefined) return undefined;
  const reason = declinedReason(task, check);
  return reason === undefined ? { accepted: true } : { accepted: false, reason };
}
