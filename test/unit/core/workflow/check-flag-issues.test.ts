import { describe, expect, it } from "vitest";

import { checkFlagIssues } from "src/core/workflow/check-flag-issues.js";
import type { ValidationCheckV3 } from "src/core/tasks/task.js";

const existing: ValidationCheckV3 = {
  id: "c",
  description: "d",
  scope: "focused",
  required: true,
  command: "pnpm test",
  criterionIds: ["ac-1"],
  inputs: ["src/**"],
};

describe("checkFlagIssues", () => {
  it("lists every missing flag of a new required check at once", () => {
    const issues = checkFlagIssues(undefined, { id: "c" });

    expect(issues.join("\n")).toMatch(/--scope[^]*--description[^]*--criteria[^]*--input/u);
    expect(issues).toHaveLength(4);
  });

  it("names the accepted scope values when the scope is wrong", () => {
    const issues = checkFlagIssues(existing, { id: "c", scope: "project" });

    expect(issues).toEqual(['--scope must be focused or full (got "project").']);
  });

  it("has nothing to say about a complete edit or an edit of an existing check", () => {
    expect(checkFlagIssues(existing, { id: "c", description: "changed" })).toEqual([]);
    expect(
      checkFlagIssues(undefined, { id: "n", scope: "full", description: "d", criteria: ["ac-1"], inputs: ["src/**"] }),
    ).toEqual([]);
  });

  it("does not demand criteria and inputs of an optional check", () => {
    expect(checkFlagIssues(undefined, { id: "n", scope: "full", description: "d", required: false })).toEqual([]);
  });
});
