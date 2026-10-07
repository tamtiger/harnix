import { describe, expect, it } from "vitest";

import { resolveActiveTask } from "src/core/tasks/task.js";
import type { CheckRunner } from "src/core/workflow/run-check.js";
import { runCheckWorkflow } from "src/core/workflow/run-check.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { setCriterionWorkflow } from "src/core/workflow/set-criterion.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { implementingTaskV3, initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const REASON = "Sửa lại chữ của tiêu chí cho đúng phạm vi";

describe("setCriterionWorkflow", () => {
  it("rewrites the text of a criterion while the task is still planning, keeping everything else", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });

    const task = await setCriterionWorkflow(root, { id: "a", text: "  Nội dung mới  " });

    expect(task).toMatchObject({ status: "planning", checkpoint: "planning" });
    expect(task.acceptanceCriteria).toEqual([{ ...planning.acceptanceCriteria[0], text: "Nội dung mới" }]);
    expect(task.validationPlan).toEqual(planning.validationPlan);
  });

  it("needs a reason once obligations are frozen and then makes the guarded replan save", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    await expect(setCriterionWorkflow(root, { id: "a", text: "Đổi chữ" })).rejects.toThrow(/--reason/u);
    const revised = await setCriterionWorkflow(root, { id: "a", text: "Đổi chữ" }, { reason: REASON });

    expect(revised).toMatchObject({ checkpoint: "replan" });
    expect(revised.acceptanceCriteria[0]?.text).toBe("Đổi chữ");
  });

  it("rejects an unknown criterion and an empty text", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await saveWorkflow(root, { task: taskV3("planning", "planning") });

    await expect(setCriterionWorkflow(root, { id: "zz", text: "x" })).rejects.toThrow(/zz/u);
    await expect(setCriterionWorkflow(root, { id: "a", text: "   " })).rejects.toThrow(/--text/u);
  });

  it("keeps a criterion immutable once recorded check evidence maps it", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const runner: CheckRunner = async () => ({ exitCode: 0, output: "" });
    await runCheckWorkflow(root, "check", ["pnpm", "test"], { runner, now: "2026-08-13T00:10:00.000Z" });

    await expect(
      setCriterionWorkflow(root, { id: "a", text: "Đổi sau bằng chứng" }, { reason: REASON }),
    ).rejects.toThrow(/criterion|evidence|immutable/iu);
    expect((await resolveActiveTask(`${root}/.harnix`))?.acceptanceCriteria[0]?.text).toBe("done");
  });
});
