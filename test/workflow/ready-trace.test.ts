import { describe, expect, it } from "vitest";

import { auditReadyTrace } from "../../src/core/tasks/ready-trace.js";
import type { TaskRecordV2 } from "../../src/core/tasks/task.js";

describe("ready trace workflow", () => {
  it("accepts hyphen, en-dash, and em-dash in checklist items", () => {
    for (const dash of ["-", "–", "—"]) {
      const report = auditReadyTrace({
        task: task(),
        prd: [
          "# PRD",
          "### AC `criterion-a`",
          "Outcome A.",
          "### AC `criterion-b`",
          "Outcome B.",
        ].join("\n"),
        plan: [
          "# Plan",
          `- [ ] \`CAP-A\` ${dash} implement A`,
          `- [x] \`CAP-B\` ${dash} implement B`,
          "### Slice `CAP-A`",
          "Criteria: `criterion-a`",
          "Checks: `check-a`",
          "Paths: `src/a.ts`",
          "### Slice `CAP-B`",
          "Criteria: `criterion-b`",
          "Checks: `check-b`",
          "Paths: `src/b/**`",
        ].join("\n"),
      });

      expect(report.status).toBe("pass");
      expect(report.diagnostics).toEqual([]);
    }
  });
});

function task(): TaskRecordV2 {
  return {
    generator: "harnix",
    schemaVersion: 2,
    id: "20260818-120000-ready-trace",
    title: "Ready trace",
    mode: "full",
    status: "planning",
    checkpoint: "planning",
    goal: "test",
    nonGoals: [],
    acceptanceCriteria: [
      { id: "criterion-a", text: "A", status: "pending", evidenceIds: [] },
      { id: "criterion-b", text: "B", status: "pending", evidenceIds: [] },
    ],
    relevantPaths: ["src/a.ts", "src/b/**"],
    relevantSpecs: [],
    validationPlan: [
      { id: "check-a", description: "A", scope: "focused", required: true, criterionIds: ["criterion-a"], inputs: ["@task-contract", "src/a.ts"] },
      { id: "check-b", description: "B", scope: "focused", required: true, criterionIds: ["criterion-b"], inputs: ["@task-contract", "src/b/**"] },
    ],
    evidence: [],
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-08-18T00:00:00.000Z",
  };
}
