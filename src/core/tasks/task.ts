/**
 * Public surface of the TaskRecord module. The implementation lives in focused files:
 * task-schema (types, field manifests, transition tables), task-validate (+ -common, -contracts),
 * task-migration (schema-migration evidence), task-state (transitions), task-store (persistence),
 * task-review (derived review.md). This barrel keeps every existing import path stable.
 */
export type {
  AcceptanceCriterion,
  Evidence,
  EvidenceFindingV1,
  EvidenceV1,
  EvidenceV2,
  EvidenceV3,
  TaskBlocker,
  TaskCancellation,
  TaskDecision,
  TaskMode,
  TaskRecord,
  TaskRecordV1,
  TaskRecordV2,
  TaskRecordV3,
  TaskRecordWithReviewFields,
  TaskResidualRisk,
  TaskStatus,
  TaskValidationOptions,
  ValidationCheck,
  ValidationCheckV1,
  ValidationCheckV2,
  ValidationCheckV3,
  WorkflowCheckpoint,
} from "./task-schema.js";
export {
  TASK_RECORD_FIELDS,
  acceptanceCriterionKeys,
  blockerKeys,
  decisionKeys,
  evidenceV2Keys,
  residualRiskKeys,
  taskRecordFieldManifest,
  validationCheckV2Keys,
} from "./task-schema.js";
export {
  TASK_V2_MIGRATION_EVIDENCE_ID,
  TASK_V2_MIGRATION_SUMMARY,
  TASK_V3_MIGRATION_EVIDENCE_ID,
  TASK_V3_MIGRATION_SUMMARY,
  createTaskV2MigrationEvidence,
  createTaskV3MigrationEvidence,
} from "./task-migration.js";
export { validateTask } from "./task-validate.js";
export { TaskValidationError, isIsoTimestamp, isRecord } from "./task-validate-common.js";
export { cancelTask, selectLatestEvidence, transitionTask, updateTaskCheckpoint } from "./task-state.js";
export type { TaskArtifacts } from "./task-store.js";
export {
  archiveTask,
  clearActiveTask,
  loadTask,
  resolveActiveTask,
  saveTask,
  saveTaskArtifacts,
  saveTaskWithArtifacts,
  setActiveTask,
  validateTaskArtifacts,
} from "./task-store.js";
