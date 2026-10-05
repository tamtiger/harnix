export type TaskMode = "lite" | "full";
export type TaskStatus = "planning" | "ready" | "in_progress" | "verifying" | "blocked" | "completed" | "cancelled";
export type WorkflowCheckpoint =
  "triage" | "planning" | "ready" | "implementing" | "debugging" | "replan" | "verifying" | "finishing" | "cancelling";
/** The enum values the validator accepts; `workflow --schema` lists these same arrays. */
export const taskModes = ["lite", "full"] as const satisfies readonly TaskMode[];
export const taskStatuses = [
  "planning",
  "ready",
  "in_progress",
  "verifying",
  "blocked",
  "completed",
  "cancelled",
] as const satisfies readonly TaskStatus[];
export const workflowCheckpoints = [
  "triage",
  "planning",
  "ready",
  "implementing",
  "debugging",
  "replan",
  "verifying",
  "finishing",
  "cancelling",
] as const satisfies readonly WorkflowCheckpoint[];
export const checkScopes = ["focused", "full"] as const;
export const evidenceResults = ["pass", "fail", "skipped"] as const;
export const criterionStatuses = ["pending", "met", "waived"] as const;
export interface AcceptanceCriterion {
  id: string;
  text: string;
  status: "pending" | "met" | "waived";
  evidenceIds: string[];
  waiverReason?: string;
}
interface ValidationCheckBase {
  id: string;
  description: string;
  command?: string;
  scope: "focused" | "full";
  required: boolean;
}
export interface ValidationCheckV1 extends ValidationCheckBase {
  criterionIds?: never;
  inputs?: never;
}
export interface CheckBaselineWaiver {
  result?: "pass" | "fail" | "skipped";
  classification?: "pre-existing" | "introduced" | "environment" | "unknown";
  authorizedBy?: string;
  scope?: string;
}
export interface ValidationCheckV2 extends ValidationCheckBase {
  criterionIds: string[];
  inputs: string[];
  baseline?: CheckBaselineWaiver;
}
/** v3 keeps the v2 shape; `@task-contract` is no longer a declared input because the contract is folded into every digest. */
export type ValidationCheckV3 = ValidationCheckV2;
export type ValidationCheck = ValidationCheckV1 | ValidationCheckV2;
interface EvidenceBase {
  id: string;
  checkId?: string;
  recordedAt: string;
  result: "pass" | "fail" | "skipped";
  exitCode?: number;
  summary: string;
  artifactPaths: string[];
}
export interface EvidenceV1 extends EvidenceBase {
  inputDigest?: never;
  findings?: never;
}
/** Machine-readable severity for Stage-2 review, in place of free-form summary prose alone. */
export interface EvidenceFindingV1 {
  id: string;
  text: string;
  severity: "low" | "medium" | "high" | "critical";
}
export interface EvidenceV2 extends EvidenceBase {
  inputDigest?: string;
  findings?: EvidenceFindingV1[];
}
export type EvidenceV3 = EvidenceV2;
export type Evidence = EvidenceV1 | EvidenceV2;
export interface TaskBlocker {
  kind: "decision" | "authority" | "credential" | "external" | "repository";
  summary: string;
  nextAction: string;
  resumeStatus: "planning" | "ready" | "in_progress" | "verifying";
}
export interface TaskCancellation {
  reason: string;
  authorizedBy: "user";
}
/** Review data: why the task looks like this. Deliberately outside the completion contract. */
export interface TaskDecision {
  id: string;
  text: string;
  rationale: string;
}
export interface TaskResidualRisk {
  id: string;
  text: string;
  severity: "low" | "medium" | "high";
}
interface TaskRecordBase {
  generator: "harnix";
  id: string;
  title: string;
  mode: TaskMode;
  status: TaskStatus;
  checkpoint: WorkflowCheckpoint;
  goal: string;
  nonGoals: string[];
  acceptanceCriteria: AcceptanceCriterion[];
  relevantPaths: string[];
  relevantSpecs: string[];
  blocker?: TaskBlocker;
  cancellation?: TaskCancellation;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
}
export interface TaskRecordV1 extends TaskRecordBase {
  schemaVersion: 1;
  validationPlan: ValidationCheckV1[];
  evidence: EvidenceV1[];
  epicId?: never;
}
export interface TaskRecordV2 extends TaskRecordBase {
  schemaVersion: 2;
  validationPlan: ValidationCheckV2[];
  evidence: EvidenceV2[];
  decisions?: TaskDecision[];
  residualRisks?: TaskResidualRisk[];
  epicId?: string;
}
export interface TaskRecordV3 extends TaskRecordBase {
  schemaVersion: 3;
  validationPlan: ValidationCheckV3[];
  evidence: EvidenceV3[];
  decisions?: TaskDecision[];
  residualRisks?: TaskResidualRisk[];
  epicId?: string;
}
export type TaskRecord = TaskRecordV1 | TaskRecordV2 | TaskRecordV3;
export type TaskRecordWithReviewFields = TaskRecordV2 | TaskRecordV3;
export interface TaskValidationOptions {
  allowUnsafeCompletedEvidenceArtifacts?: boolean | undefined;
}

