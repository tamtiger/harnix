import { describe, expect, it } from "vitest";

import { assertMarkableBy, markMetBy } from "src/core/workflow/evidence-criteria.js";
import { buildCheck, buildCriterion, buildTaskV3 } from "test/support/builders.js";

const check = buildCheck({ id: "c", criterionIds: ["a"] });
const task = buildTaskV3({
  acceptanceCriteria: [
    buildCriterion({ id: "a" }),
    buildCriterion({ id: "b" }),
    buildCriterion({ id: "w", status: "waived", waiverReason: "không còn áp dụng" }),
  ],
  validationPlan: [check],
});

describe("assertMarkableBy", () => {
  it("accepts a pass of a check that covers a pending criterion", () => {
    expect(() => assertMarkableBy(task, check, "pass", ["a"])).not.toThrow();
  });

  it.each([
    ["a failing result", "fail", ["a"], /--result pass/u],
    ["an unknown criterion", "pass", ["zzz"], /zzz/u],
    ["a waived criterion", "pass", ["w"], /waived/u],
    ["a criterion the check does not cover", "pass", ["b"], /does not cover/u],
  ])("refuses %s", (_name, result, ids, message) => {
    expect(() => assertMarkableBy(task, check, result, ids)).toThrow(message);
  });
});

describe("markMetBy", () => {
  it("marks only the named criteria met from the one evidence item", () => {
    const marked = markMetBy(task.acceptanceCriteria, ["a"], "ev-1");

    expect(marked.find((criterion) => criterion.id === "a")).toMatchObject({ status: "met", evidenceIds: ["ev-1"] });
    expect(marked.find((criterion) => criterion.id === "b")?.status).toBe("pending");
  });
});
