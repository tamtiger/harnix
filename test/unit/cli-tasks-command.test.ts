import { Command } from "commander";
import { describe, expect, it } from "vitest";

import { registerTasksCommand } from "src/cli-tasks-command.js";

describe("CLI tasks command registration", () => {
  it("registers one tasks command with its six options", () => {
    const program = new Command();
    registerTasksCommand(program);

    const tasks = program.commands.find((command) => command.name() === "tasks");

    expect(tasks?.options.map((option) => option.long)).toEqual([
      "--limit",
      "--status",
      "--archived",
      "--stale",
      "--days",
      "--brief",
    ]);
    expect(tasks?.commands).toEqual([]);
  });

  it("rejects --days without --stale", async () => {
    const program = new Command().exitOverride();
    registerTasksCommand(program);

    await expect(program.parseAsync(["tasks", "--days", "7"], { from: "user" })).rejects.toThrow(
      /--days requires --stale/u,
    );
  });
});
