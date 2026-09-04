import { compareCodeUnits } from "../../utils/order.js";
import { selectLatestEvidence } from "../tasks/task.js";
import type { TaskRecord } from "../tasks/task.js";
import {
  compareVerificationInputSnapshots,
  computeVerificationInputSnapshot,
  loadVerificationInputSidecar,
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
  | "snapshot-invalid"
  | "snapshot-mismatch"
  | "snapshot-missing"
  | "task-contract-changed";

export interface RequiredCheckInspection {
  readonly id: string;
  readonly state: RequiredCheckState;
  readonly reasonCodes: readonly RequiredCheckReasonCode[];
  readonly changes: readonly VerificationInputChange[];
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
    if (evidence.result === "skipped") return inspection(check.id, "pending", ["latest-skipped"]);
    if (evidence.result === "fail") return inspection(check.id, "failed", ["latest-failed"]);
    const timestamp = Date.parse(evidence.recordedAt);
    if (!Number.isFinite(timestamp) || timestamp > now || (task.schemaVersion === 1 && now - timestamp > maxEvidenceAgeMs)) return inspection(check.id, "stale", ["evidence-expired"]);
    if (task.schemaVersion === 1) return inspection(check.id, "passed", []);
    if (sidecarInvalid) return inspection(check.id, "stale", ["snapshot-invalid"]);

    const stored = storedByEvidence.get(evidence.id);
    if (stored === undefined) return inspection(check.id, "stale", ["snapshot-missing"]);
    if (stored.checkId !== check.id || stored.inputDigest !== evidence.inputDigest) return inspection(check.id, "stale", ["snapshot-mismatch"]);

    let current;
    try { current = await computeVerificationInputSnapshot(projectRoot, task, check.id, { schemaVersion: stored.schemaVersion }); }
    catch { return inspection(check.id, "stale", ["inputs-unavailable"]); }
    if (current.inputDigest === stored.inputDigest) return inspection(check.id, "passed", []);

    const changes = compareVerificationInputSnapshots(stored, current);
    const reasons = new Set<RequiredCheckReasonCode>();
    if (current.taskContractHash !== stored.taskContractHash) reasons.add("task-contract-changed");
    if (changes.some((change) => change.kind === "changed")) reasons.add("inputs-changed");
    if (changes.some((change) => change.kind === "missing")) reasons.add("inputs-missing");
    if (reasons.size === 0) reasons.add("snapshot-mismatch");
    return inspection(check.id, "stale", [...reasons].sort(compareCodeUnits), changes);
  }));
}

function inspection(
  id: string,
  state: RequiredCheckState,
  reasonCodes: readonly RequiredCheckReasonCode[],
  changes: readonly VerificationInputChange[] = [],
): RequiredCheckInspection {
  return { id, state, reasonCodes, changes };
}
