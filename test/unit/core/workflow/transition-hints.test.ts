import { describe, expect, it } from "vitest";

import { invalidStatusError } from "src/core/workflow/transition-hints.js";
import { transitionWorkflow } from "src/core/workflow/transition.js";
import { implementingTaskV3 } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-transition-hints-");

describe("invalidStatusError", () => {
  it("names the status that owns a checkpoint typed in the status position", () => {
    expect(invalidStatusError("finishing").message).toContain("Gợi ý: ");
    expect(invalidStatusError("finishing").message).toContain("verifying/finishing");
    expect(invalidStatusError("implementing").message).toContain("in_progress/implementing");
  });

  it("keeps the original sentence and lists valid statuses for an unknown word", () => {
    const message = invalidStatusError("nonsense").message;

    expect(message.split("\n")[0]).toBe(
      "Task status 'nonsense' is invalid (expected planning, ready, in_progress, verifying, blocked, completed, cancelled).",
    );
    expect(message).toContain("ready/ready");
    expect(message).not.toContain("verifying/finishing is");
  });

  it("is what workflow --transition throws when a checkpoint stands where the status belongs", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);

    await expect(transitionWorkflow(root, "finishing", "finishing")).rejects.toThrow(
      /\nGợi ý: .*verifying\/finishing/su,
    );
  });
});
