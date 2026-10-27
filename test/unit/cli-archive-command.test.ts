import { Command } from "commander";
import { describe, expect, it } from "vitest";

import { registerArchiveCommand } from "src/cli-archive-command.js";

describe("CLI archive command registration", () => {
  it("registers one archive command with its three options", () => {
    const program = new Command();
    registerArchiveCommand(program);

    const archive = program.commands.find((command) => command.name() === "archive");

    expect(archive?.options.map((option) => option.long)).toEqual(["--days", "--apply", "--restore"]);
    expect(archive?.commands).toEqual([]);
  });
});
