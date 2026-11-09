import { describe, expect, it } from "vitest";

import { listProjectChecks } from "src/commands/status.js";
import { baselineAssessment } from "src/core/workflow/baseline-status.js";
import { setBaselineWorkflow } from "src/core/workflow/baseline.js";
import { buildCheck, buildEvidence, buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const baseline = {
  result: "fail" as const,
  classification: "pre-existing" as const,
  authorizedBy: "user",
  scope: "Suite đỏ từ trước",
};
const suite = buildCheck({ id: "suite", scope: "full", inputs: ["src/**", "test/**"], baseline });
const focused = buildCheck({ id: "focused" });
const red = buildEvidence({ id: "ev-red", checkId: "suite", result: "fail", exitCode: 1 });
const green = buildEvidence({ id: "ev-green", checkId: "focused" });
const taskOf = (overrides = {}) =>
  buildTaskV3({ validationPlan: [suite, focused], evidence: [red, green], ...overrides });

describe("baselineAssessment", () => {
  it("has nothing to say about a check without a baseline", () => {
    expect(baselineAssessment(taskOf(), focused)).toBeUndefined();
  });

  it("accepts a red check proved by a passing focused check", () => {
    expect(baselineAssessment(taskOf(), suite)).toEqual({ accepted: true });
  });

  it.each([
    ["no red run", { evidence: [green] }, /no run recorded/u],
    [
      "a passing run",
      { evidence: [{ ...red, result: "pass" as const, exitCode: 0 }, green] },
      /latest run is not red/u,
    ],
    ["no proof", { validationPlan: [suite] }, /another required check/u],
    [
      "an introduced failure",
      { validationPlan: [{ ...suite, baseline: { ...baseline, classification: "introduced" as const } }, focused] },
      /classification introduced/u,
    ],
    [
      "a green baseline",
      { validationPlan: [{ ...suite, baseline: { ...baseline, result: "pass" as const } }, focused] },
      /baseline result is pass/u,
    ],
  ])("names why %s is not accepted", (_name, overrides, reason) => {
    const task = taskOf(overrides);
    const result = baselineAssessment(task, task.validationPlan[0]!);
    expect(result?.accepted).toBe(false);
    expect(result?.reason).toMatch(reason);
  });
});

describe("status --checks baseline", () => {
  it("shows the baseline and why it is not accepted yet", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await setBaselineWorkflow(
      root,
      { checkId: "check", result: "fail", classification: "pre-existing", authorizedBy: "user", scope: "đỏ từ trước" },
      "2026-08-13T00:30:00.000Z",
    );

    const listed = await listProjectChecks(root);

    expect(listed.checks[0]?.baseline).toMatchObject({ accepted: false });
    expect(listed.checks[0]?.baseline?.reason).toContain("no run recorded");
  });
});
