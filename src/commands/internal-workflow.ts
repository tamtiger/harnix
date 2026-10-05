/**
 * Thin adapter: the hidden `workflow` transports live in `src/core/workflow/`. This module only
 * keeps the historical import path stable for the CLI wiring.
 */
export {
  addCriterionWorkflow,
  addDecisionWorkflow,
  addRiskWorkflow,
  appendEvidenceFlagsWorkflow,
  appendEvidenceWorkflow,
  batchWorkflow,
  briefPreflight,
  briefTask,
  cancelWorkflow,
  finishWorkflow,
  finishWorkflowReport,
  initTaskWorkflow,
  inspectWorkflow,
  markCriteriaMetWorkflow,
  migrateToV3Workflow,
  preflightWorkflow,
  recordLearningWorkflow,
  replaceCheckWorkflow,
  runCheckWorkflow,
  saveWorkflow,
  setCheckWorkflow,
  setPathsWorkflow,
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
