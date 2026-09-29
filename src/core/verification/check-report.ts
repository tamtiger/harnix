import { selectLatestEvidence, type EvidenceFindingV1, type TaskRecord } from "../tasks/task.js";
import { computeInputDigest } from "./input-digest.js";

export type RequiredCheckState = "passed" | "failed" | "stale" | "pending";
export type RequiredCheckReasonCode =
  | "digest-mismatch"
  | "evidence-expired"
  | "inputs-unavailable"
  | "latest-failed"
  | "latest-skipped"
  | "legacy-schema"
  | "no-evidence";

/**
 * Kept for the public checks payload. Digests are recomputed rather than stored, so
 * there is no snapshot to diff against and the list is always empty.
 */
export interface VerificationInputChange {
  readonly path: string;
  readonly kind: "changed" | "missing";
}

export interface RequiredCheckInspection {
  readonly id: string;
  readonly state: RequiredCheckState;
  readonly reasonCodes: readonly RequiredCheckReasonCode[];
  readonly changes: readonly VerificationInputChange[];
  readonly findings?: readonly EvidenceFindingV1[] | undefined;
}

export function createCheckFailureFinding(
  id: string,
  text: string,
  severity: "low" | "medium" | "high" | "critical" = "high",
): EvidenceFindingV1 {
  return { id, text, severity };
}

/**
 * A v3 pass is current exactly when the digest recomputed from today's inputs equals the
 * digest stored inline in the evidence. Legacy v1/v2 passes cannot be re-proven under
 * the v3 contract, so they report `legacy-schema` until the task migrates and re-verifies.
 */
export async function inspectRequiredChecks(
  projectRoot: string,
  _harnixRoot: string,
  task: TaskRecord,
  now = Date.now(),
): Promise<RequiredCheckInspection[]> {
  return Promise.all(
    task.validationPlan
      .filter((check) => check.required)
      .map(async (check): Promise<RequiredCheckInspection> => {
        const evidence = selectLatestEvidence(task.evidence, check.id, now);
        if (evidence === undefined) return inspection(check.id, "pending", ["no-evidence"]);
        const findings =
          task.schemaVersion === 1 ? undefined : (evidence as { findings?: EvidenceFindingV1[] }).findings;
        if (evidence.result === "skipped") return inspection(check.id, "pending", ["latest-skipped"], findings);
        if (evidence.result === "fail") return inspection(check.id, "failed", ["latest-failed"], findings);
        const timestamp = Date.parse(evidence.recordedAt);
        if (!Number.isFinite(timestamp) || timestamp > now)
          return inspection(check.id, "stale", ["evidence-expired"], findings);
        if (task.schemaVersion !== 3) return inspection(check.id, "stale", ["legacy-schema"], findings);
        try {
          const current = await computeInputDigest(projectRoot, task, check.id);
          return current.inputDigest === evidence.inputDigest
            ? inspection(check.id, "passed", [], findings)
            : inspection(check.id, "stale", ["digest-mismatch"], findings);
        } catch {
          return inspection(check.id, "stale", ["inputs-unavailable"], findings);
        }
      }),
  );
}

function inspection(
  id: string,
  state: RequiredCheckState,
  reasonCodes: readonly RequiredCheckReasonCode[],
  findings?: readonly EvidenceFindingV1[],
): RequiredCheckInspection {
  return {
    id,
    state,
    reasonCodes,
    changes: [],
    ...(findings !== undefined && findings.length > 0 ? { findings } : {}),
  };
}
