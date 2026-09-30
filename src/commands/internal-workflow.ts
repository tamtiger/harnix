/**
 * Thin adapter: the hidden `workflow` transports live in `src/core/workflow/`. This module only
 * keeps the historical import path stable for the CLI wiring.
 */
export {
  appendEvidenceFlagsWorkflow,
  appendEvidenceWorkflow,
  briefTask,
  cancelWorkflow,
  finishWorkflow,
  inspectWorkflow,
  markCriteriaMetWorkflow,
  migrateToV3Workflow,
  preflightWorkflow,
  recordLearningWorkflow,
  runCheckWorkflow,
  saveWorkflow,
  snapshotWorkflow,
  transitionWorkflow,
  workflowEnvelopeSchema,
} from "src/core/workflow/index.js";
export type {
  WorkflowEnvelopeSchemaV1,
  WorkflowPreflightResultV1,
  WorkflowSaveArtifacts,
  WorkflowSaveEnvelope,
} from "src/core/workflow/index.js";
