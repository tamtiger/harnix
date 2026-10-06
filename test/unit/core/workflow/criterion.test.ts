import { describe, expect, it } from "vitest";

import { appendEvidenceFlagsWorkflow } from "src/core/workflow/evidence-flags.js";
import { markCriteriaMetWorkflow } from "src/core/workflow/criterion.js";
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
