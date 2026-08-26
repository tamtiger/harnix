import { describe, expect, it } from "vitest";

import { createActiveStatus, createNoActiveStatus, type RequiredCheckState } from "../../src/core/status.js";
import type { ContextDrift } from "../../src/core/context/context.js";
import type { TaskRecordV1, TaskStatus } from "../../src/core/tasks/task.js";

describe("status projection", () => {
  it("returns the stable no-active projection", () => {
    expect(createNoActiveStatus()).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      activeTask: null,
      nextAction: { code: "no-active-task", message: "No active task; classify the next request." },
      attention: [],
    });
  });

  it("aggregates acceptance and check progress without exposing task prose", () => {
    const task = fixture("in_progress");
    task.acceptanceCriteria = [
      { id: "met", text: "PRIVATE_MET", status: "met", evidenceIds: ["e"] },
      { id: "pending", text: "PRIVATE_PENDING", status: "pending", evidenceIds: [] },
      { id: "waived", text: "PRIVATE_WAIVED", status: "waived", evidenceIds: [], waiverReason: "not applicable" },
    ];
    const result = createActiveStatus(task, currentContext(), ["passed", "failed", "stale", "pending"]);

    expect(result.activeTask?.progress).toEqual({
      acceptance: { met: 1, waived: 1, pending: 1, total: 3 },
      requiredChecks: { passed: 1, failed: 1, stale: 1, pending: 1, total: 4 },
    });
    expect(JSON.stringify(result)).not.toContain("PRIVATE_");
  });

  it("prioritizes blockers over stale context and keeps attention in fixed order", () => {
    const task = fixture("blocked");
    task.blocker = { kind: "credential", summary: "PRIVATE_BLOCKER", nextAction: "PRIVATE_ACTION", resumeStatus: "in_progress" };
    const context: ContextDrift = {
      state: "stale",
      changes: [{ path: "src/a.ts", kind: "changed" }],
      selectionChanges: ["inventory-changed"],
    };

    const result = createActiveStatus(task, context, ["failed", "stale"]);

    expect(result.nextAction.code).toBe("resolve-blocker");
    expect(result.attention).toEqual([
      { code: "context-stale", count: 2 },
      { code: "required-check-failed", count: 1 },
      { code: "required-check-stale", count: 1 },
    ]);
    expect(JSON.stringify(result)).not.toContain("PRIVATE_");
  });

  it.each([
    ["planning", currentContext(), ["pending"], "complete-planning"],
    ["ready", currentContext(), ["pending"], "begin-implementation"],
    ["in_progress", currentContext(), ["pending"], "continue-implementation"],
    ["verifying", currentContext(), ["pending"], "run-verification"],
    ["verifying", currentContext(), ["passed"], "finish-task"],
    ["completed", currentContext(), ["passed"], "finalize-task"],
    ["planning", { state: "stale", changes: [], selectionChanges: [] }, ["pending"], "replan-context"],
  ] as Array<[TaskStatus, ContextDrift, RequiredCheckState[], string]>) (
    "routes %s deterministically",
    (status, context, checks, expected) => {
      expect(createActiveStatus(fixture(status), context, checks).nextAction.code).toBe(expected);
    },
  );
});

function fixture(status: TaskStatus): TaskRecordV1 {
  const timestamp = "2026-08-26T00:00:00.000Z";
  return {
    generator: "harnix",
    schemaVersion: 1,
    id: "20260826-000003-unit-status",
    title: "PRIVATE_TITLE",
    mode: "lite",
    status,
    checkpoint: status === "planning" ? "planning"
      : status === "ready" ? "ready"
        : status === "in_progress" ? "implementing"
          : status === "completed" ? "finishing" : "verifying",
    goal: "PRIVATE_GOAL",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "done", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [],
    evidence: [{ id: "e", recordedAt: timestamp, result: "pass", summary: "pass", artifactPaths: [] }],
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(status === "completed" ? { completedAt: timestamp } : {}),
  };
}

function currentContext(): ContextDrift {
  return { state: "current", changes: [], selectionChanges: [] };
}
