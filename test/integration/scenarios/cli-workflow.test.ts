import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createProgram, runCli } from "src/cli-program.js";
import { initializeProject } from "src/commands/init.js";
import { refreshRepoMap } from "src/core/repo-map/service.js";
import { buildGatedTask } from "test/support/integration-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const fixture = useTemporaryRepositories("harnix-cli-test-");
const temporaryUserHome = useTemporaryUserHomes("harnix-cli-user-home-");
afterEach(() => {
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe.sequential("CLI doctor, context and hidden workflow", () => {
  it("should_emit_doctor_json_by_default", async () => {
    const root = await fixture();
    const home = await temporaryUserHome();
    process.chdir(root);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--yes", "--user", "tam"], {
      from: "node",
    });
    await expect(
      createProgram({
        commandLookup: async () => true,
        environment: { CODEX_HOME: join(home, "codex") },
        homeResolver: async () => home,
        interactive: false,
      }).parseAsync(["node", "harnix", "doctor"], { from: "node" }),
    ).resolves.toBeDefined();
  });
  it("should_emit_one_deterministic_doctor_json_document_to_stdout", async () => {
    const root = await fixture();
    const home = await temporaryUserHome();
    process.chdir(root);
    await initializeProject({ developer: "tam", root, yes: true });
    await refreshRepoMap({ root });
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const programOptions = {
      commandLookup: async () => true,
      environment: { CODEX_HOME: join(home, "codex") },
      homeResolver: async () => home,
    };

    await expect(runCli(["node", "harnix", "doctor"], programOptions)).resolves.toBe(0);
    const first = stdout.mock.calls.map((call) => String(call[0])).join("");
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "doctor"], programOptions)).resolves.toBe(0);
    const second = stdout.mock.calls.map((call) => String(call[0])).join("");

    expect(first).toBe(second);
    expect(first).toMatch(/^\{[\s\S]*\}\n$/u);
    expect(JSON.parse(first)).toEqual(
      expect.objectContaining({
        generator: "harnix",
        schemaVersion: 2,
        ok: true,
        project: { status: "ready", findings: [] },
        summary: { errors: 0, warnings: 0, fixed: 0 },
      }),
    );
  });
  it("should_use_validated_hook_event_cwd_when_context_is_invoked", async () => {
    const root = await fixture();
    const elsewhere = await fixture();
    process.chdir(root);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--yes", "--user", "tam"], {
      from: "node",
    });
    process.chdir(elsewhere);
    const output = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await createProgram({ interactive: false, hookEventInput: async () => JSON.stringify({ cwd: root }) }).parseAsync(
      ["node", "harnix", "context", "--platform", "codex"],
      { from: "node" },
    );

    expect(output).toHaveBeenCalledWith(expect.stringContaining("hookSpecificOutput"));
  });
  it("should_dispatch_hidden_workflow_actions_from_flags", async () => {
    const root = await fixture();
    process.chdir(root);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--user", "tam"], {
      from: "node",
    });
    const output = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "workflow", "--inspect"], {
      from: "node",
    });

    expect(JSON.parse(output.mock.calls.map((call) => String(call[0])).join(""))).toEqual({
      activeTask: null,
      contextDrift: { state: "not-recorded", changes: [], selectionChanges: [] },
    });
    output.mockClear();
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "workflow", "--preflight"], {
      from: "node",
    });
    expect(JSON.parse(output.mock.calls.map((call) => String(call[0])).join(""))).toEqual({
      learning: [],
      clock: {
        timezone: expect.any(String),
        now: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T[\d:.]+[+-]\d{2}:\d{2}$/u),
        idPrefix: expect.stringMatching(/^\d{8}-\d{6}$/u),
      },
      generator: "harnix",
      schemaVersion: 1,
      activeTask: null,
      contextDrift: "not-recorded",
      requiredChecks: { passed: [], failed: [], stale: [], pending: [] },
      retryLimitReached: [],
      nextStage: "brainstorm",
    });
  });
  it("should_recognize_the_hidden_learning_action_and_require_an_active_finishing_task", async () => {
    const root = await fixture();
    process.chdir(root);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--user", "tam"], {
      from: "node",
    });
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const workflowInput = async () =>
      JSON.stringify({
        candidate: { id: "learning", statement: "statement", sourceTaskIds: ["a", "b"], evidenceIds: ["e1", "e2"] },
      });

    await expect(
      runCli(["node", "harnix", "workflow", "--learn"], { interactive: false, workflowInput }),
    ).resolves.toBe(2);

    const message = stderr.mock.calls.flatMap((call) => call).join("");
    expect(message).toContain("active task");
    expect(message).not.toContain("unknown option");
    expect(stdout.mock.calls.map((call) => String(call[0])).join("")).toBe("");
  });
  it("should_cancel_an_active_task_from_a_bounded_json_envelope", async () => {
    const root = await fixture();
    process.chdir(root);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--user", "tam"], {
      from: "node",
    });
    const timestamp = "2026-08-19T00:00:00.000Z";
    const planning = buildGatedTask({
      id: "20260819-000000-cancel-me",
      title: "Cancel me",
      goal: "Stop safely",
      criterion: { id: "a", text: "done" },
      gate: { id: "check", description: "verify", inputs: ["package.json"] },
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const output = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await createProgram({
      interactive: false,
      workflowInput: async () => JSON.stringify({ task: planning }),
    }).parseAsync(["node", "harnix", "workflow", "--save"], { from: "node" });
    output.mockClear();

    await createProgram({
      interactive: false,
      workflowInput: async () => JSON.stringify({ reason: "Người dùng dừng task.", authorizedBy: "user" }),
    }).parseAsync(["node", "harnix", "workflow", "--cancel"], { from: "node" });

    expect(JSON.parse(output.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({
      status: "cancelled",
      checkpoint: "cancelling",
    });
    await writeFile(join(root, ".harnix", "tasks", ".active"), `${planning.id}\n`);
    output.mockClear();
    const ttyDescriptor = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
    Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: true });
    try {
      await createProgram({ interactive: false }).parseAsync(["node", "harnix", "workflow", "--cancel"], {
        from: "node",
      });
    } finally {
      if (ttyDescriptor) Object.defineProperty(process.stdin, "isTTY", ttyDescriptor);
      else Reflect.deleteProperty(process.stdin, "isTTY");
    }

    expect(JSON.parse(output.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({
      status: "cancelled",
      checkpoint: "cancelling",
    });
    await expect(readFile(join(root, ".harnix", "tasks", ".active"), "utf8")).resolves.toBe("");
  });
});
