import { describe, expect, it } from "vitest";
import { transitionHint } from "src/core/tasks/transition-hint.js";
import { transitions } from "src/core/tasks/task-schema.js";

const hint = (from: Parameters<typeof transitionHint>[0], to: Parameters<typeof transitionHint>[1]) =>
  transitionHint(from, to, transitions[from]);

describe("transitionHint", () => {
  it("names the whole command chain from planning to in_progress", () => {
    const text = hint("planning", "in_progress");
    expect(text).toContain("legal next statuses from planning: ready, blocked");
    expect(text).toContain(
      "harnix workflow --transition ready/ready, then harnix workflow --transition in_progress/implementing",
    );
  });

  it("starts the chain after the current status", () => {
    const text = hint("ready", "verifying");
    expect(text).toContain(
      "harnix workflow --transition in_progress/implementing, then harnix workflow --transition verifying/verifying",
    );
    expect(text).not.toContain("--transition ready/ready");
  });

  it("points at finish for completed", () => {
    expect(hint("verifying", "completed")).toContain("harnix workflow --finish");
  });

  it("explains that nothing goes back and points at replan", () => {
    const text = hint("in_progress", "planning");
    expect(text).toContain("replan");
    expect(text).not.toContain("then harnix workflow");
  });

  it("states that a terminal status has no transitions", () => {
    expect(hint("completed", "planning")).toBe("completed is terminal and has no further transitions");
  });

  it("asks a blocked task to resume to its recorded status first", () => {
    const text = transitionHint("blocked", "completed", transitions.blocked, "in_progress");
    expect(text).toContain("Resume it to its recorded status");
    expect(text).toContain("in_progress");
  });
});
