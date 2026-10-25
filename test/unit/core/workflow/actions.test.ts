import { describe, expect, it } from "vitest";

import { createProgram } from "src/cli-program.js";
import { WORKFLOW_HANDLERS } from "src/commands/workflow-handlers.js";
import { actionFlagName, EXACTLY_ONE_ACTION_MESSAGE, listFlags, WORKFLOW_ACTIONS } from "src/core/workflow/actions.js";
import { BRIEF_ACTIONS } from "src/core/workflow/brief.js";
import { workflowEnvelopeSchema } from "src/core/workflow/schema.js";

const names = WORKFLOW_ACTIONS.map((spec) => spec.name);

describe("the workflow action table", () => {
  it("names each action once and spells the flags and lists the way the messages need", () => {
    expect(new Set(names).size).toBe(names.length);
    expect(actionFlagName("runChecks")).toBe("--run-checks");
    expect(listFlags(["init"])).toBe("--init");
    expect(listFlags(["save", "batch", "init"])).toBe("--save, --batch or --init");
    expect(EXACTLY_ONE_ACTION_MESSAGE).toMatch(
      /^workflow requires exactly one of --inspect, --preflight, .*, --tick, or --learn\.$/u,
    );
  });

  it("is what flag parsing, the handlers, --brief and --schema all cover", () => {
    const workflow = createProgram().commands.find((command) => command.name() === "workflow")!;
    const options = new Set(workflow.options.map((option) => option.long));
    const transports = Object.keys((workflowEnvelopeSchema() as { transports: Record<string, string> }).transports);

    for (const spec of WORKFLOW_ACTIONS) {
      const flag = actionFlagName(spec.name);
      expect(options.has(flag), flag).toBe(true);
      expect(WORKFLOW_HANDLERS[spec.name], flag).toBeDefined();
      expect(BRIEF_ACTIONS.has(spec.name), flag).toBe(spec.brief);
    }
    // Actions --schema does not describe yet; adding one changes the --schema output, so this list may only shrink.
    const undescribed = ["--reset-breaker", "--set-title", "--set-goal", "--set-baseline", "--epic-order", "--schema"];
    expect(names.map(actionFlagName).filter((flag) => !transports.includes(flag))).toEqual(undescribed);
  });
});
