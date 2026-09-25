import { compareCodeUnits } from "../../utils/order.js";
import { selectLatestEvidence, type EvidenceFindingV1, type TaskRecord } from "../tasks/task.js";
import {
  compareVerificationInputSnapshots,
  computeVerificationInputSnapshot,
  loadVerificationInputSidecar,
  PlanningArtifactGrammarError,
  type StoredVerificationInputSnapshot,
  type VerificationInputChange,
} from "./input-freshness.js";

export type RequiredCheckState = "passed" | "failed" | "stale" | "pending";
export type RequiredCheckReasonCode =
  | "evidence-expired"
  | "inputs-changed"
  | "inputs-missing"
  | "inputs-unavailable"
  | "latest-failed"
  | "latest-skipped"
  | "no-evidence"
  | "plan-artifact-invalid"
  | "snapshot-invalid"
  | "snapshot-mismatch"
  | "snapshot-missing"
  | "task-contract-changed";

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

export async function inspectRequiredChecks(
  projectRoot: string,
  harnixRoot: string,
  task: TaskRecord,
  now = Date.now(),
  maxEvidenceAgeMs = 60 * 60 * 1_000,
): Promise<RequiredCheckInspection[]> {
  let sidecarInvalid = false;
  let storedByEvidence = new Map<string, StoredVerificationInputSnapshot>();
  if (task.schemaVersion === 2) {
    try {
      const sidecar = await loadVerificationInputSidecar(harnixRoot, task.id);
      storedByEvidence = new Map(sidecar?.snapshots.map((snapshot) => [snapshot.evidenceId, snapshot]) ?? []);
    } catch {
      sidecarInvalid = true;
    }
  }

  return Promise.all(task.validationPlan.filter((check) => check.required).map(async (check): Promise<RequiredCheckInspection> => {
    const evidence = selectLatestEvidence(task.evidence, check.id, now);
    if (evidence === undefined) return inspection(check.id, "pending", ["no-evidence"]);
    const findings = (task.schemaVersion === 2 && "findings" in evidence && Array.isArray((evidence as { findings?: EvidenceFindingV1[] }).findings))
      ? (evidence as { findings?: EvidenceFindingV1[] }).findings
      : undefined;
    if (evidence.result === "skipped") return inspection(check.id, "pending", ["latest-skipped"], [], findings);
    if (evidence.result === "fail") return inspection(check.id, "failed", ["latest-failed"], [], findings);
    const timestamp = Date.parse(evidence.recordedAt);
    if (!Number.isFinite(timestamp) || timestamp > now || (task.schemaVersion === 1 && now - timestamp > maxEvidenceAgeMs)) return inspection(check.id, "stale", ["evidence-expired"], [], findings);
    if (task.schemaVersion === 1) return inspection(check.id, "passed", [], [], findings);
    if (sidecarInvalid) return inspection(check.id, "stale", ["snapshot-invalid"], [], findings);

    const stored = storedByEvidence.get(evidence.id);
    if (stored === undefined) return inspection(check.id, "stale", ["snapshot-missing"], [], findings);
    if (stored.checkId !== check.id || stored.inputDigest !== evidence.inputDigest) return inspection(check.id, "stale", ["snapshot-mismatch"], [], findings);

    let current;
    try { current = await computeVerificationInputSnapshot(projectRoot, task, check.id, { schemaVersion: stored.schemaVersion }); }
    catch (error) {
      if (error instanceof PlanningArtifactGrammarError) return inspection(check.id, "stale", ["plan-artifact-invalid"], [], findings);
      return inspection(check.id, "stale", ["inputs-unavailable"], [], findings);
    }
    if (current.inputDigest === stored.inputDigest) return inspection(check.id, "passed", [], [], findings);

    const changes = compareVerificationInputSnapshots(stored, current);
    const reasons = new Set<RequiredCheckReasonCode>();
    if (current.taskContractHash !== stored.taskContractHash) reasons.add("task-contract-changed");
    if (changes.some((change) => change.kind === "changed")) reasons.add("inputs-changed");
    if (changes.some((change) => change.kind === "missing")) reasons.add("inputs-missing");
    if (reasons.size === 0) reasons.add("snapshot-mismatch");
    return inspection(check.id, "stale", [...reasons].sort(compareCodeUnits), changes, findings);
  }));
}

function inspection(
  id: string,
  state: RequiredCheckState,
  reasonCodes: readonly RequiredCheckReasonCode[],
  changes: readonly VerificationInputChange[] = [],
  findings?: readonly EvidenceFindingV1[],
): RequiredCheckInspection {
  return {
    id,
    state,
    reasonCodes,
    changes,
    ...(findings !== undefined && findings.length > 0 ? { findings } : {}),
  };
}
