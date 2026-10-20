import { writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { appendEvidenceFlagsWorkflow } from "src/core/workflow/evidence-flags.js";
import { markCriteriaMetWorkflow } from "src/core/workflow/criterion.js";
import { setBaselineWorkflow } from "src/core/workflow/baseline.js";
import { setCheckWorkflow } from "src/core/workflow/plan-edit.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { buildCheck, buildCriterion } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3, taskV3, initializeUtcProject } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const NOW = "2026-08-13T00:20:00.000Z";

async function passingRun(root: string, when = "2026-08-13T00:10:00.000Z") {
  await implementingTaskV3(root);
  return appendEvidenceFlagsWorkflow(root, { check: "check", result: "pass", exitCode: "0", summary: "ok" }, when);
}

describe("workflow criterion transport", () => {
  it("marks a criterion met with the fresh pass of its required check", async () => {
    const root = await temporaryRepository();
    await passingRun(root);

    const saved = await markCriteriaMetWorkflow(root, { criterionIds: ["a"] }, NOW);

    expect(saved.acceptanceCriteria[0]).toMatchObject({ id: "a", status: "met", evidenceIds: ["ev-check-1"] });
    expect(saved.updatedAt).toBe(NOW);
  });

  it("treats a pass recorded under the former digest formula as fresh while the contract is unchanged", async () => {
    const root = await temporaryRepository();
    const task = await implementingTaskV3(root);
    const legacy = (await computeInputDigest(root, task, "check")).legacyInputDigest;
    await appendEvidenceFlagsWorkflow(
      root,
      { check: "check", result: "pass", exitCode: "0", summary: "ok", digest: legacy },
      "2026-08-13T00:10:00.000Z",
    );

    const saved = await markCriteriaMetWorkflow(root, { criterionIds: ["a"] }, NOW);

    expect(saved.acceptanceCriteria[0]).toMatchObject({ id: "a", status: "met", evidenceIds: ["ev-check-1"] });
  });

  it("accepts explicit evidence ids that belong to a covering check", async () => {
    const root = await temporaryRepository();
    await passingRun(root);

    const saved = await markCriteriaMetWorkflow(root, { criterionIds: ["a"], evidenceIds: ["ev-check-1"] }, NOW);

    expect(saved.acceptanceCriteria[0]?.evidenceIds).toEqual(["ev-check-1"]);
  });

  it("rejects when the covering check has no fresh pass", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await expect(markCriteriaMetWorkflow(root, { criterionIds: ["a"] }, NOW)).rejects.toThrow(/fresh passing/u);

    await appendEvidenceFlagsWorkflow(root, { check: "check", result: "pass", exitCode: "0", summary: "ok" }, NOW);
    const { writeFile } = await import("node:fs/promises");
    await writeFile(`${root}/src/a.ts`, "export const a = 2;\n");
    await expect(markCriteriaMetWorkflow(root, { criterionIds: ["a"] }, NOW)).rejects.toThrow(/fresh passing/u);
  });

  it("rejects an unknown criterion, foreign evidence and a non-pass evidence id", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await appendEvidenceFlagsWorkflow(root, { check: "check", result: "fail", exitCode: "1", summary: "RED" }, NOW);

    await expect(markCriteriaMetWorkflow(root, { criterionIds: ["zzz"] }, NOW)).rejects.toThrow(/zzz/u);
    await expect(markCriteriaMetWorkflow(root, { criterionIds: ["a"], evidenceIds: ["missing"] }, NOW)).rejects.toThrow(
      /missing/u,
    );
    await expect(
      markCriteriaMetWorkflow(root, { criterionIds: ["a"], evidenceIds: ["ev-check-1"] }, NOW),
    ).rejects.toThrow(/passing/u);
  });

  it("requires every required check covering the criterion to be fresh and handles several criteria at once", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const { writeProjectSource } = await import("test/support/workflow-fixtures.js");
    await writeProjectSource(root);
    const base = taskV3("planning", "planning");
    const planning = {
      ...base,
      acceptanceCriteria: [buildCriterion({ id: "a", text: "done" }), buildCriterion({ id: "b", text: "also" })],
      validationPlan: [
        buildCheck({ id: "check", criterionIds: ["a", "b"], inputs: ["src/**/*.ts"] }),
        buildCheck({ id: "second", criterionIds: ["b"], inputs: ["src/**/*.ts"] }),
      ],
    };
    await saveWorkflow(root, { task: planning });
    const ready = {
      ...planning,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: ready });
    await saveWorkflow(root, {
      task: { ...ready, status: "in_progress", checkpoint: "implementing", updatedAt: "2026-08-13T00:02:00.000Z" },
    });
    await appendEvidenceFlagsWorkflow(root, { check: "check", result: "pass", exitCode: "0", summary: "ok" }, NOW);

    await expect(markCriteriaMetWorkflow(root, { criterionIds: ["a", "b"] }, NOW)).rejects.toThrow(/second/u);

    await appendEvidenceFlagsWorkflow(root, { check: "second", result: "pass", exitCode: "0", summary: "ok" }, NOW);
    const saved = await markCriteriaMetWorkflow(root, { criterionIds: ["a", "b"] }, NOW);
    expect(saved.acceptanceCriteria.map((criterion) => criterion.status)).toEqual(["met", "met"]);
    expect(saved.acceptanceCriteria[1]?.evidenceIds).toEqual(["ev-check-1", "ev-second-1"]);
  });
});

