import { afterEach, describe, expect, it, vi } from "vitest";

import { createProgram, runCli } from "../../src/cli-program.js";

afterEach(() => vi.restoreAllMocks());

describe("CLI command contract", () => {
  it("exposes fourteen supported commands without exposing hidden/internal commands", () => {
    expect(createProgram().commands.filter((command) => !(command as { _hidden?: boolean })._hidden).map((command) => command.name())).toEqual(["init", "setup", "update", "upgrade", "uninstall", "mem", "status", "tasks", "resume", "context-report", "checks", "audit", "doctor", "repo-map"]);
  });

  it("registers single-command action flags without nested command trees", () => {
    const program = createProgram();
    const context = program.commands.find((command) => command.name() === "context");
    const repoMap = program.commands.find((command) => command.name() === "repo-map");
    const status = program.commands.find((command) => command.name() === "status");
    const tasks = program.commands.find((command) => command.name() === "tasks");
    const resume = program.commands.find((command) => command.name() === "resume");
    const contextReport = program.commands.find((command) => command.name() === "context-report");
    const checks = program.commands.find((command) => command.name() === "checks");
    const audit = program.commands.find((command) => command.name() === "audit");
    const workflow = program.commands.find((command) => command.name() === "workflow");

    expect(program.commands.find((command) => command.name() === "internal")).toBeUndefined();
    expect(program.commands.every((command) => command.commands.length === 0)).toBe(true);
    expect((context as { _hidden?: boolean } | undefined)?._hidden).toBe(true);
    expect(repoMap?.options.map((option) => option.long)).toEqual(["--query", "--impact", "--limit", "--depth", "--refresh"]);
    expect(repoMap?.options.find((option) => option.long === "--refresh")?.hidden).toBe(true);
    expect(status?.options).toEqual([]);
    expect(tasks?.options.map((option) => option.long)).toEqual(["--limit", "--status"]);
    expect(resume?.options.map((option) => option.long)).toEqual(["--dry-run"]);
    expect(contextReport?.options.map((option) => option.long)).toEqual(["--platform", "--limit"]);
    expect(checks?.options.map((option) => option.long)).toEqual(["--limit"]);
    expect(audit?.options).toEqual([]);
    expect(workflow?.options.map((option) => option.long)).toEqual(["--inspect", "--preflight", "--save", "--snapshot", "--audit-ready", "--finish", "--cancel", "--learn", "--check"]);
  });

  it("keeps the workflow transport hidden and rejects ambiguous action flags", async () => {
    const workflow = createProgram().commands.find((command) => command.name() === "workflow");
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    expect(workflow?.commands).toEqual([]);
    expect((workflow as { _hidden?: boolean } | undefined)?._hidden).toBe(true);
    await expect(runCli(["node", "harnix", "workflow"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "workflow", "--inspect", "--finish"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "workflow", "--snapshot"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "workflow", "--inspect", "--check", "check"])).resolves.toBe(2);
    await expect(runCli(["node", "harnix", "workflow", "inspect"])).resolves.toBe(2);
    expect(stdout.mock.calls.map((call) => String(call[0])).join("")).toBe("");

    await expect(runCli(["node", "harnix", "internal", "context", "--platform", "codex"])).resolves.toBe(2);
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      ok: false,
      error: { exitCode: 2, message: "error: unknown command 'internal'" },
    });
  });
});
