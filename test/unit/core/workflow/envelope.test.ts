import { describe, expect, it } from "vitest";
import { saveWorkflow } from "src/core/workflow/save.js";
import { initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow envelope", () => {
  it("rejects a new Full task unless its required artifacts are persisted with it", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const full = { ...taskV3("planning", "planning"), mode: "full" as const };

    await expect(saveWorkflow(root, { task: full })).rejects.toThrow("prd.md and plan.md");
    await expect(
      saveWorkflow(root, { task: full, artifacts: { prd: "# PRD\n", plan: "# Plan\n" } }),
    ).resolves.toMatchObject({ id: full.id });
  });

  it("rejects unknown hidden-save envelope, artifact, and revision fields", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");

    await expect(saveWorkflow(root, { task: planning, ignored: true })).rejects.toThrow(/unknown schema field/iu);
    await expect(saveWorkflow(root, { task: planning, artifacts: { ignored: "value" } })).rejects.toThrow(
      /unknown schema field/iu,
    );
    await expect(
      saveWorkflow(root, { task: planning, contractRevision: { reason: "Lý do đủ dài.", ignored: true } }),
    ).rejects.toThrow(/unknown schema field/iu);
    await expect(saveWorkflow(root, { task: planning, artifacts: { contextSelection: {} } })).rejects.toThrow(
      /unknown schema field/iu,
    );
  });
});
