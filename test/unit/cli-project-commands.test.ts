import { Command } from "commander";
import { describe, expect, it } from "vitest";

import { registerProjectCommands } from "src/cli-project-commands.js";

describe("CLI project commands registration", () => {
  it("registers project commands on a Commander program", () => {
    const program = new Command();
    registerProjectCommands(program, {});
    const registered = program.commands.map((cmd) => cmd.name());
    expect(registered).toContain("init");
    expect(registered).toContain("setup");
    expect(registered).toContain("update");
    expect(registered).toContain("upgrade");
    expect(registered).toContain("uninstall");
  });
});
