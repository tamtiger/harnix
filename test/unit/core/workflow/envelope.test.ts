import { describe, expect, it } from "vitest";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { saveWorkflow } from "src/core/workflow/save.js";
import { initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow envelope", () => {
  it("creates a Full planning task without artifacts and lets the ready gate enforce prd/plan", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const full = { ...taskV3("planning", "planning"), mode: "full" as const };

    // A Full task may be created light (task.json only); prd.md/plan.md are written later and enforced at ready.
    await expect(saveWorkflow(root, { task: full })).resolves.toMatchObject({ id: full.id });
    await expect(access(join(root, ".harnix", "tasks", full.id, "task.json"))).resolves.toBeUndefined();
    await expect(access(join(root, ".harnix", "tasks", full.id, "prd.md"))).rejects.toMatchObject({ code: "ENOENT" });
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
