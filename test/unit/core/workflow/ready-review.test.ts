import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { READY_REVIEW_CHECKLIST, reviewRequiredMessage } from "src/core/workflow/ready-review.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { transitionWorkflow } from "src/core/workflow/transition.js";
import { buildCheck } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, taskV3, writeProjectSource } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();

async function planned(mode: "lite" | "full") {
  const root = await temporaryRepository();
  await initializeUtcProject(root);
  await writeProjectSource(root);
  const base = taskV3("planning", "planning");
  const suite = { ...base.validationPlan[0]!, id: "suite", scope: "full" as const };
  const focus = buildCheck({ id: "focus", scope: "focused", criterionIds: ["a"], inputs: ["src/**/*.ts"] });
  const task = { ...base, mode, validationPlan: [suite, focus] };
  const artifacts = mode === "full" ? { prd: "# PRD\n", plan: "- [ ] S1 covers criterion a\n" } : undefined;
  await saveWorkflow(root, { task, ...(artifacts === undefined ? {} : { artifacts }) });
  return root;
}

describe("ready review checklist", () => {
  it("lists the twelve ready-review items", () => {
    expect(READY_REVIEW_CHECKLIST).toHaveLength(12);
    expect(READY_REVIEW_CHECKLIST.every((item) => item.length > 0 && item.length < 200)).toBe(true);
  });

  it("builds a message that names --reviewed, the checklist, the issues and the advisories", () => {
    const message = reviewRequiredMessage(
      ["plan.md:2 placeholder 'TBD'"],
      ["plan.md:3 deferred decision 'decide later'"],
    );

    expect(message).toContain("--reviewed");
    for (const item of READY_REVIEW_CHECKLIST) expect(message).toContain(item);
    expect(message).toContain("plan.md:2 placeholder 'TBD'");
    expect(message).toContain("plan.md:3 deferred decision 'decide later'");
  });
});

describe("--reviewed on the ready transition", () => {
  it("refuses a Full task without --reviewed and prints the checklist", async () => {
    const root = await planned("full");

    const attempt = transitionWorkflow(root, "ready", "ready");

    await expect(attempt).rejects.toThrow("--reviewed");
    await expect(attempt).rejects.toThrow(READY_REVIEW_CHECKLIST[0]);
  });

  it("accepts a Full task with --reviewed", async () => {
    const root = await planned("full");

    await expect(
      transitionWorkflow(root, "ready", "ready", undefined, false, { reviewed: true }),
    ).resolves.toMatchObject({ status: "ready", checkpoint: "ready" });
  });

  it("still reports the content issues when --reviewed is given", async () => {
    const root = await planned("full");
    const planPath = join(root, ".harnix", "tasks", taskV3("planning", "planning").id, "plan.md");
    await writeFile(planPath, "- [ ] S1 covers criterion a, TBD\n");

    await expect(transitionWorkflow(root, "ready", "ready", undefined, false, { reviewed: true })).rejects.toThrow(
      "plan.md:1 placeholder 'TBD'",
    );
  });

  it("does not require --reviewed for a Lite task or for other transitions", async () => {
    const root = await planned("lite");

    await expect(transitionWorkflow(root, "ready", "ready")).resolves.toMatchObject({ status: "ready" });
    await expect(transitionWorkflow(root, "in_progress", "implementing")).resolves.toMatchObject({
      status: "in_progress",
    });
  });

  it("returns the checklist in a dry run without needing --reviewed", async () => {
    const root = await planned("full");

    const result = await transitionWorkflow(root, "ready", "ready", undefined, true);

    expect(result).toMatchObject({ dryRun: true, valid: true });
    expect(result.reviewChecklist).toEqual([...READY_REVIEW_CHECKLIST]);
  });

  it("omits the checklist from a dry run for a Lite task or another target", async () => {
    const lite = await planned("lite");
    const full = await planned("full");

    expect((await transitionWorkflow(lite, "ready", "ready", undefined, true)).reviewChecklist).toBeUndefined();
    expect(
      (await transitionWorkflow(full, "in_progress", "implementing", undefined, true)).reviewChecklist,
    ).toBeUndefined();
  });
});
