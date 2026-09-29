import { describe, expect, it } from "vitest";

import { inspectWorkflow } from "src/core/workflow/inspect.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { buildTaskV3 } from "test/support/builders.js";
import { createTestProject } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow inspect", () => {
  it("reports no active task with an unrecorded context when nothing is persisted", async () => {
    const root = await createTestProject(await temporaryRepository());

    expect(await inspectWorkflow(root)).toEqual({
      activeTask: null,
      contextDrift: { state: "not-recorded", changes: [], selectionChanges: [] },
    });
  });

  it("returns the persisted active task unchanged together with its context drift", async () => {
    const root = await createTestProject(await temporaryRepository());
    const saved = await saveWorkflow(root, { task: buildTaskV3() });

    const inspected = await inspectWorkflow(root);

    expect(inspected.activeTask).toEqual(saved);
    expect(inspected.contextDrift.state).toBe("not-recorded");
  });
});
