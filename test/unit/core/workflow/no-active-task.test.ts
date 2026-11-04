import { describe, expect, it } from "vitest";

import { cancelWorkflow } from "src/core/workflow/cancel.js";
import { noActiveTaskError } from "src/core/workflow/no-active-task.js";
import { snapshotWorkflow } from "src/core/workflow/snapshot.js";
import { transitionWorkflow } from "src/core/workflow/transition.js";
import { createTestProject } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-no-active-");

describe("noActiveTaskError", () => {
  it("keeps the original sentence and adds a hint naming how to get a task", () => {
    const error = noActiveTaskError("Workflow transition");

    expect(error.message.split("\n")[0]).toBe("Workflow transition requires an active task.");
    expect(error.message).toContain("\nGợi ý: ");
    expect(error.message).toContain("harnix resume <task-id>");
    expect(error.message).toContain("harnix workflow --init");
  });

  it.each([
    ["transition", (root: string) => transitionWorkflow(root, "ready", "ready")],
    ["snapshot", (root: string) => snapshotWorkflow(root, "check")],
    ["cancel", (root: string) => cancelWorkflow(root, { reason: "x", authorizedBy: "user" })],
  ])("is what the %s action throws without an active task", async (_name, action) => {
    const root = await createTestProject(await temporaryRepository());

    await expect(action(root)).rejects.toThrow(/requires an active task\.\nGợi ý: .*harnix resume <task-id>/su);
  });
});
