import { Command } from "commander";
import { describe, expect, it } from "vitest";

import { registerWorkflowCliCommands } from "src/cli-workflow-commands.js";

describe("CLI workflow commands registration", () => {
  it("registers workflow commands on a Commander program", () => {
    const program = new Command();
    registerWorkflowCliCommands(program, {});
    const registered = program.commands.map((cmd) => cmd.name());
    expect(registered).toContain("mem");
    expect(registered).toContain("status");
    expect(registered).toContain("tasks");
    expect(registered).toContain("epic");
    expect(registered).toContain("resume");
    expect(registered).toContain("pause");
    expect(registered).toContain("context-report");
    expect(registered).toContain("skill");
    expect(registered).toContain("doctor");
    expect(registered).toContain("repo-map");
    expect(registered).toContain("verify-plan");
    expect(registered).toContain("context");
  });
});
