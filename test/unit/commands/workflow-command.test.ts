import { describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { registerWorkflowCommand } from "src/commands/workflow-command.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import {
  implementingTaskV3,
  initializeUtcProject,
  taskV3,
  writeProjectSource,
} from "test/support/workflow-fixtures.js";
import { saveWorkflow } from "src/core/workflow/save.js";

const temporaryRepository = useTemporaryRepositories();

describe.sequential("workflow command unit", () => {
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

  it("merges repeated list flags into one comma-separated value", () => {
    const program = new Command();
    registerWorkflowCommand(program, {});
    const workflowCmd = program.commands.find((c) => c.name() === "workflow");
    for (const flag of ["--criteria", "--criterion", "--evidence-ids", "--check"]) {
      const option = workflowCmd?.options.find((opt) => opt.long === flag);
      expect(option?.parseArg?.("ac-2", "ac-1"), flag).toBe("ac-1,ac-2");
      expect(option?.parseArg?.("ac-1", undefined), flag).toBe("ac-1");
    }
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
  }, 40_000);

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
    await expect(program.parseAsync(["node", "harnix", "workflow", "--transition", "invalid-format"])).rejects.toThrow(
      /transition requires <status>\/<checkpoint>/u,
    );

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
      await program.parseAsync(["node", "harnix", "workflow", "--set-paths", "--relevant-path", "src/**", "--brief"]);
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

  it("executes batched workflow actions: criterion met + transition verifying/finishing", async () => {
    const root = await temporaryRepository();
    await implementingTaskV3(root);
    const originalCwd = process.cwd();
    process.chdir(root);

    const makeProgram = () => {
      const p = new Command();
      registerWorkflowCommand(p, {});
      return p;
    };
    let written = "";
    const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      written += typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);
      return true;
    });

    try {
      await makeProgram().parseAsync(["node", "harnix", "workflow", "--transition", "verifying/verifying"]);
      await makeProgram().parseAsync([
        "node",
        "harnix",
        "workflow",
        "--evidence",
        "--check",
        "check",
        "--result",
        "pass",
        "--exit-code",
        "0",
        "--summary",
        "ok",
      ]);

      written = "";
      await makeProgram().parseAsync([
        "node",
        "harnix",
        "workflow",
        "--criterion",
        "a",
        "--met",
        "--transition",
        "verifying/finishing",
        "--brief",
      ]);
      const parsed = JSON.parse(written) as { status: string; checkpoint: string };
      expect(parsed.status).toBe("verifying");
      expect(parsed.checkpoint).toBe("finishing");
    } finally {
      process.chdir(originalCwd);
      spy.mockRestore();
    }
  });

  it("rejects invalid action batching combinations", async () => {
    const program1 = new Command();
    registerWorkflowCommand(program1, {});
    await expect(
      program1.parseAsync(["node", "harnix", "workflow", "--init", "--transition", "ready/ready"]),
    ).rejects.toThrow(/workflow requires exactly one of/u);

    const program2 = new Command();
    registerWorkflowCommand(program2, {});
    await expect(
      program2.parseAsync(["node", "harnix", "workflow", "--transition", "in_progress/implementing", "--finish"]),
    ).rejects.toThrow(
      /workflow action batching does not allow combining --transition with --finish unless transitioning to verifying\/finishing/u,
    );

    const program3 = new Command();
    registerWorkflowCommand(program3, {});
    await expect(
      program3.parseAsync(["node", "harnix", "workflow", "--criterion", "ac-1", "--transition", "verifying/finishing"]),
    ).rejects.toThrow(/workflow --criterion requires --met/u);

    const program4 = new Command();
    registerWorkflowCommand(program4, {});
    await expect(
      program4.parseAsync([
        "node",
        "harnix",
        "workflow",
        "--criterion",
        "ac-1",
        "--met",
        "--transition",
        "verifying/finishing",
        "--dry-run",
      ]),
    ).rejects.toThrow(/workflow action batching does not support --dry-run/u);
  });
});
