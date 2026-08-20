import { describe, expect, it } from "vitest";

import { createProgram, runCli } from "../../src/cli-program.js";

describe("CLI command contract", () => {
  it("exposes eight supported commands without exposing hidden/internal commands", () => {
    expect(createProgram().commands.filter((command) => !(command as { _hidden?: boolean })._hidden).map((command) => command.name())).toEqual(["init", "setup", "update", "upgrade", "uninstall", "mem", "doctor", "repo-map"]);
  });

  it("registers single-command action flags without nested command trees", () => {
    const program = createProgram();
    const context = program.commands.find((command) => command.name() === "context");
    const repoMap = program.commands.find((command) => command.name() === "repo-map");
    const workflow = program.commands.find((command) => command.name() === "workflow");

    expect(program.commands.find((command) => command.name() === "internal")).toBeUndefined();
    expect(program.commands.every((command) => command.commands.length === 0)).toBe(true);
    expect((context as { _hidden?: boolean } | undefined)?._hidden).toBe(true);
    expect(repoMap?.options.map((option) => option.long)).toEqual(["--query", "--limit", "--refresh"]);
    expect(repoMap?.options.find((option) => option.long === "--refresh")?.hidden).toBe(true);
    expect(workflow?.options.map((option) => option.long)).toEqual(["--inspect", "--save", "--snapshot", "--audit-ready", "--finish", "--cancel", "--check"]);
  });

  it("keeps the workflow transport hidden and rejects ambiguous action flags", async () => {
    const workflow = createProgram().commands.find((command) => command.name() === "workflow");

    expect(workflow?.commands).toEqual([]);
    expect((workflow as { _hidden?: boolean } | undefined)?._hidden).toBe(true);
    await expect(runCli(["node", "harnix", "workflow"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "workflow", "--inspect", "--finish"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "workflow", "--snapshot"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "workflow", "--inspect", "--check", "check"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "workflow", "inspect"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "internal", "context", "--platform", "codex"])).resolves.toBe(2);
  });
});
