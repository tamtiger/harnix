import { describe, expect, it } from "vitest";

import {
  TASK_RECORD_FIELDS,
  acceptanceCriterionKeys,
  blockerKeys,
  cancellableStatuses,
  evidenceV2Keys,
  legalCheckpoints,
  taskRecordFieldManifest,
  taskRecordKeys,
  taskRecordV2Keys,
  transitions,
  validationCheckV2Keys,
} from "src/core/tasks/task-schema.js";

describe("task schema definitions", () => {
  it("derives the per-version field manifests from one field table", () => {
    const v1 = taskRecordFieldManifest(1);
    const v3 = taskRecordFieldManifest(3);

    expect(v1.required).toContain("validationPlan");
    expect(v1.optional).not.toContain("decisions");
    expect(v3.optional).toEqual(expect.arrayContaining(["decisions", "epicId", "residualRisks"]));
    expect(taskRecordFieldManifest(2)).toEqual(v3);
    expect([...v3.required, ...v3.optional].sort()).toEqual(TASK_RECORD_FIELDS.map((field) => field.name).sort());
    expect(v3.required).toEqual([...v3.required].sort());
  });

  it("keeps the v1 key set a strict subset of the v2/v3 key set", () => {
    for (const key of taskRecordKeys) expect(taskRecordV2Keys.has(key)).toBe(true);
    expect([...taskRecordV2Keys].filter((key) => !taskRecordKeys.has(key)).sort()).toEqual([
      "decisions",
      "epicId",
      "residualRisks",
    ]);
  });

  it("defines the nested key sets used by the validators", () => {
    expect([...acceptanceCriterionKeys].sort()).toEqual(["evidenceIds", "id", "status", "text", "waiverReason"]);
    expect(validationCheckV2Keys.has("criterionIds") && validationCheckV2Keys.has("inputs")).toBe(true);
    expect(evidenceV2Keys.has("inputDigest") && evidenceV2Keys.has("findings")).toBe(true);
    expect([...blockerKeys].sort()).toEqual(["kind", "nextAction", "resumeStatus", "summary"]);
  });

  it("only allows forward transitions and no way out of a terminal state", () => {
    expect(transitions.planning).toEqual(["ready", "blocked"]);
    expect(transitions.completed).toEqual([]);
    expect(transitions.cancelled).toEqual([]);
    expect(transitions.blocked).toEqual(["planning", "ready", "in_progress", "verifying"]);
  });

  it("limits cancellation to unfinished states and ties each status to its legal checkpoints", () => {
    expect(cancellableStatuses.has("completed")).toBe(false);
    expect(cancellableStatuses.has("cancelled")).toBe(false);
    expect(cancellableStatuses.has("blocked")).toBe(true);
    expect(legalCheckpoints.completed).toEqual(["finishing"]);
    expect(legalCheckpoints.cancelled).toEqual(["cancelling"]);
    expect(legalCheckpoints.ready).toEqual(["ready", "replan"]);
  });
});
