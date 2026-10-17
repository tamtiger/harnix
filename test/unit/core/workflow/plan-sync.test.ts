import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { syncPlanChecklistPass } from "src/core/workflow/plan-sync.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("syncPlanChecklistPass", () => {
  it("converts unchecked items with [check-id] tag to [x]", async () => {
    const root = await temporaryRepository();
    const taskDir = join(root, ".harnix", "tasks", "task-1");
    await mkdir(taskDir, { recursive: true });

    const initialPlan = [
      "# Plan",
      "- [ ] [check-1] First item",
      "- [ ] [check-2] Second item",
      "- [x] [check-1] Already checked item",
    ].join("\n");

    await writeFile(join(taskDir, "plan.md"), initialPlan, "utf8");

    const updated = await syncPlanChecklistPass(join(root, ".harnix"), "task-1", "check-1");

    expect(updated).toBe(true);
    const content = await readFile(join(taskDir, "plan.md"), "utf8");
    expect(content).toContain("- [x] [check-1] First item");
    expect(content).toContain("- [ ] [check-2] Second item");
    expect(content).toContain("- [x] [check-1] Already checked item");
  });

  it("converts unchecked items with `check-id` code or starting check-id to [x]", async () => {
    const root = await temporaryRepository();
    const taskDir = join(root, ".harnix", "tasks", "task-2");
    await mkdir(taskDir, { recursive: true });

    const initialPlan = [
      "# Plan",
      "- [ ] `check-a` In backticks",
      "- [ ] check-b Starting name",
      "- [ ] [check-c] In tag",
    ].join("\n");

    await writeFile(join(taskDir, "plan.md"), initialPlan, "utf8");

    await syncPlanChecklistPass(join(root, ".harnix"), "task-2", "check-a");
    await syncPlanChecklistPass(join(root, ".harnix"), "task-2", "check-b");

    const content = await readFile(join(taskDir, "plan.md"), "utf8");
    expect(content).toContain("- [x] `check-a` In backticks");
    expect(content).toContain("- [x] check-b Starting name");
    expect(content).toContain("- [ ] [check-c] In tag");
  });

  it("returns false and does not throw when plan.md does not exist", async () => {
    const root = await temporaryRepository();
    const result = await syncPlanChecklistPass(join(root, ".harnix"), "non-existent-task", "check-1");
    expect(result).toBe(false);
  });

  it("returns false when no matching unchecked item is found", async () => {
    const root = await temporaryRepository();
    const taskDir = join(root, ".harnix", "tasks", "task-3");
    await mkdir(taskDir, { recursive: true });

    await writeFile(join(taskDir, "plan.md"), "- [ ] [check-other] Do other\n", "utf8");

    const updated = await syncPlanChecklistPass(join(root, ".harnix"), "task-3", "check-unknown");
    expect(updated).toBe(false);
  });
});
