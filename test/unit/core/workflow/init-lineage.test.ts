import { describe, expect, it } from "vitest";

import { upsertEpic } from "src/core/epics/epic.js";
import { clearActiveTask } from "src/core/tasks/task-store.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { resolveLineage } from "src/core/workflow/init-lineage.js";
import { buildEpic } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const epic = (id: string) => buildEpic({ id });

async function project() {
  const root = await temporaryRepository();
  await initializeUtcProject(root);
  return root;
}

describe("resolveLineage", () => {
  it("returns an empty lineage when neither an epic nor a follow-up is requested", async () => {
    const root = await project();

    await expect(resolveLineage(root, {})).resolves.toEqual({ relevantPaths: [], relevantSpecs: [] });
  });

  it("validates the epic id before touching the filesystem and requires the epic to exist", async () => {
    const root = await project();

    await expect(resolveLineage(root, { epic: "../escape" })).rejects.toThrow(/not a valid epic id/u);
    await expect(resolveLineage(root, { epic: "20261006-100000-missing" })).rejects.toThrow(/not found/u);
    await upsertEpic(root, epic("20261006-100000-known"));
    await expect(resolveLineage(root, { epic: " 20261006-100000-known " })).resolves.toMatchObject({
      epicId: "20261006-100000-known",
    });
  });

  it("inherits the parent's epic and paths, and reports a missing or conflicting parent", async () => {
    const root = await project();
    await upsertEpic(root, epic("20261006-100000-known"));
    const parent = {
      ...taskV3("planning", "planning"),
      epicId: "20261006-100000-known",
      relevantPaths: ["src/a.ts"],
      relevantSpecs: ["docs/a.md"],
    };
    await saveWorkflow(root, { task: parent });
    await clearActiveTask(`${root}/.harnix`, parent.id);

    await expect(resolveLineage(root, { followUp: parent.id })).resolves.toEqual({
      epicId: "20261006-100000-known",
      followUpOf: parent.id,
      relevantPaths: ["src/a.ts"],
      relevantSpecs: ["docs/a.md"],
    });
    await expect(resolveLineage(root, { followUp: "20261006-000000-absent" })).rejects.toThrow(/not found/u);
    await upsertEpic(root, epic("20261006-100001-other"));
    await expect(resolveLineage(root, { followUp: parent.id, epic: "20261006-100001-other" })).rejects.toThrow(
      /conflicts with epic 20261006-100000-known/u,
    );
  });
});
