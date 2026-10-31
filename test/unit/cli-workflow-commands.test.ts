import { Command } from "commander";
import { describe, expect, it } from "vitest";

import { createProgram } from "src/cli-program.js";
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

  it("documents every public command and option in --help", () => {
    const program = createProgram();
    const hiddenCommands = program.commands.filter((cmd) => (cmd as unknown as { _hidden: boolean })._hidden);
    expect(hiddenCommands.map((cmd) => cmd.name()).sort()).toEqual(["context", "workflow"]);
    for (const cmd of program.commands.filter((c) => !hiddenCommands.includes(c))) {
      expect(cmd.description(), `${cmd.name()} description`).not.toBe("");
      for (const option of cmd.options.filter((o) => !o.hidden && o.long !== "--help"))
        expect(option.description, `${cmd.name()} ${option.long}`).not.toBe("");
    }
  });

  it("shows repo-map --refresh and no other hidden public option", () => {
    const program = createProgram();
    const repoMap = program.commands.find((cmd) => cmd.name() === "repo-map");
    expect(repoMap?.helpInformation()).toContain("--refresh");
    const hidden = program.commands.flatMap((cmd) =>
      cmd.options.filter((o) => o.hidden).map((o) => `${cmd.name()} ${o.long}`),
    );
    expect(hidden).toEqual(["init --yes"]);
  });
});
