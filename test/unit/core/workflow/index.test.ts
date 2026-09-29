import { describe, expect, it } from "vitest";

import * as workflow from "src/core/workflow/index.js";

describe("workflow index", () => {
  it("exposes exactly the public workflow surface used by commands and hooks", () => {
    expect(Object.keys(workflow).sort()).toEqual([
      "appendEvidenceWorkflow",
      "canCompleteTask",
      "cancelWorkflow",
      "cancelWorkflowTask",
      "contextSelectionInput",
      "continueWorkflowTask",
      "evidenceSupportsScope",
      "finishWorkflow",
      "finishWorkflowTask",
      "implementationStrategy",
      "inspectWorkflow",
      "isWithinRequestedScope",
      "nextWorkflowStatus",
      "preflightWorkflow",
      "recordLearningWorkflow",
      "recordWorkflowLearning",
      "routeWorkflow",
      "saveWorkflow",
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
