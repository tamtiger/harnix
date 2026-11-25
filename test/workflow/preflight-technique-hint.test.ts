import { describe, expect, it } from "vitest";
import { preflightWorkflow } from "src/core/workflow/preflight.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { TECHNIQUE_HINT } from "src/core/workflow/technique-hint.js";
import { initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("preflight technique hint", () => {
  it("suggests sequential thinking only for a task that asks for it, not for every Full task", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await saveWorkflow(root, { task: { ...taskV3("planning", "planning"), mode: "full" as const } });
    expect((await preflightWorkflow(root, Date.now())).suggestedTechniques ?? []).not.toContain(
      "harnix-sequential-thinking",
    );

    await saveWorkflow(root, {
      task: { ...taskV3("planning", "planning"), mode: "full" as const, title: "Refactor the task store" },
    });
    expect((await preflightWorkflow(root, Date.now())).suggestedTechniques).toContain("harnix-sequential-thinking");
  });

  it("adds one fixed techniqueHint exactly when there is a suggestion", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await saveWorkflow(root, { task: taskV3("planning", "planning") });
    const suggested = await preflightWorkflow(root, Date.now());
    expect(suggested.suggestedTechniques).toBeDefined();
    expect(suggested.techniqueHint).toBe(TECHNIQUE_HINT);

    await saveWorkflow(root, { task: { ...taskV3("ready", "ready"), updatedAt: "2026-08-13T00:01:00.000Z" } });
    await saveWorkflow(root, {
      task: { ...taskV3("in_progress", "implementing"), updatedAt: "2026-08-13T00:02:00.000Z" },
    });
    const quiet = await preflightWorkflow(root, Date.now());
    expect(quiet.suggestedTechniques).toBeUndefined();
    expect(quiet.techniqueHint).toBeUndefined();
  });
});
