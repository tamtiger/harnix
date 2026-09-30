import { describe, expect, it } from "vitest";

import * as workflow from "src/core/workflow/index.js";

describe("workflow index", () => {
  it("exposes exactly the public workflow surface used by commands and hooks", () => {
    expect(Object.keys(workflow).sort()).toEqual([
      "addCriterionWorkflow",
      "addDecisionWorkflow",
      "addRiskWorkflow",
      "appendEvidenceFlagsWorkflow",
      "appendEvidenceWorkflow",
      "briefTask",
      "canCompleteTask",
      "cancelWorkflow",
      "cancelWorkflowTask",
      "contextSelectionInput",
      "continueWorkflowTask",
      "evidenceSupportsScope",
      "finishWorkflow",
      "finishWorkflowReport",
      "finishWorkflowTask",
      "implementationStrategy",
      "inspectWorkflow",
      "isWithinRequestedScope",
      "markCriteriaMetWorkflow",
      "migrateToV3Workflow",
      "nextWorkflowStatus",
      "preflightWorkflow",
      "recordLearningWorkflow",
      "recordWorkflowLearning",
      "routeWorkflow",
      "runCheckWorkflow",
      "saveWorkflow",
      "setCheckWorkflow",
      "setPathsWorkflow",
      "shouldReassessArchitecture",
      "shouldResearch",
      "snapshotWorkflow",
      "taskContextDrift",
      "transitionWorkflow",
      "validateFullReadyArtifact",
      "verificationRetryDisposition",
      "verificationStages",
      "workflowEnvelopeSchema",
    ]);
  });
});
