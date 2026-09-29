import { describe, expect, it } from "vitest";

import { saveTask, setActiveTask } from "src/core/tasks/task.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { snapshotWorkflow } from "src/core/workflow/snapshot.js";
import { buildTaskV2, buildTaskV3, createTestProject } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { join } from "node:path";

const temporaryRepository = useTemporaryRepositories();

describe("workflow snapshot", () => {
  it("returns the current digest of a declared check without persisting anything", async () => {
    const root = await createTestProject(await temporaryRepository());
    const task = await saveWorkflow(root, { task: buildTaskV3() });

    const snapshot = await snapshotWorkflow(root, "check");

    expect(snapshot).toEqual(await computeInputDigest(root, task as ReturnType<typeof buildTaskV3>, "check"));
    expect(snapshot.schemaVersion).toBe(3);
    expect(snapshot.inputDigest).toMatch(/^[a-f0-9]{64}$/u);
  });

  it("rejects when no task is active or the check is not declared", async () => {
    const root = await createTestProject(await temporaryRepository());
    await expect(snapshotWorkflow(root, "check")).rejects.toThrow("requires an active task");

    await saveWorkflow(root, { task: buildTaskV3() });
    await expect(snapshotWorkflow(root, "missing-check")).rejects.toThrow("not declared");
  });

  it("asks an unmigrated legacy task to migrate first", async () => {
    const root = await createTestProject(await temporaryRepository());
    const legacy = buildTaskV2();
    await saveTask(join(root, ".harnix"), legacy);
    await setActiveTask(join(root, ".harnix"), legacy.id);

    await expect(snapshotWorkflow(root, "check")).rejects.toThrow("migrate the task first");
  });
});
