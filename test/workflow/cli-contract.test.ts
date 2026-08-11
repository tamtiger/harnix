import { describe, expect, it } from "vitest";

import { createProgram } from "../../src/cli.js";

describe("CLI command contract", () => {
  it("exposes the seven supported lifecycle commands without exposing hidden/internal commands", () => {
    expect(createProgram().commands.filter((command) => !(command as { _hidden?: boolean })._hidden).map((command) => command.name())).toEqual(["init", "setup", "update", "upgrade", "uninstall", "mem", "doctor"]);
  });
});
