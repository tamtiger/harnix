import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveTaskDirectory } from "src/core/tasks/task-location.js";
import { initTaskWorkflow } from "src/core/workflow/init-task.js";
import { initializeUtcProject } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("initTaskWorkflow artifacts", () => {
  it("uses the given prd and plan text for a Full task instead of the templates", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const task = await initTaskWorkflow(root, {
      title: "Custom",
      slug: "custom",
      mode: "full",
      command: "pnpm test",
      prd: "# PRD riêng\n",
      plan: "- [ ] [chk-1] Slice riêng\n",
    });

    const directory = await resolveTaskDirectory(join(root, ".harnix"), task.id);
    expect(await readFile(join(directory, "prd.md"), "utf8")).toBe("# PRD riêng\n");
    expect(await readFile(join(directory, "plan.md"), "utf8")).toBe("- [ ] [chk-1] Slice riêng\n");
  });

  it("keeps the template for the artifact that is not given", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const task = await initTaskWorkflow(root, {
      title: "Half",
      slug: "half",
      mode: "full",
      command: "pnpm test",
      prd: "# Chỉ PRD\n",
    });

    const directory = await resolveTaskDirectory(join(root, ".harnix"), task.id);
    expect(await readFile(join(directory, "prd.md"), "utf8")).toBe("# Chỉ PRD\n");
    expect(await readFile(join(directory, "plan.md"), "utf8")).toContain("Execution Slices");
  });

  it("rejects prd or plan text for a Lite task", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await expect(
      initTaskWorkflow(root, { title: "Lite", slug: "lite", command: "pnpm test", plan: "- [ ] x\n" }),
    ).rejects.toThrow(/--mode full/u);
  });
});
