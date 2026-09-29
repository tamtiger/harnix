import { describe, expect, it } from "vitest";
import {
  assertBlocker,
  assertCancellation,
  assertStatusCheckpointAndCompletion,
} from "src/core/tasks/task-validate-lifecycle.js";
import { buildTaskV2 } from "test/support/builders.js";
import { validateTask } from "src/core/tasks/task.js";
import { taskFixture, timestamp } from "test/support/tasks-fixtures.js";

describe("task validation lifecycle rules", () => {
  it("rejects future schema and malformed task records", () => {
    expect(() => validateTask({ ...taskFixture(), schemaVersion: 4 })).toThrow("unsupported");
    expect(() => validateTask({ ...taskFixture(), checkpoint: "unknown" })).toThrow("invalid");
  });

  it("rejects unsafe references, invalid timestamps, duplicate IDs, and illegal status/checkpoint combinations", () => {
    expect(() => validateTask({ ...taskFixture(), createdAt: "not-a-time" })).toThrow("timestamp");
    expect(() => validateTask({ ...taskFixture(), relevantPaths: ["../escape"] })).toThrow("path");
    expect(() =>
      validateTask({
        ...taskFixture(),
        validationPlan: [{ id: "check", description: "x", scope: "focused", required: true }],
        evidence: [
          { id: "e", checkId: "missing", recordedAt: timestamp, result: "pass", summary: "x", artifactPaths: [] },
        ],
      }),
    ).toThrow("check");
    expect(() =>
      validateTask({
        ...taskFixture(),
        acceptanceCriteria: [
          { id: "a", text: "x", status: "pending", evidenceIds: [] },
          { id: "a", text: "y", status: "pending", evidenceIds: [] },
        ],
      }),
    ).toThrow(/duplicate/iu);
    expect(() => validateTask({ ...taskFixture(), status: "ready", checkpoint: "implementing" })).toThrow("checkpoint");
  });

  it("should_accept_optional_rationale_fields_on_schema_v2_and_reject_them_on_v1", () => {
    const base = buildTaskV2({
      id: "20260916-120000-rationale",
      title: "t",
      goal: "g",
      acceptanceCriteria: [],
      validationPlan: [],
      createdAt: "2026-09-16T00:00:00.000Z",
      updatedAt: "2026-09-16T00:00:00.000Z",
    });
    const decisions = [
      { id: "d1", text: "Skill phân phối bằng command", rationale: "Không tăng footprint và luôn khớp version." },
    ];
    const residualRisks = [{ id: "r1", text: "internal-workflow.ts vẫn lớn", severity: "low" as const }];

    expect(validateTask({ ...base, decisions, residualRisks })).toMatchObject({ decisions, residualRisks });
    expect((validateTask(base) as { decisions?: unknown }).decisions).toBeUndefined();
    expect(() => validateTask({ ...base, schemaVersion: 1, decisions })).toThrow(/unknown schema field/u);
    expect(() => validateTask({ ...base, decisions: [{ id: "bad id", text: "x", rationale: "y" }] })).toThrow();
    expect(() => validateTask({ ...base, decisions: [{ id: "d1", text: "", rationale: "y" }] })).toThrow();
    expect(() => validateTask({ ...base, decisions: [{ id: "d1", text: "x", rationale: "y", extra: 1 }] })).toThrow(
      /unknown schema field/u,
    );
    expect(() =>
      validateTask({ ...base, residualRisks: [{ id: "r1", text: "x", severity: "catastrophic" }] }),
    ).toThrow();
    expect(() =>
      validateTask({
        ...base,
        decisions: [
          { id: "d1", text: "x", rationale: "y" },
          { id: "d1", text: "z", rationale: "w" },
        ],
      }),
    ).toThrow(/Duplicate/u);
  });
});

describe("lifecycle assertions", () => {
  const blockedFields = {
    status: "blocked",
    checkpoint: "planning",
    blocker: { kind: "external", summary: "Waiting", nextAction: "Retry", resumeStatus: "planning" },
  };

  it("requires a complete blocker exactly when a task is blocked", () => {
    expect(() => assertBlocker({ ...blockedFields })).not.toThrow();
    expect(() => assertBlocker({ status: "blocked" })).toThrow("Blocked task blocker is invalid.");
    expect(() => assertBlocker({ status: "planning", blocker: blockedFields.blocker })).toThrow(
      "Only blocked tasks may retain a blocker.",
    );
    expect(() => assertBlocker({ ...blockedFields, blocker: { ...blockedFields.blocker, kind: "other" } })).toThrow(
      "Blocked task blocker is invalid.",
    );
    expect(() => assertBlocker({ ...blockedFields, blocker: { ...blockedFields.blocker, extra: 1 } })).toThrow(
      "Task blocker contains an unknown schema field.",
    );
  });

  it("requires cancellation metadata exactly when a task is cancelled", () => {
    const cancelled = {
      status: "cancelled",
      updatedAt: "2026-09-29T09:00:00.000+07:00",
      cancelledAt: "2026-09-29T09:01:00.000+07:00",
      cancellation: { reason: "Người dùng dừng task.", authorizedBy: "user" },
    };

    expect(() => assertCancellation(cancelled)).not.toThrow();
    expect(() => assertCancellation({ status: "planning" })).not.toThrow();
    expect(() => assertCancellation({ status: "planning", cancelledAt: cancelled.cancelledAt })).toThrow(
      "Only cancelled tasks may retain cancellation metadata.",
    );
    expect(() => assertCancellation({ ...cancelled, cancellation: { reason: "", authorizedBy: "user" } })).toThrow(
      "Cancelled task is missing cancellation requirements.",
    );
    expect(() => assertCancellation({ ...cancelled, cancelledAt: "2026-09-29T08:00:00.000+07:00" })).toThrow(
      "Cancelled task is missing cancellation requirements.",
    );
  });

  it("ties checkpoints to the owning status and completion to fully decided criteria", () => {
    expect(() => assertStatusCheckpointAndCompletion({ status: "ready", checkpoint: "ready" })).not.toThrow();
    expect(() => assertStatusCheckpointAndCompletion({ status: "ready", checkpoint: "implementing" })).toThrow(
      "Task status/checkpoint combination is invalid.",
    );
    expect(() => assertStatusCheckpointAndCompletion({ ...blockedFields })).not.toThrow();
    const completed = {
      status: "completed",
      checkpoint: "finishing",
      updatedAt: "2026-09-29T09:00:00.000+07:00",
      completedAt: "2026-09-29T09:00:00.000+07:00",
      acceptanceCriteria: [{ status: "met" }],
    };
    expect(() => assertStatusCheckpointAndCompletion(completed)).not.toThrow();
    expect(() =>
      assertStatusCheckpointAndCompletion({ ...completed, acceptanceCriteria: [{ status: "pending" }] }),
    ).toThrow("Completed task is missing completion requirements.");
    expect(() => assertStatusCheckpointAndCompletion({ ...completed, completedAt: undefined })).toThrow(
      "Completed task is missing completion requirements.",
    );
  });
});
