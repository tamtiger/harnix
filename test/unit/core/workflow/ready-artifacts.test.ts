import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { inspectReadyConditions } from "src/core/workflow/ready.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { buildCheck } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, taskV3, writeProjectSource } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const prd = "# PRD\nDone.\n";
const goodPlan = "# Plan\n- [ ] S1 covers criterion a\n";

function fullTask(status: "planning" | "ready", checkpoint: "planning" | "ready" | "replan", focused = true) {
  const base = taskV3(status, checkpoint);
  const suite = { ...base.validationPlan[0]!, id: "suite", scope: "full" as const };
  const checks = focused
    ? [suite, buildCheck({ id: "focus", scope: "focused", criterionIds: ["a"], inputs: ["src/**/*.ts"] })]
    : [suite];
  return { ...base, mode: "full" as const, validationPlan: checks };
}

async function planned(focused = true) {
  const root = await temporaryRepository();
  await initializeUtcProject(root);
  await writeProjectSource(root);
  const planning = fullTask("planning", "planning", focused);
  await saveWorkflow(root, { task: planning, artifacts: { prd, plan: goodPlan } });
  return { root, planning };
}

const toReady = (planning: ReturnType<typeof fullTask>) => ({
  ...planning,
  status: "ready" as const,
  checkpoint: "ready" as const,
  updatedAt: "2026-08-13T00:01:00.000Z",
});

describe("ready content gate when entering ready", () => {
  it("accepts a plan that names every criterion and has a focused check", async () => {
    const { root, planning } = await planned();

    await expect(saveWorkflow(root, { task: toReady(planning) })).resolves.toMatchObject({ status: "ready" });
  });

  it("blocks a hard placeholder with the file and line", async () => {
    const { root, planning } = await planned();
    const plan = "# Plan\n- [ ] S1 criterion a\nTBD decide later\n";

    await expect(saveWorkflow(root, { task: toReady(planning), artifacts: { prd, plan } })).rejects.toThrow(
      "plan.md:3 placeholder 'TBD'",
    );
    await expect(
      saveWorkflow(root, { task: toReady(planning), artifacts: { prd: "TODO later", plan: goodPlan } }),
    ).rejects.toThrow("prd.md:1 placeholder 'TODO'");
  });

  it("blocks a criterion that the plan never names", async () => {
    const { root, planning } = await planned();

    await expect(
      saveWorkflow(root, { task: toReady(planning), artifacts: { prd, plan: "# Plan\n- [ ] S1 something\n" } }),
    ).rejects.toThrow("plan.md never mentions criterion 'a'");
  });

  it("blocks a criterion covered only by the full-scope suite check", async () => {
    const { root, planning } = await planned(false);

    await expect(saveWorkflow(root, { task: toReady(planning) })).rejects.toThrow(
      "criterion 'a' has no focused required check",
    );
  });

  it("is not enforced again for a task that is already at ready/ready", async () => {
    const { root, planning } = await planned();
    const ready = toReady(planning);
    await saveWorkflow(root, { task: ready });

    await expect(
      saveWorkflow(root, {
        task: { ...ready, updatedAt: "2026-08-13T00:02:00.000Z" },
        artifacts: { prd, plan: "# Plan\n- [ ] TBD\n" },
      }),
    ).resolves.toMatchObject({ status: "ready", checkpoint: "ready" });
  });

  it("applies again when re-entering ready from replan", async () => {
    const { root, planning } = await planned();
    const ready = toReady(planning);
    await saveWorkflow(root, { task: ready });
    const replan = { ...ready, checkpoint: "replan" as const, updatedAt: "2026-08-13T00:02:00.000Z" };
    await saveWorkflow(root, { task: replan });

    await expect(
      saveWorkflow(root, {
        task: { ...replan, checkpoint: "ready", updatedAt: "2026-08-13T00:03:00.000Z" },
        artifacts: { prd, plan: "# Plan\n- [ ] S1 a FIXME\n" },
      }),
    ).rejects.toThrow("plan.md:2 placeholder 'FIXME'");
  });
});

describe("ready content findings in a dry run", () => {
  it("reports a deferred decision as an advisory for a Full task", async () => {
    const { root, planning } = await planned();
    const plan = "# Plan\n- [ ] S1 criterion a, sẽ quyết định sau\n";

    const result = await inspectReadyConditions(join(root, ".harnix"), planning, { prd, plan });

    expect(result.issues).toEqual([]);
    expect(result.advisories).toContain("plan.md:2 deferred decision 'se quyet dinh sau'");
  });

  it("reports a Lite criterion without a focused check as an advisory only", async () => {
    const { root } = await planned();
    const lite = { ...taskV3("planning", "planning"), mode: "lite" as const };

    const result = await inspectReadyConditions(join(root, ".harnix"), lite);

    expect(result.issues).toEqual([]);
    expect(result.advisories).toContain("criterion 'a' has no focused required check");
  });

  it("skips the content rules when the task is not entering ready", async () => {
    const { root, planning } = await planned(false);

    const result = await inspectReadyConditions(join(root, ".harnix"), planning, undefined, false);

    expect(result.issues).toEqual([]);
  });
});
