import { describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { registerWorkflowCommand } from "src/commands/workflow-command.js";

describe("workflow command unit", () => {
  it("registers workflow command and options on commander", () => {
    const program = new Command();
    registerWorkflowCommand(program, {});
    const workflowCmd = program.commands.find((c) => c.name() === "workflow");
    expect(workflowCmd).toBeDefined();
    expect(workflowCmd?.options.some((opt) => opt.long === "--run-check")).toBe(true);
    expect(workflowCmd?.options.some((opt) => opt.long === "--set-check")).toBe(true);
    expect(workflowCmd?.options.some((opt) => opt.long === "--brief")).toBe(true);
  });

  it("executes workflow --schema via commander action", async () => {
    const program = new Command();
    registerWorkflowCommand(program, {});
    let written = "";
    const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      written += typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);
      return true;
    });
    try {
      await program.parseAsync(["node", "harnix", "workflow", "--schema"]);
      expect(written).toContain("schema");
    } finally {
      spy.mockRestore();
    }
  });

  it("executes workflow --preflight --brief via commander action", async () => {
    const program = new Command();
    registerWorkflowCommand(program, {});
    let written = "";
    const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      written += typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);
      return true;
    });
    try {
      await program.parseAsync(["node", "harnix", "workflow", "--preflight", "--brief"]);
      expect(written).toContain("clock");
    } finally {
      spy.mockRestore();
    }
  });

  it("executes workflow --inspect via commander action", async () => {
    const program = new Command();
    registerWorkflowCommand(program, {});
    let written = "";
    const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      written += typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);
      return true;
    });
    try {
      await program.parseAsync(["node", "harnix", "workflow", "--inspect"]);
      expect(written).toContain("activeTask");
    } finally {
      spy.mockRestore();
    }
  });
});
