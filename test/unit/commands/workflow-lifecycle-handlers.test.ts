import { describe, expect, it } from "vitest";

import { LIFECYCLE_HANDLERS } from "src/commands/workflow-lifecycle-handlers.js";
import type { WorkflowContext } from "src/commands/workflow-handlers.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, writeProjectSource } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();

const context = (root: string, flags: WorkflowContext["flags"]): WorkflowContext => ({
  root,
  flags,
  operands: [],
  options: {},
});

describe("workflow lifecycle handlers", () => {
  it("exposes init, setBaseline and epicOrder", () => {
    expect(Object.keys(LIFECYCLE_HANDLERS).sort()).toEqual(["epicOrder", "init", "setBaseline"]);
  });

  it("init creates a task from flags and --brief reports only its state", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeProjectSource(root);

    const result = await LIFECYCLE_HANDLERS.init!(
      context(root, { title: "Plain title", command: "pnpm test", brief: true }),
    );

    expect(result).toMatchObject({ status: "planning", checkpoint: "planning" });
  });

  it("epicOrder splits the epic id from the task ids and reports an unknown epic", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    await expect(
      LIFECYCLE_HANDLERS.epicOrder!(context(root, { epicOrder: ["missing-epic", "20260928-100000-a"] })),
    ).rejects.toThrow(/No epic found/u);
  });
});
