import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { resolveTaskDirectory } from "src/core/tasks/task-location.js";
import { initTaskWorkflow } from "src/core/workflow/init-task.js";
import { addCriterionWorkflow } from "src/core/workflow/plan-edit.js";
import { notePlanMissingCriteria } from "src/core/workflow/plan-criterion-notice.js";
import { setCriterionWorkflow } from "src/core/workflow/set-criterion.js";
import { initializeUtcProject } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

async function stderrOf(run: () => Promise<unknown>): Promise<string> {
  const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  try {
    await run();
    return write.mock.calls.map((call) => String(call[0])).join("");
  } finally {
    write.mockRestore();
  }
}

async function fullTask(root: string, mode: "full" | "lite") {
  await initializeUtcProject(root);
  return initTaskWorkflow(root, {
    title: "Plan notice",
    slug: "plan-notice",
    mode,
    command: "pnpm test",
    input: ["src/**"],
  });
}

describe("plan.md criterion notice", () => {
  it("names a new criterion that plan.md does not mention and never edits plan.md", async () => {
    const root = await temporaryRepository();
    const task = await fullTask(root, "full");
    const planPath = join(await resolveTaskDirectory(join(root, ".harnix"), task.id), "plan.md");
    const before = await readFile(planPath, "utf8");

    const output = await stderrOf(() =>
      addCriterionWorkflow(root, { id: "ac-9", text: "Tiêu chí mới", checks: ["check-1"] }, {}),
    );

    expect(output).toContain("notice: plan.md does not mention criterion 'ac-9'");
    expect(output).toContain("add the id to a plan.md checklist item");
    expect(await readFile(planPath, "utf8")).toBe(before);
  });

  it("stays silent once plan.md mentions the id, for add and for set", async () => {
    const root = await temporaryRepository();
    const task = await fullTask(root, "full");
    const planPath = join(await resolveTaskDirectory(join(root, ".harnix"), task.id), "plan.md");
    await writeFile(planPath, `${await readFile(planPath, "utf8")}\n- [ ] [check-1] chứng minh ac-9\n`);

    const added = await stderrOf(() =>
      addCriterionWorkflow(root, { id: "ac-9", text: "Tiêu chí mới", checks: ["check-1"] }, {}),
    );
    const set = await stderrOf(() => setCriterionWorkflow(root, { id: "ac-9", text: "Tiêu chí đã sửa" }, {}));

    expect(added).not.toContain("plan.md does not mention");
    expect(set).not.toContain("plan.md does not mention");
  });

  it("reports a rewritten criterion too and ignores a Lite task", async () => {
    const root = await temporaryRepository();
    const task = await fullTask(root, "full");
    const first = task.acceptanceCriteria[0]!.id;
    const planPath = join(await resolveTaskDirectory(join(root, ".harnix"), task.id), "plan.md");
    await writeFile(planPath, "# Plan\n\n- [ ] [check-1] việc khác\n");
    expect(await stderrOf(() => setCriterionWorkflow(root, { id: first, text: "Viết lại tiêu chí" }, {}))).toContain(
      `criterion '${first}'`,
    );

    const lite = await temporaryRepository();
    const liteTask = await fullTask(lite, "lite");
    expect(await stderrOf(() => notePlanMissingCriteria(lite, liteTask as never, ["ac-1"]))).toBe("");
  });
});
