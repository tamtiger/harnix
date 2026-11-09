import { describe, expect, it } from "vitest";

import { resolveActiveTask } from "src/core/tasks/task.js";
import { setCheckWorkflow } from "src/core/workflow/plan-edit.js";
import { removeCheckWorkflow } from "src/core/workflow/remove-check.js";
import { appendEvidenceFlagsWorkflow } from "src/core/workflow/evidence-flags.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { buildCheck, buildCriterion } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3, initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const REASON = "Bỏ check suite trùng với check tự sinh của --init.";
const NOW = "2026-08-13T00:30:00.000Z";

async function planningWithDuplicateSuite(root: string) {
  await initializeUtcProject(root);
  const base = taskV3("planning", "planning");
  await saveWorkflow(root, {
    task: {
      ...base,
      acceptanceCriteria: [buildCriterion({ id: "a", text: "done" })],
      validationPlan: [
        buildCheck({ id: "check", criterionIds: ["a"], inputs: ["src/**"] }),
        buildCheck({ id: "check-dup", scope: "full", criterionIds: ["a"], inputs: ["src/**"] }),
      ],
    },
  });
}

describe("removeCheckWorkflow", () => {
  it("drops a check without evidence while the task is planning, keeping the others", async () => {
    const root = await temporaryRepository();
    await planningWithDuplicateSuite(root);

    const saved = await removeCheckWorkflow(root, "check-dup", {}, NOW);

    expect(saved.validationPlan.map((check) => check.id)).toEqual(["check"]);
    expect(((await resolveActiveTask(`${root}/.harnix`)) as typeof saved).validationPlan).toHaveLength(1);
  });

  it("refuses an unknown check with the nearest id", async () => {
    const root = await temporaryRepository();
    await planningWithDuplicateSuite(root);

    await expect(removeCheckWorkflow(root, "check-dupe", {}, NOW)).rejects.toThrow(/check-dup/u);
  });

  it("refuses a check that already recorded evidence and points at --replace-check", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await appendEvidenceFlagsWorkflow(root, { check: "check", result: "fail", exitCode: "1", summary: "red" }, NOW);

    await expect(removeCheckWorkflow(root, "check", { reason: REASON }, NOW)).rejects.toThrow(
      /already recorded evidence[^]*--replace-check/u,
    );
  });

  it("refuses to leave a criterion without a required check", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    await expect(removeCheckWorkflow(root, "check", { reason: REASON }, NOW)).rejects.toThrow(
      /criterion a would have no required check/u,
    );
  });

  it("after planning needs --reason and then ends at replan like any obligation edit", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    await setCheckWorkflow(
      root,
      { id: "extra", description: "d", scope: "full", criteria: ["a"], inputs: ["src/**"] },
      { reason: REASON },
      NOW,
    );

    await expect(removeCheckWorkflow(root, "extra", {}, NOW)).rejects.toThrow(/--reason/u);
    const saved = await removeCheckWorkflow(root, "extra", { reason: REASON }, "2026-08-13T00:40:00.000Z");

    expect(saved.validationPlan.some((check) => check.id === "extra")).toBe(false);
  });
});
