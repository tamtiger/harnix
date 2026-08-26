import { describe, expect, it } from "vitest";

import { createNoActiveTaskAudit, createTaskAudit, type TaskAuditDependencies } from "../../src/core/tasks/task-audit.js";
import type { RequiredCheckState } from "../../src/core/status.js";
import type { TaskRecordV1 } from "../../src/core/tasks/task.js";

const now = Date.parse("2026-08-26T01:00:00.000Z");

describe("task audit", () => {
  it("returns a minimal no-active projection", () => {
    expect(createNoActiveTaskAudit()).toEqual({ generator: "harnix", schemaVersion: 1, activeTask: null });
  });

  it("projects completion-ready criteria and sorted required-check blockers without prose", async () => {
    const task = liteTask();
    task.acceptanceCriteria = [
      { id: "met", text: "PRIVATE_MET_CANARY", status: "met", evidenceIds: ["e-pass"] },
      { id: "waived", text: "PRIVATE_WAIVED_CANARY", status: "waived", evidenceIds: [], waiverReason: "PRIVATE_WAIVER_CANARY" },
      { id: "pending", text: "PRIVATE_PENDING_CANARY", status: "pending", evidenceIds: [] },
    ];
    task.validationPlan = ["stale", "passed", "pending", "failed"].map((id) => ({
      id,
      description: `PRIVATE_CHECK_${id}`,
      command: `PRIVATE_COMMAND_${id}`,
      scope: "focused" as const,
      required: true,
    }));
    task.evidence = [{
      id: "e-pass",
      checkId: "passed",
      recordedAt: "2026-08-26T00:59:00.000Z",
      result: "pass",
      exitCode: 0,
      summary: "PRIVATE_EVIDENCE_CANARY",
      artifactPaths: [],
    }];

    const result = await createTaskAudit("project", "harnix", task, now, dependencies(["stale", "passed", "pending", "failed"]));

    expect(result.activeTask).toEqual({
      id: task.id,
      mode: "lite",
      status: "verifying",
      checkpoint: "verifying",
      readiness: { status: "not-applicable", diagnostics: [] },
      completion: {
        status: "fail",
        criteria: { met: 1, waived: 1, pending: 1, total: 3, pendingIds: ["pending"] },
        requiredChecks: {
          passed: 1,
          failed: 1,
          stale: 1,
          pending: 1,
          total: 4,
          failedIds: ["failed"],
          staleIds: ["stale"],
          pendingIds: ["pending"],
        },
      },
    });
    expect(JSON.stringify(result)).not.toContain("PRIVATE_");
  });

  it("reuses ready-trace diagnostics while stripping messages", async () => {
    const task = fullTask();
    const validPrd = "# PRD\n### AC `criterion`\nDone.\n";
    const validPlan = [
      "# Plan",
      "- [ ] `SLICE` — implement",
      "### Slice `SLICE`",
      "Criteria: `criterion`",
      "Checks: `gate`",
      "Paths: `src/a.ts`",
      "",
    ].join("\n");
    const pass = await createTaskAudit("project", "harnix", task, now, dependencies(["pending"], { "prd.md": validPrd, "plan.md": validPlan }));
    expect(pass.activeTask?.readiness).toEqual({ status: "pass", diagnostics: [] });

    const fail = await createTaskAudit("project", "harnix", task, now, dependencies(["pending"], { "prd.md": validPrd, "plan.md": `${validPlan}TODO\n` }));
    expect(fail.activeTask?.readiness).toMatchObject({
      status: "fail",
      diagnostics: [expect.objectContaining({ code: "placeholder", artifact: "plan.md" })],
    });
    expect(JSON.stringify(fail)).not.toContain("message");
    expect(JSON.stringify(fail)).not.toContain("unresolved placeholder");
  });

  it("returns artifact-unavailable without leaking read errors", async () => {
    const task = fullTask();
    const result = await createTaskAudit("project", "harnix", task, now, {
      inspectRequiredChecks: async () => ["pending"],
      readArtifact: async (_root, _taskId, artifact) => {
        if (artifact === "plan.md") throw new Error("PRIVATE_ABSOLUTE_PATH_CANARY");
        return "# PRD\n### AC `criterion`\nDone.\n";
      },
    });

    expect(result.activeTask?.readiness).toEqual({
      status: "unavailable",
      diagnostics: [{ code: "artifact-unavailable", artifact: "plan.md" }],
    });
    expect(JSON.stringify(result)).not.toContain("PRIVATE_ABSOLUTE_PATH_CANARY");
  });

  it("passes completion only when criteria and required checks satisfy finish semantics", async () => {
    const task = liteTask();
    task.acceptanceCriteria = [{ id: "criterion", text: "done", status: "met", evidenceIds: ["e-pass"] }];
    task.validationPlan = [{ id: "gate", description: "verify", scope: "focused", required: true }];
    task.evidence = [{ id: "e-pass", checkId: "gate", recordedAt: "2026-08-26T00:59:00.000Z", result: "pass", summary: "ok", artifactPaths: [] }];

    const result = await createTaskAudit("project", "harnix", task, now, dependencies(["passed"]));

    expect(result.activeTask?.completion).toEqual({
      status: "pass",
      criteria: { met: 1, waived: 0, pending: 0, total: 1, pendingIds: [] },
      requiredChecks: { passed: 1, failed: 0, stale: 0, pending: 0, total: 1, failedIds: [], staleIds: [], pendingIds: [] },
    });
  });
});

function dependencies(
  states: RequiredCheckState[],
  artifacts: Partial<Record<"prd.md" | "plan.md", string>> = {},
): TaskAuditDependencies {
  return {
    inspectRequiredChecks: async () => states,
    readArtifact: async (_root, _taskId, artifact) => artifacts[artifact] ?? "",
  };
}

function liteTask(): TaskRecordV1 {
  return {
    generator: "harnix",
    schemaVersion: 1,
    id: "20260826-120000-task-audit",
    title: "PRIVATE_TITLE_CANARY",
    mode: "lite",
    status: "verifying",
    checkpoint: "verifying",
    goal: "PRIVATE_GOAL_CANARY",
    nonGoals: [],
    acceptanceCriteria: [],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [],
    evidence: [],
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:30:00.000Z",
  };
}

function fullTask(): TaskRecordV1 {
  const task = liteTask();
  return {
    ...task,
    mode: "full",
    status: "planning",
    checkpoint: "planning",
    acceptanceCriteria: [{ id: "criterion", text: "done", status: "pending", evidenceIds: [] }],
    validationPlan: [{ id: "gate", description: "verify", scope: "focused", required: true }],
  };
}
