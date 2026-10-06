import { describe, expect, it } from "vitest";

import { assertFlagGroups } from "src/commands/workflow-flags.js";
import { cancelTask, loadTask, resolveActiveTask, saveTask, type TaskRecordV3 } from "src/core/tasks/task.js";
import { batchWorkflow } from "src/core/workflow/batch.js";
import {
  addDecisionWorkflow,
  addRiskWorkflow,
  setCheckWorkflow,
  setPathsWorkflow,
} from "src/core/workflow/plan-edit.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { withTargetTask } from "src/core/workflow/target-task.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, taskV3, writeProjectSource } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const NOW = "2026-08-13T00:30:00.000Z";
const OTHER = "20260813-120500-other";

async function twoTasks(root: string, other: Partial<TaskRecordV3> = {}) {
  await initializeUtcProject(root);
  await writeProjectSource(root);
  const active = taskV3("planning", "planning");
  await saveWorkflow(root, { task: active });
  await saveTask(`${root}/.harnix`, { ...taskV3("planning", "planning"), id: OTHER, title: "other", ...other });
  return active;
}

const persisted = async (root: string, id: string) =>
  loadTask(`${root}/.harnix/tasks/${id}/task.json`) as Promise<TaskRecordV3>;

describe("--task targeting", () => {
  it("edits the targeted task with every edit command and leaves the active task and pointer alone", async () => {
    const root = await temporaryRepository();
    const active = await twoTasks(root);

    await withTargetTask(OTHER, async () => {
      await setCheckWorkflow(
        root,
        { id: "extra", description: "d", scope: "focused", criteria: ["a"], inputs: ["src/**"] },
        {},
        NOW,
      );
      await addDecisionWorkflow(root, { id: "d1", text: "t", rationale: "r" }, NOW);
      await addRiskWorkflow(root, { id: "r1", text: "t" }, NOW);
      await setPathsWorkflow(root, { paths: ["src/a.ts"] }, NOW);
      await batchWorkflow(root, { decisions: [{ id: "d2", text: "t", rationale: "r" }] }, NOW);
    });

    const target = await persisted(root, OTHER);
    expect(target.validationPlan.map((check) => check.id)).toContain("extra");
    expect([target.decisions?.length, target.residualRisks?.length, target.relevantPaths]).toEqual([
      2,
      1,
      ["src/a.ts"],
    ]);
    expect((await persisted(root, active.id)).validationPlan).toHaveLength(1);
    expect((await resolveActiveTask(`${root}/.harnix`))?.id).toBe(active.id);
  });

  it("applies the frozen-obligation reason rule to the targeted task", async () => {
    const root = await temporaryRepository();
    await twoTasks(root, { status: "ready", checkpoint: "ready" });

    await expect(
      withTargetTask(OTHER, () => setCheckWorkflow(root, { id: "check", command: "pnpm other" }, {}, NOW)),
    ).rejects.toThrow(/--reason/u);
    expect((await persisted(root, OTHER)).checkpoint).toBe("ready");
  });

  it("refuses a terminal, unknown or malformed target and does not touch the active task", async () => {
    const root = await temporaryRepository();
    const active = await twoTasks(root);
    const reason = "Dừng task này theo yêu cầu của người dùng";
    await saveTask(`${root}/.harnix`, cancelTask(await persisted(root, OTHER), { reason, authorizedBy: "user" }));
    const edit = (id: string) => withTargetTask(id, () => addRiskWorkflow(root, { id: "r", text: "t" }, NOW));

    await expect(edit(OTHER)).rejects.toThrow(/cancelled/u);
    await expect(edit("20260813-120600-missing")).rejects.toThrow(/not found|does not exist/iu);
    await expect(edit("../escape")).rejects.toThrow(/task id/iu);
    expect((await persisted(root, active.id)).residualRisks ?? []).toEqual([]);
  });
});

describe("--task flag ownership", () => {
  it("belongs to the edit actions and explains why state changes are refused", () => {
    const extras: Record<string, object> = {
      addCriterion: { text: "t" },
      addDecision: { text: "t", rationale: "r" },
      addRisk: { text: "t" },
      setPaths: { relevantPath: ["a"] },
    };
    for (const action of ["setCheck", "addCriterion", "setPaths", "addDecision", "addRisk", "batch"])
      expect(() => assertFlagGroups(action, { task: OTHER, ...extras[action] })).not.toThrow();
    for (const action of ["transition", "finish", "cancel", "runCheck", "evidence"])
      expect(() => assertFlagGroups(action, { task: OTHER })).toThrow(/--task .*active task/u);
  });
});
