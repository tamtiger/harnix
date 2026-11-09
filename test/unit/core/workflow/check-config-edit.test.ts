import { describe, expect, it } from "vitest";

import { provenCheckIds, withoutUnprovenConfig } from "src/core/workflow/check-config-edit.js";
import { buildCheck, buildEvidence, buildTaskV3 } from "test/support/builders.js";

describe("check config edits", () => {
  it("lists only the checks that have a passing run", () => {
    const task = buildTaskV3({
      evidence: [
        buildEvidence({ id: "e1", checkId: "passed" }),
        buildEvidence({ id: "e2", checkId: "failed", result: "fail", exitCode: 1 }),
      ],
    });

    expect([...provenCheckIds(task)]).toEqual(["passed"]);
  });

  it("drops cwd and description of an unproven check and keeps a proven check whole", () => {
    const check = buildCheck({ id: "c", cwd: "svc", description: "d" });

    expect(withoutUnprovenConfig(check, new Set())).not.toHaveProperty("cwd");
    expect(withoutUnprovenConfig(check, new Set())).not.toHaveProperty("description");
    expect(withoutUnprovenConfig(check, new Set(["c"]))).toEqual(check);
  });
});
