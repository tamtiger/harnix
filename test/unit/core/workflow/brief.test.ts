import { describe, expect, it } from "vitest";

import { briefTask } from "src/core/workflow/brief.js";
import { buildTaskV3 } from "test/support/builders.js";

describe("workflow brief output", () => {
  it("keeps only identity and state fields", () => {
    const task = buildTaskV3({
      id: "20260929-090000-brief",
      status: "ready",
      checkpoint: "ready",
      goal: "secret goal",
    });

    expect(briefTask(task)).toEqual({
      id: "20260929-090000-brief",
      status: "ready",
      checkpoint: "ready",
      updatedAt: task.updatedAt,
    });
  });

  it("adds the evidence id only when one was recorded", () => {
    const task = buildTaskV3();

    expect(briefTask(task, "ev-check-1")).toMatchObject({ evidenceId: "ev-check-1" });
    expect("evidenceId" in briefTask(task)).toBe(false);
  });
});
