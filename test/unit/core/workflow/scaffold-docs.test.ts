import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveActiveTask, saveTask } from "src/core/tasks/task-store.js";
import { initTaskWorkflow } from "src/core/workflow/init-task.js";
import { addCriterionWorkflow } from "src/core/workflow/plan-edit.js";
import { missingCriteriaInPlan, scanPlaceholders } from "src/core/workflow/ready-content.js";
import { scaffoldDocsWorkflow } from "src/core/workflow/scaffold-docs.js";
import { initializeUtcProject } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { taskMonth } from "test/support/task-paths.js";

const temporaryRepository = useTemporaryRepositories();

async function project(mode: "lite" | "full"): Promise<{ root: string; id: string }> {
  const root = await temporaryRepository();
  await initializeUtcProject(root);
  await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));
  await mkdir(join(root, "test"), { recursive: true });
  await writeFile(join(root, "test", "sample.test.ts"), "");
  const task = await initTaskWorkflow(root, {
    title: "Khung tài liệu",
    slug: "scaffold-case",
    mode,
    goal: "Sinh khung prd và plan",
    criteria: ["Khung phản ánh tiêu chí"],
  });
  return { root, id: task.id };
}

const docPath = (root: string, id: string, name: "prd.md" | "plan.md"): string =>
  join(root, ".harnix", "tasks", taskMonth(id), id, name);
const read = (root: string, id: string, name: "prd.md" | "plan.md"): Promise<string> =>
  readFile(docPath(root, id, name), "utf8");

describe("scaffoldDocsWorkflow", () => {
  it("leaves the unedited scaffold of a Full task as it is and reports nothing written", async () => {
    const { root, id } = await project("full");
    const before = [await read(root, id, "prd.md"), await read(root, id, "plan.md")];

    const result = await scaffoldDocsWorkflow(root, {});

    expect(result.written).toEqual([]);
    expect([await read(root, id, "prd.md"), await read(root, id, "plan.md")]).toEqual(before);
  });

  it("refuses to replace a scaffold that no longer matches the task and names --force", async () => {
    const { root, id } = await project("full");
    await addCriterionWorkflow(root, { id: "ac-2", text: "Tiêu chí thêm sau", checks: ["check-suite"] });
    const before = await read(root, id, "plan.md");

    await expect(scaffoldDocsWorkflow(root, {})).rejects.toThrow(/--force/u);

    expect(await read(root, id, "plan.md")).toBe(before);
  });

  it("regenerates both files with --force from the criteria and checks the task has now", async () => {
    const { root, id } = await project("full");
    const task = await addCriterionWorkflow(root, { id: "ac-2", text: "Tiêu chí thêm sau", checks: ["check-suite"] });

    const result = await scaffoldDocsWorkflow(root, { force: true });

    expect(result.written).toEqual(["prd.md", "plan.md"]);
    const prd = await read(root, id, "prd.md");
    const plan = await read(root, id, "plan.md");
    expect(prd).toContain("**ac-2**: Tiêu chí thêm sau");
    expect(plan).toContain("[check-suite]");
    expect(missingCriteriaInPlan(task, plan)).toEqual([]);
    expect(scanPlaceholders("prd.md", prd).issues).toEqual([]);
    expect(scanPlaceholders("plan.md", plan).issues).toEqual([]);
    for (const check of task.validationPlan) expect(plan).toContain(`[${check.id}]`);
  });

  it("keeps a user-edited document unless --force is given, and writes a given text verbatim with it", async () => {
    const { root, id } = await project("full");
    await writeFile(docPath(root, id, "prd.md"), "# PRD tự viết\n\nNội dung tiếng Việt có dấu.\n");

    await expect(scaffoldDocsWorkflow(root, { prd: "# Bản khác\n" })).rejects.toThrow(/--force/u);
    expect(await read(root, id, "prd.md")).toContain("PRD tự viết");

    const planBefore = await read(root, id, "plan.md");
    const result = await scaffoldDocsWorkflow(root, { prd: "# Bản khác\n\nĐã nạp từ tệp.\n", force: true });

    expect(result.written).toEqual(["prd.md"]);
    expect(await read(root, id, "prd.md")).toBe("# Bản khác\n\nĐã nạp từ tệp.\n");
    expect(await read(root, id, "plan.md")).toBe(planBefore);
  });

  it("replaces an unedited scaffold with a given text without --force", async () => {
    const { root, id } = await project("full");

    const result = await scaffoldDocsWorkflow(root, { plan: "# Kế hoạch nạp\n\n- [ ] [check-suite] Chạy suite\n" });

    expect(result.written).toEqual(["plan.md"]);
    expect(await read(root, id, "plan.md")).toContain("Kế hoạch nạp");
  });

  it("rejects a given text read with the wrong encoding and leaves the document alone", async () => {
    const { root, id } = await project("full");
    const before = await read(root, id, "prd.md");

    await expect(scaffoldDocsWorkflow(root, { prd: "# Sai m�a\n", force: true })).rejects.toThrow();

    expect(await read(root, id, "prd.md")).toBe(before);
  });

  it("refuses a Lite task and says how to get a Full one", async () => {
    const { root } = await project("lite");

    await expect(scaffoldDocsWorkflow(root, {})).rejects.toThrow(/--init --mode full/u);
  });

  it("refuses a Full task that is no longer planning", async () => {
    const { root } = await project("full");
    const task = await resolveActiveTask(join(root, ".harnix"));
    if (task === undefined) throw new Error("the fixture has no active task");
    await saveTask(join(root, ".harnix"), { ...task, status: "in_progress", checkpoint: "implementing" });

    await expect(scaffoldDocsWorkflow(root, {})).rejects.toThrow(/planning/u);
  });

  it("changes no obligation of the task", async () => {
    const { root } = await project("full");
    const before = await addCriterionWorkflow(root, { id: "ac-2", text: "Tiêu chí thêm sau", checks: ["check-suite"] });

    const { task } = await scaffoldDocsWorkflow(root, { force: true });

    expect(task.acceptanceCriteria).toEqual(before.acceptanceCriteria);
    expect(task.validationPlan).toEqual(before.validationPlan);
  });
});
