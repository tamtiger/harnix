import { describe, expect, it } from "vitest";

import { presentTask, splitGlobList, splitList } from "src/commands/workflow-handler-utils.js";
import type { WorkflowContext } from "src/commands/workflow-handlers.js";
import { buildTaskV3 } from "test/support/builders.js";

const context = (flags: { brief?: boolean; full?: boolean } = {}): WorkflowContext => ({
  root: ".",
  flags,
  operands: [],
  options: {},
});

describe("workflow handler utilities", () => {
  it("splits lists on commas and whitespace, and globs on commas outside braces", () => {
    expect(splitList("a, b  c,,d")).toEqual(["a", "b", "c", "d"]);
    expect(splitGlobList("src/**/*.{ts,tsx}, My Dir/**,")).toEqual(["src/**/*.{ts,tsx}", "My Dir/**"]);
  });

  it("presents brief status by default or with --brief, and whole task with --full", () => {
    const task = buildTaskV3();

    expect(presentTask(context({ full: true }), task)).toBe(task);
    expect(presentTask(context(), task)).toEqual({
      id: task.id,
      status: task.status,
      checkpoint: task.checkpoint,
      updatedAt: task.updatedAt,
    });
    expect(presentTask(context({ brief: true }), task, "ev-1")).toEqual({
      id: task.id,
      status: task.status,
      checkpoint: task.checkpoint,
      updatedAt: task.updatedAt,
      evidenceId: "ev-1",
    });
  });
});