describe("workflow criterion transport with an authorized red baseline", () => {
  it("marks a criterion met from the focused pass and skips the red baselined check", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await setCheckWorkflow(
      root,
      { id: "focused", description: "d", scope: "focused", criteria: ["a"], inputs: ["src/**/*.ts"] },
      { reason: "Thêm check tập trung làm bằng chứng" },
      "2026-08-13T00:05:00.000Z",
    );
    const run = (check: string, result: string, exitCode: string, at: string) =>
      appendEvidenceFlagsWorkflow(root, { check, result, exitCode, summary: "run" }, at);
    await run("check", "fail", "1", "2026-08-13T00:10:00.000Z");
    await run("focused", "pass", "0", "2026-08-13T00:11:00.000Z");
    await expect(markCriteriaMetWorkflow(root, { criterionIds: ["a"] }, NOW)).rejects.toThrow(/fresh passing/u);

    await setBaselineWorkflow(
      root,
      { checkId: "check", result: "fail", classification: "pre-existing", authorizedBy: "user", scope: "suite" },
      "2026-08-13T00:12:00.000Z",
    );
    const saved = await markCriteriaMetWorkflow(root, { criterionIds: ["a"] }, NOW);

    expect(saved.acceptanceCriteria[0]).toMatchObject({ status: "met", evidenceIds: ["ev-focused-1"] });
  });
});

describe("workflow criterion refusal reasons", () => {
  it("says that a required check has not run yet", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    await expect(markCriteriaMetWorkflow(root, { criterionIds: ["a"] }, NOW)).rejects.toThrow(
      /required check\(s\): check \(not run yet\)\./u,
    );
  });

  it("says that the latest run of a required check failed", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await appendEvidenceFlagsWorkflow(root, { check: "check", result: "fail", exitCode: "1", summary: "RED" }, NOW);

    await expect(markCriteriaMetWorkflow(root, { criterionIds: ["a"] }, NOW)).rejects.toThrow(
      /check \(latest run failed\)/u,
    );
  });

  it("says that the inputs changed after the last pass", async () => {
    const root = await temporaryRepository();
    await passingRun(root);
    await writeFile(`${root}/src/a.ts`, "export const a = 3;\n");

    await expect(markCriteriaMetWorkflow(root, { criterionIds: ["a"] }, NOW)).rejects.toThrow(
      /check \(inputs changed since its last pass\)/u,
    );
  });

  it("explains that a declared baseline has no effect without another passing check covering the criterion", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await appendEvidenceFlagsWorkflow(root, { check: "check", result: "fail", exitCode: "1", summary: "RED" }, NOW);
    await setBaselineWorkflow(
      root,
      { checkId: "check", result: "fail", classification: "pre-existing", authorizedBy: "user", scope: "suite" },
      "2026-08-13T00:12:00.000Z",
    );

    const error = await markCriteriaMetWorkflow(root, { criterionIds: ["a"] }, NOW).then(
      () => undefined,
      (caught: unknown) => caught as Error,
    );

    expect(error?.message).toMatch(/has no fresh passing evidence from required check\(s\): check \(/u);
    expect(error?.message).toMatch(/baseline is declared but has no effect/u);
    expect(error?.message).toMatch(/another passing required check without a baseline that covers/u);
    expect(error?.message).toMatch(/--set-check/u);
  });
});
