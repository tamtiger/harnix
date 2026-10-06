import { describe, expect, it } from "vitest";

import { presentTask, splitGlobList, splitList } from "src/commands/workflow-handler-utils.js";
import type { WorkflowContext } from "src/commands/workflow-handlers.js";
import { buildTaskV3 } from "test/support/builders.js";

const context = (brief: boolean): WorkflowContext => ({
  root: ".",
  flags: brief ? { brief } : {},
  operands: [],
  options: {},
});

describe("workflow handler utilities", () => {
  it("splits lists on commas and whitespace, and globs on commas outside braces", () => {
    expect(splitList("a, b  c,,d")).toEqual(["a", "b", "c", "d"]);
    expect(splitGlobList("src/**/*.{ts,tsx}, My Dir/**,")).toEqual(["src/**/*.{ts,tsx}", "My Dir/**"]);
  });

  it("presents the whole task, or only its identity with --brief", () => {
    const task = buildTaskV3();

    expect(presentTask(context(false), task)).toBe(task);
    expect(presentTask(context(true), task, "ev-1")).toEqual({
      id: task.id,
      status: task.status,
      checkpoint: task.checkpoint,
      updatedAt: task.updatedAt,
      evidenceId: "ev-1",
    });
  });
});
