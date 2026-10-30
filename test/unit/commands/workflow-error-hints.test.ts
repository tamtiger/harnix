import { describe, expect, it } from "vitest";

import { reasonHint } from "src/commands/workflow-error-hints.js";

describe("reasonHint", () => {
  it.each([
    ["setCheck", "--set-check ... --reason"],
    ["addCriterion", "--add-criterion ... --reason"],
    ["setCriterion", "--set-criterion ... --reason"],
    ["replaceCheck", "--replace-check ... --reason"],
  ])("names the running flag and a runnable --reason example for %s", (action, expected) => {
    const hint = reasonHint("--reason (10-1000 characters) is required to revise obligations after planning.", [
      action,
    ]);
    expect(hint).toContain(expected);
    expect(hint).toContain('--reason "<10-1000 ký tự>"');
  });

  it("points a batch at the reason field of the envelope", () => {
    expect(reasonHint("--reason must be 10-1000 characters.", ["batch"])).toContain('"reason" trong envelope');
  });

  it("stays silent for an unrelated error or an action without --reason", () => {
    expect(reasonHint("Workflow check x is not declared.", ["setCheck"])).toBeUndefined();
    expect(reasonHint("--reason must be 10-1000 characters.", ["finish"])).toBeUndefined();
  });
});
