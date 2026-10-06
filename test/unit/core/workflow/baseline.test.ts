import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { assertFlagGroups, selectAction } from "src/commands/workflow-flags.js";
import { resolveActiveTask, type TaskRecordV3 } from "src/core/tasks/task.js";
import { setBaselineWorkflow } from "src/core/workflow/baseline.js";
import { assertSuiteGateFinishing, authorizedRedBaseline } from "src/core/workflow/suite-gate.js";
import { buildCheck, buildEvidence, buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const NOW = "2026-08-13T00:30:00.000Z";
const AUTHORIZED = {
  checkId: "check",
  result: "fail",
  classification: "pre-existing",
  authorizedBy: "user",
  scope: "Suite đỏ từ trước, ngoài phạm vi task",
};

describe("workflow baseline transport", () => {
  it("records the baseline on a frozen check without a reason, a replan or a checkpoint change", async () => {
    const root = await temporaryRepository();
    const before = await implementingTaskV3(root);

    const saved = await setBaselineWorkflow(root, AUTHORIZED, NOW);

    expect(saved.checkpoint).toBe(before.checkpoint);
    expect(saved.validationPlan.find((check) => check.id === "check")?.baseline).toEqual({
      result: "fail",
      classification: "pre-existing",
      authorizedBy: "user",
      scope: AUTHORIZED.scope,
    });
    expect(saved.evidence.some((item) => item.id.startsWith("task-contract-revision"))).toBe(false);
    const persisted = (await resolveActiveTask(`${root}/.harnix`)) as TaskRecordV3 | undefined;
    expect(persisted?.validationPlan[0]?.baseline?.authorizedBy).toBe("user");
  });

  it("rejects an unknown check, a bad classification or result, a missing authorizer and an empty scope", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    await expect(setBaselineWorkflow(root, { ...AUTHORIZED, checkId: "nope" }, NOW)).rejects.toThrow(/not declared/u);
    await expect(setBaselineWorkflow(root, { ...AUTHORIZED, classification: "weird" }, NOW)).rejects.toThrow(
      /--classification/u,
    );
    await expect(setBaselineWorkflow(root, { ...AUTHORIZED, result: "skipped" }, NOW)).rejects.toThrow(/--result/u);
    await expect(setBaselineWorkflow(root, { ...AUTHORIZED, authorizedBy: " " }, NOW)).rejects.toThrow(
      /--authorized-by/u,
    );
    await expect(setBaselineWorkflow(root, { ...AUTHORIZED, scope: "" }, NOW)).rejects.toThrow(/--scope/u);
  });
});

describe("workflow baseline flags", () => {
  it("selects the action and requires the whole baseline", () => {
    expect(selectAction({ setBaseline: "check" })).toBe("setBaseline");
    expect(() => assertFlagGroups("setBaseline", { result: "fail" })).toThrow(/--classification/u);
    expect(() =>
      assertFlagGroups("setBaseline", {
        result: "fail",
        classification: "pre-existing",
        authorizedBy: "user",
        scope: "s",
      }),
    ).not.toThrow();
    expect(() => assertFlagGroups("inspect", { classification: "pre-existing" })).toThrow(
      /--classification requires workflow --set-baseline/u,
    );
  });
});

describe("authorized red baseline", () => {
  const baseline = {
    result: "fail" as const,
    classification: "pre-existing" as const,
    authorizedBy: "user",
    scope: "suite",
  };
  const suite = buildCheck({
    id: "check-suite",
    scope: "full",
    criterionIds: ["ac-one"],
    inputs: ["src/**", "test/**"],
    baseline,
  });
  const focused = buildCheck({ id: "check-focused", criterionIds: ["ac-one"], inputs: ["src/**"] });
  const red = buildEvidence({ id: "ev-red", checkId: "check-suite", result: "fail", exitCode: 1 });
  const green = buildEvidence({ id: "ev-green", checkId: "check-focused" });
  const withSuite = (changes: object) => ({ ...suite, ...changes });
  const taskOf = (overrides = {}) =>
    buildTaskV3({
      status: "verifying",
      checkpoint: "finishing",
      validationPlan: [suite, focused],
      evidence: [red, green],
      ...overrides,
    });

  it("accepts a red suite with an authorized baseline and a passing focused check covering its criteria", () => {
    expect(authorizedRedBaseline(taskOf(), suite)).toBe(true);
  });

  it.each([
    ["no authorizer", { validationPlan: [withSuite({ baseline: { ...baseline, authorizedBy: " " } }), focused] }],
    [
      "an introduced failure",
      { validationPlan: [withSuite({ baseline: { ...baseline, classification: "introduced" } }), focused] },
    ],
    [
      "a baseline that was green",
      { validationPlan: [withSuite({ baseline: { ...baseline, result: "pass" } }), focused] },
    ],
    ["no red run recorded", { evidence: [green] }],
    ["a passing suite run", { evidence: [{ ...red, result: "pass", exitCode: 0 }, green] }],
    ["no focused proof", { validationPlan: [suite] }],
    ["a failing focused proof", { evidence: [red, { ...green, result: "fail", exitCode: 1 }] }],
    [
      "a focused proof missing a criterion",
      { validationPlan: [withSuite({ criterionIds: ["ac-one", "ac-two"] }), focused] },
    ],
  ])("rejects %s", (_name, overrides) => {
    const task = taskOf(overrides);
    expect(authorizedRedBaseline(task, task.validationPlan[0]!)).toBe(false);
  });

  it("lets the finish gate pass on the proof but still blocks without authorization", async () => {
    const root = await temporaryRepository();
    await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { test: "pnpm test" } }));
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "index.ts"), "export const a = 1;");
    await mkdir(join(root, "test"), { recursive: true });
    await writeFile(join(root, "test", "index.test.ts"), "");

    await expect(assertSuiteGateFinishing(root, taskOf())).resolves.toBeUndefined();
    const unauthorized = taskOf({ validationPlan: [withSuite({ baseline: undefined }), focused] });
    await expect(assertSuiteGateFinishing(root, unauthorized)).rejects.toThrow(/passing source-and-test check/u);
  });
});