/**
 * Single source of truth for the top-level TaskRecord field set. Both the
 * runtime allowlist (`assertExactKeys`) and the public `--schema` transport
 * read this same manifest, so a field added here without updating anything
 * else still shows up correctly everywhere; there is no second literal list
 * to forget.
 */
export const TASK_RECORD_FIELDS: readonly {
  readonly name: string;
  readonly required: boolean;
  readonly sinceSchemaVersion: 1 | 2 | 3;
}[] = [
  { name: "acceptanceCriteria", required: true, sinceSchemaVersion: 1 },
  { name: "blocker", required: false, sinceSchemaVersion: 1 },
  { name: "cancellation", required: false, sinceSchemaVersion: 1 },
  { name: "cancelledAt", required: false, sinceSchemaVersion: 1 },
  { name: "checkpoint", required: true, sinceSchemaVersion: 1 },
  { name: "completedAt", required: false, sinceSchemaVersion: 1 },
  { name: "createdAt", required: true, sinceSchemaVersion: 1 },
  { name: "decisions", required: false, sinceSchemaVersion: 2 },
  { name: "epicId", required: false, sinceSchemaVersion: 2 },
  { name: "evidence", required: true, sinceSchemaVersion: 1 },
  { name: "generator", required: true, sinceSchemaVersion: 1 },
  { name: "goal", required: true, sinceSchemaVersion: 1 },
  { name: "id", required: true, sinceSchemaVersion: 1 },
  { name: "mode", required: true, sinceSchemaVersion: 1 },
  { name: "nonGoals", required: true, sinceSchemaVersion: 1 },
  { name: "relevantPaths", required: true, sinceSchemaVersion: 1 },
  { name: "relevantSpecs", required: true, sinceSchemaVersion: 1 },
  { name: "residualRisks", required: false, sinceSchemaVersion: 2 },
  { name: "schemaVersion", required: true, sinceSchemaVersion: 1 },
  { name: "status", required: true, sinceSchemaVersion: 1 },
  { name: "title", required: true, sinceSchemaVersion: 1 },
  { name: "updatedAt", required: true, sinceSchemaVersion: 1 },
  { name: "validationPlan", required: true, sinceSchemaVersion: 1 },
];
export const taskRecordKeys = new Set(
  TASK_RECORD_FIELDS.filter((field) => field.sinceSchemaVersion === 1).map((field) => field.name),
);
export const taskRecordV2Keys = new Set(TASK_RECORD_FIELDS.map((field) => field.name));
export const decisionKeys = new Set(["id", "rationale", "text"]);
export const residualRiskKeys = new Set(["id", "severity", "text"]);
export const acceptanceCriterionKeys = new Set(["evidenceIds", "id", "status", "text", "waiverReason"]);
export const validationCheckV1Keys = new Set(["command", "description", "id", "required", "scope"]);
export const validationCheckV2Keys = new Set([...validationCheckV1Keys, "criterionIds", "inputs", "baseline"]);
export const evidenceV1Keys = new Set([
  "artifactPaths",
  "checkId",
  "exitCode",
  "id",
  "recordedAt",
  "result",
  "summary",
]);
export const evidenceV2Keys = new Set([...evidenceV1Keys, "inputDigest", "findings"]);
export const evidenceFindingKeys = new Set(["id", "severity", "text"]);
export const blockerKeys = new Set(["kind", "nextAction", "resumeStatus", "summary"]);
export const cancellationKeys = new Set(["authorizedBy", "reason"]);

/** Read-only manifest for `workflow --schema`; derives from the same allowlists `validateTask` enforces. */
export function taskRecordFieldManifest(schemaVersion: 1 | 2 | 3): { required: string[]; optional: string[] } {
  const fields = TASK_RECORD_FIELDS.filter((field) => field.sinceSchemaVersion <= schemaVersion);
  return {
    required: fields
      .filter((field) => field.required)
      .map((field) => field.name)
      .sort(),
    optional: fields
      .filter((field) => !field.required)
      .map((field) => field.name)
      .sort(),
  };
}
export const transitions: Record<TaskStatus, TaskStatus[]> = {
  planning: ["ready", "blocked"],
  ready: ["in_progress", "blocked"],
  in_progress: ["verifying", "blocked"],
  verifying: ["completed", "blocked"],
  blocked: ["planning", "ready", "in_progress", "verifying"],
  completed: [],
  cancelled: [],
};
export const cancellableStatuses = new Set<TaskStatus>(["planning", "ready", "in_progress", "verifying", "blocked"]);
export const legalCheckpoints: Record<Exclude<TaskStatus, "blocked">, readonly WorkflowCheckpoint[]> = {
  planning: ["triage", "planning", "replan"],
  ready: ["ready", "replan"],
  in_progress: ["implementing", "debugging", "replan"],
  verifying: ["verifying", "debugging", "replan", "finishing"],
  completed: ["finishing"],
  cancelled: ["cancelling"],
};
