import { describe, expect, it } from "vitest";

import {
  applyBatchChecks,
  applyBatchCriteria,
  applyBatchDecisions,
  applyBatchPaths,
  applyBatchRisks,
} from "src/core/workflow/batch-apply.js";
import { taskV3 } from "test/support/workflow-fixtures.js";

const fresh = () => structuredClone(taskV3("planning", "planning"));

describe("batch apply helpers", () => {
  it("replaces relevant paths and specs with sorted unique values and ignores an absent section", () => {
    const task = fresh();
    applyBatchPaths(task, undefined);
    expect(task.relevantPaths).toEqual([]);

    applyBatchPaths(task, { paths: ["src/b.ts", "src/a.ts", "src/b.ts"], specs: ["docs/x.md"] });

    expect(task.relevantPaths).toEqual(["src/a.ts", "src/b.ts"]);
    expect(task.relevantSpecs).toEqual(["docs/x.md"]);
  });

  it("appends decisions, trims their text and leaves the task alone for an empty list", () => {
    const task = fresh();
    applyBatchDecisions(task, []);
    expect(task.decisions).toBeUndefined();

    applyBatchDecisions(task, [{ id: "d1", text: "  first ", rationale: " r1 " }]);
    applyBatchDecisions(task, [{ id: "d2", text: "second", rationale: "r2" }]);

    expect(task.decisions).toEqual([
      { id: "d1", text: "first", rationale: "r1" },
      { id: "d2", text: "second", rationale: "r2" },
    ]);
  });

  it("rejects a repeated decision or risk id and empty text, as the single-item flags do", () => {
    const task = fresh();
    applyBatchDecisions(task, [{ id: "d1", text: "first", rationale: "r1" }]);
    applyBatchRisks(task, [{ id: "r1", text: "risk" }]);

    expect(() => applyBatchDecisions(task, [{ id: "d1", text: "again", rationale: "r" }])).toThrow(
      "Decision d1 already exists.",
    );
    expect(() =>
      applyBatchDecisions(task, [
        { id: "d9", text: "x", rationale: "r" },
        { id: "d9", text: "y", rationale: "r" },
      ]),
    ).toThrow("Decision d9 already exists.");
    expect(() => applyBatchRisks(task, [{ id: "r1", text: "again" }])).toThrow("Residual risk r1 already exists.");
    expect(() => applyBatchDecisions(task, [{ id: "d2", text: "  ", rationale: "r" }])).toThrow(
      /text must not be empty/u,
    );
    expect(() => applyBatchDecisions(task, [{ id: "d3", text: "t", rationale: " " }])).toThrow(
      /rationale must not be empty/u,
    );
    expect(() => applyBatchRisks(task, [{ id: "r2", text: "" }])).toThrow(/text must not be empty/u);
  });

  it("appends risks and defaults the severity to low like --add-risk", () => {
    const task = fresh();
    applyBatchRisks(task, undefined);
    expect(task.residualRisks).toBeUndefined();

    applyBatchRisks(task, [{ id: "r1", text: "risk" }]);
    applyBatchRisks(task, [{ id: "r2", text: "other", severity: "high" }]);

    expect(task.residualRisks).toEqual([
      { id: "r1", text: "risk", severity: "low" },
      { id: "r2", text: "other", severity: "high" },
    ]);
  });

  it("creates a missing check with defaults and merges only the given fields into an existing one", () => {
    const task = fresh();

    applyBatchChecks(task, [{ id: "new", criteria: ["a"], inputs: ["src/**", "src/**"], command: "pnpm lint" }]);
    const created = task.validationPlan.find((check) => check.id === "new");
    expect(created).toMatchObject({
      description: "new",
      scope: "focused",
      required: true,
      criterionIds: ["a"],
      inputs: ["src/**"],
      command: "pnpm lint",
    });

    applyBatchChecks(task, [{ id: "check", description: "renamed", scope: "focused", required: false }]);
    const merged = task.validationPlan.find((check) => check.id === "check");
    expect(merged).toMatchObject({ description: "renamed", scope: "focused", required: false, command: "pnpm test" });
    expect(merged?.criterionIds).toEqual(["a"]);
  });

  it("creates and updates criteria and maps them onto existing checks without duplicates", () => {
    const task = fresh();

    applyBatchCriteria(task, [{ id: "b", text: "second", checks: ["check", "missing"] }]);
    applyBatchCriteria(task, [{ id: "b", status: "waived", waiverReason: "not needed", checks: ["check"] }]);

    const criterion = task.acceptanceCriteria.find((item) => item.id === "b");
    expect(criterion).toMatchObject({ text: "second", status: "waived", waiverReason: "not needed", evidenceIds: [] });
    expect(task.validationPlan.find((check) => check.id === "check")?.criterionIds).toEqual(["a", "b"]);
  });

  it("falls back to the id as criterion text and pending status", () => {
    const task = fresh();

    applyBatchCriteria(task, [{ id: "c" }]);

    expect(task.acceptanceCriteria.find((item) => item.id === "c")).toMatchObject({ text: "c", status: "pending" });
  });
});
