import { describe, expect, it } from "vitest";

import { prepareChecksBatch } from "src/core/workflow/checks-batch.js";
import { saveWorkflow } from "src/core/workflow/index.js";
import { resolveActiveTask } from "src/core/tasks/task.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import {
  implementingTaskV3,
  initializeUtcProject,
  taskV3,
  writeProjectSource,
} from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();

async function statusOf(root: string): Promise<string> {
  const task = await resolveActiveTask(await resolveSafeHarnixPath(root));
  return `${task?.status}/${task?.checkpoint}`;
}

describe("prepareChecksBatch", () => {
  it("moves an implementing task to verifying/verifying before the checks run", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    await prepareChecksBatch(root);

    expect(await statusOf(root)).toBe("verifying/verifying");
  });

  it("leaves a task that is already verifying where it is", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    await prepareChecksBatch(root);
    await prepareChecksBatch(root);

    expect(await statusOf(root)).toBe("verifying/verifying");
  });

  it("refuses a ready task: the authorization to implement is not part of a batch", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeProjectSource(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    await saveWorkflow(root, { task: { ...planning, status: "ready", checkpoint: "ready" } });

    await expect(prepareChecksBatch(root)).rejects.toThrow(
      /in_progress or verifying \(this one is ready\)[\s\S]*--transition in_progress\/implementing/u,
    );
    expect(await statusOf(root)).toBe("ready/ready");
  });

  it("refuses a planning task and points at the ready gate", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeProjectSource(root);
    await saveWorkflow(root, { task: taskV3("planning", "planning") });

    await expect(prepareChecksBatch(root)).rejects.toThrow(
      /in_progress or verifying \(this one is planning\)[\s\S]*--transition ready\/ready/u,
    );
  });

  it("refuses when there is no active task", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    await expect(prepareChecksBatch(root)).rejects.toThrow(/requires an active task/iu);
  });
});
