import type { EvidenceV2, EvidenceV3 } from "./task-schema.js";

export const TASK_V2_MIGRATION_EVIDENCE_ID = "task-schema-v1-to-v2";
export const TASK_V2_MIGRATION_SUMMARY =
  "Migrated TaskRecord schema from v1 to v2 with explicit authorization at replan.";
export const TASK_V3_MIGRATION_EVIDENCE_ID = "task-schema-to-v3";
export const TASK_V3_MIGRATION_SUMMARY = "Migrated TaskRecord schema to v3 with explicit authorization.";

export function createTaskV3MigrationEvidence(taskId: string, recordedAt: string): EvidenceV3 {
  return {
    id: TASK_V3_MIGRATION_EVIDENCE_ID,
    recordedAt,
    result: "pass",
    summary: TASK_V3_MIGRATION_SUMMARY,
    artifactPaths: [`.harnix/tasks/${taskId}/task.json`],
  };
}

export function createTaskV2MigrationEvidence(taskId: string, recordedAt: string): EvidenceV2 {
  return {
    id: TASK_V2_MIGRATION_EVIDENCE_ID,
    recordedAt,
    result: "pass",
    summary: TASK_V2_MIGRATION_SUMMARY,
    artifactPaths: [`.harnix/tasks/${taskId}/task.json`],
  };
}
