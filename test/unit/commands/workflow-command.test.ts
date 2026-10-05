import { describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { registerWorkflowCommand } from "src/commands/workflow-command.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { initializeUtcProject, taskV3, writeProjectSource } from "test/support/workflow-fixtures.js";
import { saveWorkflow } from "src/core/workflow/save.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow command unit", () => {
  it("registers workflow command and options on commander", () => {
    const program = new Command();
    registerWorkflowCommand(program, {});
    const workflowCmd = program.commands.find((c) => c.name() === "workflow");
    expect(workflowCmd).toBeDefined();
    expect(workflowCmd?.options.some((opt) => opt.long === "--run-check")).toBe(true);
    expect(workflowCmd?.options.some((opt) => opt.long === "--set-check")).toBe(true);
    expect(workflowCmd?.options.some((opt) => opt.long === "--batch")).toBe(true);
    expect(workflowCmd?.options.some((opt) => opt.long === "--cwd")).toBe(true);
    expect(workflowCmd?.options.some((opt) => opt.long === "--follow-up")).toBe(true);
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

  it("handles validation errors on transition and replace-check format", async () => {
    const program = new Command();
    registerWorkflowCommand(program, {});
    await expect(
      program.parseAsync(["node", "harnix", "workflow", "--transition", "invalid-format"]),
    ).rejects.toThrow(/transition requires <status>\/<checkpoint>/u);

    const program2 = new Command();
    registerWorkflowCommand(program2, {});
    await expect(
      program2.parseAsync(["node", "harnix", "workflow", "--replace-check", "single-id", "--reason", "Test reason"]),
    ).rejects.toThrow(/exactly two check IDs/u);
  });

  it("executes workflow action handlers for decision, risk, paths, and criterion", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeProjectSource(root);
    const task = taskV3("planning", "planning");
    await saveWorkflow(root, { task });

    const originalCwd = process.cwd();
    process.chdir(root);

    const program = new Command();
    registerWorkflowCommand(program, {});
    let written = "";
    const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      written += typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);
      return true;
    });
    try {
      await program.parseAsync([
        "node",
        "harnix",
        "workflow",
        "--add-decision",
        "dec-unit-1",
        "--text",
        "Decision text",
        "--rationale",
        "Decision why",
        "--brief",
      ]);
      expect(written).toContain("updatedAt");

      written = "";
      await program.parseAsync([
        "node",
        "harnix",
        "workflow",
        "--add-risk",
        "risk-unit-1",
        "--text",
        "Risk text",
        "--severity",
        "low",
        "--brief",
      ]);
      expect(written).toContain("updatedAt");

      written = "";
      await program.parseAsync([
        "node",
        "harnix",
        "workflow",
        "--set-paths",
        "--relevant-path",
        "src/**",
        "--brief",
      ]);
      expect(written).toContain("updatedAt");

      written = "";
      await program.parseAsync([
        "node",
        "harnix",
        "workflow",
        "--add-criterion",
        "crit-unit-1",
        "--text",
        "Criterion text",
        "--check",
        "check",
        "--brief",
      ]);
      expect(written).toContain("updatedAt");

      written = "";
      await program.parseAsync([
        "node",
        "harnix",
        "workflow",
        "--set-check",
        "check-unit-1",
        "--description",
        "Check description",
        "--command",
        "pnpm test",
        "--scope",
        "focused",
        "--criteria",
        "crit-unit-1",
        "--input",
        "src/**",
        "--cwd",
        "src",
        "--brief",
      ]);
      expect(written).toContain("updatedAt");
    } finally {
      process.chdir(originalCwd);
      spy.mockRestore();
    }
  });
});
