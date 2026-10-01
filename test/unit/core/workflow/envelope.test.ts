import { describe, expect, it } from "vitest";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { saveWorkflow } from "src/core/workflow/save.js";
import { buildEpic } from "test/support/builders.js";
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

  it("names the unknown field and the expected envelope shape instead of only saying the field is unknown", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");

    await expect(saveWorkflow(root, { task: planning, ignored: true })).rejects.toThrow(
      /unknown schema field\. Unknown: "ignored"\. Expected \{ task, artifacts\?, contractRevision\?, epic\?, epicMembers\? \}/u,
    );
  });

  it("tells an agent that sent a bare task record to put it under task", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");

    await expect(saveWorkflow(root, planning)).rejects.toThrow(
      /requires task: expected \{ task, artifacts\?, contractRevision\?, epic\?, epicMembers\? \}.*found top-level "generator"/su,
    );
  });

  it("rejects epic members whose IDs do not increase in execution order and says how to fix it", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const epic = buildEpic({
      id: "ordered-epic",
      createdAt: "2026-08-13T00:00:00.000Z",
      updatedAt: "2026-08-13T00:00:00.000Z",
    });
    const base = { ...taskV3("planning", "planning"), epicId: "ordered-epic" };
    const first = { ...base, id: "20260813-120000-measure" };
    const second = { ...base, id: "20260813-120000-cut" };

    await expect(saveWorkflow(root, { task: first, epic, epicMembers: [second] })).rejects.toThrow(
      /20260813-120000-measure.*20260813-120000-cut.*later idPrefix/su,
    );
    await expect(access(join(root, ".harnix", "tasks", first.id))).rejects.toMatchObject({ code: "ENOENT" });

    const later = { ...second, id: "20260813-120001-cut" };
    await expect(saveWorkflow(root, { task: first, epic, epicMembers: [later] })).resolves.toMatchObject({
      id: first.id,
    });
  });
});
