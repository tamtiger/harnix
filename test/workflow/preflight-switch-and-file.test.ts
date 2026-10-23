import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { preflightWorkflow } from "src/core/workflow/preflight.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { initializeUtcProject, taskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { WORKFLOW_HANDLERS } from "src/commands/workflow-handlers.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow preflight --expected-task and safe file payload", () => {
  it("detects task switch when active task differs from expectedTask", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const task = taskV3("planning", "planning");
    task.id = "20261023-100000-task-a";
    await saveWorkflow(root, { task });

    // Matching expected task
    const match = await preflightWorkflow(root, undefined, undefined, "20261023-100000-task-a");
    expect(match.taskSwitched).toBe(false);
    expect(match.nextStage).toBe("plan");

    // Mismatched expected task
    const mismatch = await preflightWorkflow(root, undefined, undefined, "20261023-090000-different-task");
    expect(mismatch.taskSwitched).toBe(true);
    expect(mismatch.nextStage).toBe("stop");
  });

  it("reports taskSwitched true and stops when no active task exists but expectedTask was provided", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    const result = await preflightWorkflow(root, undefined, undefined, "20261023-100000-expected-task");
    expect(result.taskSwitched).toBe(true);
    expect(result.nextStage).toBe("stop");
    expect(result.activeTask).toBeNull();
  });

  it("does not include taskSwitched when expectedTask is omitted", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const task = taskV3("planning", "planning");
    await saveWorkflow(root, { task });

    const result = await preflightWorkflow(root);
    expect(result.taskSwitched).toBeUndefined();
    expect(result.nextStage).toBe("plan");
  });

  it("handles --file with UTF-8 BOM and Vietnamese text for workflow handlers", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const task = taskV3("planning", "planning");
    task.id = "20261023-100000-file-task";
    await saveWorkflow(root, { task });

    // Test set-paths with --file containing UTF-8 with BOM
    const pathsPayload = JSON.stringify({
      paths: ["src/dịch-vụ-thanh-toán/**"],
      specs: ["docs/đặc-tả-nghiệp-vụ.md"],
    });
    const pathsFile = join(root, "paths-payload.json");
    // Write UTF-8 BOM + JSON
    await writeFile(pathsFile, "\uFEFF" + pathsPayload, "utf8");

    const handler = WORKFLOW_HANDLERS.setPaths;
    const result = await handler({
      root,
      flags: { setPaths: true, file: "paths-payload.json" },
      operands: [],
      options: {},
    });
    expect(result).toBeDefined();

    // Verify cancellation with --file
    const cancelPayload = JSON.stringify({
      reason: "Hủy bỏ tác vụ này vì không còn phù hợp",
      authorizedBy: "user",
    });
    const cancelFile = join(root, "cancel-payload.json");
    await writeFile(cancelFile, cancelPayload, "utf8");

    const cancelHandler = WORKFLOW_HANDLERS.cancel;
    const cancelResult = (await cancelHandler({
      root,
      flags: { cancel: true, file: "cancel-payload.json" },
      operands: [],
      options: {},
    })) as { status: string; checkpoint: string };
    expect(cancelResult.status).toBe("cancelled");
  });
});
