import { describe, expect, it } from "vitest";

import { createProgram } from "../../src/cli-program.js";

describe("CLI command contract", () => {
  it("exposes eight supported commands without exposing hidden/internal commands", () => {
    expect(createProgram().commands.filter((command) => !(command as { _hidden?: boolean })._hidden).map((command) => command.name())).toEqual(["init", "setup", "update", "upgrade", "uninstall", "mem", "doctor", "repo-map"]);
  });

  it("registers the hidden workflow snapshot command with an explicit check ID", () => {
    const internal = createProgram().commands.find((command) => command.name() === "internal");
    const workflow = internal?.commands.find((command) => command.name() === "workflow");
    const snapshot = workflow?.commands.find((command) => command.name() === "snapshot");
    expect(snapshot?.options.find((option) => option.long === "--check")?.required).toBe(true);
  });
});
