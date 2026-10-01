import { describe, expect, it } from "vitest";

import { BRIEF_ACTIONS, briefFlagNames, briefPreflight, briefTask } from "src/core/workflow/brief.js";
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

  it("shares one set of actions that accept --brief, including preflight and the plan-edit flags", () => {
    for (const action of ["save", "preflight", "setCheck", "addCriterion", "setPaths", "runCheck", "finish"])
      expect(BRIEF_ACTIONS.has(action)).toBe(true);
    expect(BRIEF_ACTIONS.has("inspect")).toBe(false);
    expect(briefFlagNames()).toEqual(
      expect.arrayContaining(["--preflight", "--run-check", "--set-check", "--add-criterion", "--set-paths"]),
    );
    expect(briefFlagNames()).not.toContain("--inspect");
  });

  it("drops only the learning notes from a brief preflight", () => {
    const result = { clock: { now: "n" }, nextStage: "plan", learning: [{ id: "obs-1" }] };

    expect(briefPreflight(result)).toEqual({ clock: { now: "n" }, nextStage: "plan" });
  });
});
