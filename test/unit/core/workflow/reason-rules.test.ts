import { describe, expect, it } from "vitest";

import { WORKFLOW_ACTIONS, actionFlagName } from "src/core/workflow/actions.js";
import { REASON_RULES, reasonConstraints } from "src/core/workflow/reason-rules.js";

describe("reason rules", () => {
  it("names a rule for every action, with not accepted for the rest", () => {
    const constraints = reasonConstraints();

    expect(Object.keys(constraints)).toEqual(WORKFLOW_ACTIONS.map((spec) => actionFlagName(spec.name)));
    expect(constraints["--replace-check"]).toMatch(/required/u);
    expect(constraints["--set-check"]).toMatch(/after planning/u);
    expect(constraints["--set-goal"]).toMatch(/optional/u);
    expect(constraints["--set-title"]).toMatch(/optional/u);
    expect(constraints["--run-checks"]).toBe("not accepted");
    expect(constraints["--batch"]).toMatch(/envelope/u);
    expect(constraints["--save"]).toMatch(/contractRevision/u);
  });

  it("only lists real actions", () => {
    const names = new Set(WORKFLOW_ACTIONS.map((spec) => spec.name));

    expect(Object.keys(REASON_RULES).filter((name) => !names.has(name))).toEqual([]);
  });
});
