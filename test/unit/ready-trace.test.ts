import { describe, expect, it } from "vitest";

import { auditReadyTrace } from "../../src/core/tasks/ready-trace.js";
import type { TaskRecordV2 } from "../../src/core/tasks/task.js";

describe("ready trace", () => {
  it("accepts a complete deterministic Full-task trace and ignores fenced examples", () => {
    const report = auditReadyTrace({
      task: task(),
      prd: [
        "# PRD",
        "### AC `criterion-a`",
        "Outcome A.",
        "### AC `criterion-b`",
        "Outcome B.",
        "```text",
        "TODO ### AC `fake`",
        "```",
      ].join("\n"),
      plan: [
        "# Plan",
        "- [ ] `CAP-A` — implement A",
        "- [ ] `CAP-B` — implement B",
        "### Slice `CAP-A`",
        "Criteria: `criterion-a`",
        "Checks: `check-a`",
        "Paths: `src/a.ts`, `test/a.test.ts`",
        "### Slice `CAP-B`",
        "Criteria: `criterion-b`",
        "Checks: `check-b`",
        "Paths: `src/b/**`",
      ].join("\n"),
    });

    expect(report).toEqual({ generator: "harnix", schemaVersion: 1, taskId: "20260818-120000-ready-trace", status: "pass", diagnostics: [] });
  });

  it("returns sorted bounded diagnostics without echoing artifact content", () => {
    const report = auditReadyTrace({
      task: task(),
      prd: "# PRD\nTODO fill this\n### AC `criterion-a`\n### AC `criterion-a`\n### AC `unknown-prd-criterion`\n",
      plan: [
        "- [ ] `CAP-A` — duplicate",
        "- [ ] `CAP-A` — duplicate",
        "### Slice `CAP-A`",
        "Criteria: `unknown-criterion`",
        "Checks: `unknown-check`",
        "Paths: `../secret`, `C:/secret`",
      ].join("\n"),
    });

    expect(report.status).toBe("fail");
    expect(report.diagnostics).toEqual([...report.diagnostics].sort((left, right) => {
      const artifactOrder = left.artifact < right.artifact ? -1 : left.artifact > right.artifact ? 1 : 0;
      const codeOrder = left.code < right.code ? -1 : left.code > right.code ? 1 : 0;
      const leftId = left.id ?? "";
      const rightId = right.id ?? "";
      const idOrder = leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
      return artifactOrder || codeOrder || idOrder || (left.line ?? 0) - (right.line ?? 0);
    }));
    expect(report.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ artifact: "prd.md", code: "criterion-duplicate", id: "criterion-a" }),
      expect.objectContaining({ artifact: "prd.md", code: "criterion-missing", id: "criterion-b" }),
      expect.objectContaining({ artifact: "prd.md", code: "placeholder", line: 2 }),
      expect.objectContaining({ artifact: "prd.md", code: "unknown-criterion", id: "unknown-prd-criterion" }),
      expect.objectContaining({ artifact: "plan.md", code: "slice-duplicate", id: "CAP-A" }),
      expect.objectContaining({ artifact: "plan.md", code: "unknown-criterion", id: "unknown-criterion" }),
      expect.objectContaining({ artifact: "plan.md", code: "unknown-check", id: "unknown-check" }),
      expect.objectContaining({ artifact: "plan.md", code: "unsafe-path", id: "../secret" }),
      expect.objectContaining({ artifact: "plan.md", code: "orphan-criterion", id: "criterion-a" }),
      expect.objectContaining({ artifact: "plan.md", code: "orphan-required-check", id: "check-a" }),
    ]));
    expect(JSON.stringify(report)).not.toContain("fill this");
    expect(JSON.stringify(report)).not.toContain("C:/secret");
  });

  it("fails closed at artifact and line bounds", () => {
    expect(auditReadyTrace({ task: task(), prd: "x".repeat(1_048_577), plan: "# Plan" }).diagnostics).toContainEqual(expect.objectContaining({ artifact: "prd.md", code: "artifact-too-large" }));
    expect(auditReadyTrace({ task: task(), prd: `### AC \`criterion-a\`\n${"x".repeat(4097)}`, plan: "# Plan" }).diagnostics).toContainEqual(expect.objectContaining({ artifact: "prd.md", code: "line-too-long", line: 2 }));
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
