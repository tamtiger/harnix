import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createProgram, redactPublicErrorMessage, runCli } from "../../src/cli-program.js";
import { initializeProject } from "../../src/commands/init.js";
import { refreshRepoMap } from "../../src/core/repo-map/service.js";
import { GlobalManagedTransactionError } from "../../src/utils/global-managed-files.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";
import { useTemporaryUserHomes } from "../support/temporary-user-home.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const fixture = useTemporaryRepositories("harnix-cli-test-");
const temporaryUserHome = useTemporaryUserHomes("harnix-cli-user-home-");
afterEach(() => { process.chdir(originalCwd); process.exitCode = originalExitCode; vi.restoreAllMocks(); });

describe.sequential("CLI", () => {
  it("accepts independent language and technology overrides", async () => {
    const root = await fixture(); process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await createProgram({ environment: { USERNAME: "tam" } }).parseAsync(["node", "harnix", "init", "--languages", "typescript", "--technologies", "nestjs,vue"], { from: "node" });
    const config = await readFile(join(root, ".harnix", "config.yaml"), "utf8");
    expect(config).toContain("languages:\n  - typescript");
    expect(config).toContain("technologies:\n  - nestjs\n  - vue");
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({ languages: ["typescript"], technologies: ["nestjs", "vue"] });
  });

  it("rejects unknown profile overrides before creating project state", async () => {
    const root = await fixture(); process.chdir(root);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    await expect(runCli(["node", "harnix", "init", "--technologies", "unknown-tech"], { environment: { USERNAME: "tam" } })).resolves.toBe(2);
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_configure_multiple_user_global_platforms_when_automation_flags_are_used", async () => {
    const root = await fixture(); process.chdir(root);
    const home = await temporaryUserHome();
    const programOptions = {
      commandLookup: async () => true,
      environment: { CODEX_HOME: join(home, "codex") },
      homeResolver: async () => home,
    };
    await createProgram(programOptions).parseAsync(["node", "harnix", "init", "--yes", "--user", "tam", "--languages", "vue"], { from: "node" });
    await createProgram(programOptions).parseAsync(["node", "harnix", "setup", "--kiro", "--codex"], { from: "node" });
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("- vue");
    await expect(readFile(join(home, ".kiro", "hooks", "harnix-context.json"), "utf8")).resolves.toContain("UserPromptSubmit");
    await expect(readFile(join(home, "codex", "config.toml"), "utf8")).resolves.toContain("UserPromptSubmit");
    await expect(readFile(join(root, ".codex", "config.toml"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("should_restore_deleted_user_global_integrations_only_when_global_restore_is_explicit", async () => {
    const root = await fixture(); const home = await temporaryUserHome(); process.chdir(root);
    const programOptions = {
      commandLookup: async () => true,
      environment: { CODEX_HOME: join(home, "codex") },
      homeResolver: async () => home,
    };
    await createProgram(programOptions).parseAsync(["node", "harnix", "setup", "--kiro"], { from: "node" });
    await rm(join(home, ".kiro", "steering", "harnix.md"));

    await createProgram(programOptions).parseAsync(["node", "harnix", "update", "--global"], { from: "node" });

    await expect(readFile(join(home, ".kiro", "steering", "harnix.md"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await createProgram(programOptions).parseAsync(["node", "harnix", "update", "--global", "--restore"], { from: "node" });

    await expect(readFile(join(home, ".kiro", "steering", "harnix.md"), "utf8")).resolves.toContain("Harnix activation guard");
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("should_preview_then_uninstall_only_explicit_user_global_platforms", async () => {
    const root = await fixture(); const home = await temporaryUserHome(); process.chdir(root);
    const programOptions = {
      commandLookup: async () => true,
      environment: { CODEX_HOME: join(home, "codex") },
      homeResolver: async () => home,
    };
    await createProgram(programOptions).parseAsync(["node", "harnix", "setup", "--kiro"], { from: "node" });
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "uninstall", "--global", "--kiro"], programOptions)).resolves.toBe(2);
    const preview = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as { scope: string; platforms: Array<{ platform: string; confirmationRequired: boolean }> };
    expect(preview).toMatchObject({ scope: "user", platforms: [{ platform: "kiro", confirmationRequired: true }] });
    await expect(readFile(join(home, ".kiro", "steering", "harnix.md"), "utf8")).resolves.toContain("Harnix activation guard");

    stdout.mockClear();
    await expect(runCli(["node", "harnix", "uninstall", "--global", "--kiro", "--yes"], programOptions)).resolves.toBe(0);
    await expect(readFile(join(home, ".kiro", "steering", "harnix.md"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("should_initialize_without_confirmation_or_user_flags", async () => {
    const root = await fixture(); process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await createProgram({ environment: { USERNAME: "interactive" }, interactive: true }).parseAsync(["node", "harnix", "init"], { from: "node" });
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("developer: interactive");
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({
      scope: "project",
      status: "initialized",
      developer: "interactive",
      created: expect.arrayContaining([".harnix/config.yaml", ".harnix/workflow.md", "AGENTS.md"]),
    });
  });
  it("should_detect_languages_when_init_omits_all_options", async () => {
    const root = await fixture(); process.chdir(root);
    await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: { react: "latest" } }));
    await createProgram({ environment: { USERNAME: "tam" }, interactive: false }).parseAsync(["node", "harnix", "init"], { from: "node" });
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("- react-web");
  });
  it("should_emit_doctor_json_by_default", async () => {
    const root = await fixture(); const home = await temporaryUserHome(); process.chdir(root);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--yes", "--user", "tam"], { from: "node" });
    await expect(createProgram({ commandLookup: async () => true, environment: { CODEX_HOME: join(home, "codex") }, homeResolver: async () => home, interactive: false }).parseAsync(["node", "harnix", "doctor"], { from: "node" })).resolves.toBeDefined();
  });
  it("should_emit_one_deterministic_doctor_json_document_to_stdout", async () => {
    const root = await fixture(); const home = await temporaryUserHome(); process.chdir(root);
    await initializeProject({ developer: "tam", root, yes: true });
    await refreshRepoMap({ root });
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const programOptions = { commandLookup: async () => true, environment: { CODEX_HOME: join(home, "codex") }, homeResolver: async () => home };

    await expect(runCli(["node", "harnix", "doctor"], programOptions)).resolves.toBe(0);
    const first = stdout.mock.calls.map((call) => String(call[0])).join("");
    stdout.mockClear();
    await expect(runCli(["node", "harnix", "doctor"], programOptions)).resolves.toBe(0);
    const second = stdout.mock.calls.map((call) => String(call[0])).join("");

    expect(first).toBe(second);
    expect(first).toMatch(/^\{[\s\S]*\}\n$/u);
    expect(JSON.parse(first)).toEqual(expect.objectContaining({ generator: "harnix", schemaVersion: 2, ok: true, project: { status: "ready", findings: [] }, summary: { errors: 0, warnings: 0, fixed: 0 } }));
  });
  it("should_use_validated_hook_event_cwd_when_context_is_invoked", async () => {
    const root = await fixture(); const elsewhere = await fixture();
    process.chdir(root);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--yes", "--user", "tam"], { from: "node" });
    process.chdir(elsewhere);
    const output = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await createProgram({ interactive: false, hookEventInput: async () => JSON.stringify({ cwd: root }) }).parseAsync(["node", "harnix", "context", "--platform", "codex"], { from: "node" });

    expect(output).toHaveBeenCalledWith(expect.stringContaining("hookSpecificOutput"));
  });
  it("should_dispatch_hidden_workflow_actions_from_flags", async () => {
    const root = await fixture(); process.chdir(root);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--user", "tam"], { from: "node" });
    const output = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "workflow", "--inspect"], { from: "node" });

    expect(JSON.parse(output.mock.calls.map((call) => String(call[0])).join(""))).toEqual({ activeTask: null, contextDrift: { state: "not-recorded", changes: [], selectionChanges: [] } });
  });
  it("should_recognize_the_hidden_learning_action_and_require_an_active_finishing_task", async () => {
    const root = await fixture(); process.chdir(root);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--user", "tam"], { from: "node" });
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const workflowInput = async () => JSON.stringify({ candidate: { id: "learning", statement: "statement", sourceTaskIds: ["a", "b"], evidenceIds: ["e1", "e2"] } });

    await expect(runCli(["node", "harnix", "workflow", "--learn"], { interactive: false, workflowInput })).resolves.toBe(2);

    const message = stderr.mock.calls.flatMap((call) => call).join("");
    expect(message).toContain("active task");
    expect(message).not.toContain("unknown option");
    expect(stdout.mock.calls.map((call) => String(call[0])).join("")).toBe("");
  });
  it("should_cancel_an_active_task_from_a_bounded_json_envelope", async () => {
    const root = await fixture(); process.chdir(root);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--user", "tam"], { from: "node" });
    const timestamp = "2026-08-19T00:00:00.000Z";
    const planning = {
      generator: "harnix", schemaVersion: 2, id: "20260819-000000-cancel-me", title: "Cancel me", mode: "lite", status: "planning", checkpoint: "planning",
      goal: "Stop safely", nonGoals: [], acceptanceCriteria: [{ id: "a", text: "done", status: "pending", evidenceIds: [] }], relevantPaths: [], relevantSpecs: [],
      validationPlan: [{ id: "check", description: "verify", scope: "focused", required: true, criterionIds: ["a"], inputs: ["@task-contract"] }], evidence: [], createdAt: timestamp, updatedAt: timestamp,
    };
    const output = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await createProgram({ interactive: false, workflowInput: async () => JSON.stringify({ task: planning }) }).parseAsync(["node", "harnix", "workflow", "--save"], { from: "node" });
    output.mockClear();

    await createProgram({ interactive: false, workflowInput: async () => JSON.stringify({ reason: "Người dùng dừng task.", authorizedBy: "user" }) }).parseAsync(["node", "harnix", "workflow", "--cancel"], { from: "node" });

    expect(JSON.parse(output.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({ status: "cancelled", checkpoint: "cancelling" });
    await writeFile(join(root, ".harnix", "tasks", ".active"), `${planning.id}\n`);
    output.mockClear();
    const ttyDescriptor = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
    Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: true });
    try {
      await createProgram({ interactive: false }).parseAsync(["node", "harnix", "workflow", "--cancel"], { from: "node" });
    } finally {
      if (ttyDescriptor) Object.defineProperty(process.stdin, "isTTY", ttyDescriptor);
      else Reflect.deleteProperty(process.stdin, "isTTY");
    }

    expect(JSON.parse(output.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({ status: "cancelled", checkpoint: "cancelling" });
    await expect(readFile(join(root, ".harnix", "tasks", ".active"), "utf8")).resolves.toBe("");
  });
  it("should_return_usage_exit_without_stack_when_public_input_is_invalid", async () => {
    const root = await fixture(); process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "mem", "--limit", "nope"])).resolves.toBe(2);

    const message = stderr.mock.calls.flatMap((call) => call).join("");
    expect(message).toContain("positive integer");
    expect(message).not.toContain("Error:");
    expect(message).not.toContain(root);
    const output = stdout.mock.calls.map((call) => String(call[0])).join("");
    expect(output).toMatch(/^\{[^\r\n]+\}\n$/u);
    expect(JSON.parse(output)).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      ok: false,
      error: { exitCode: 2, message: "--limit must be a positive integer." },
    });
  });
  it("should_redact_project_paths_when_command_state_is_missing", async () => {
    const root = await fixture(); process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "mem"])).resolves.toBe(2);

    const message = stderr.mock.calls.flatMap((call) => call).join("");
    expect(message).toContain("[PROJECT]");
    expect(message).not.toContain(root);
    expect(message).not.toContain("Error:");
    const errorDocument = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as { error: { message: string } };
    expect(errorDocument.error.message).toContain("[PROJECT]");
    expect(errorDocument.error.message).not.toContain(root);
  });
  it("should_return_exit_one_and_stderr_warning_for_actionable_setup_readiness", async () => {
    const root = await fixture(); const home = await temporaryUserHome(); process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const programOptions = { commandLookup: async () => false, environment: { CODEX_HOME: join(home, "codex") }, homeResolver: async () => home };

    await expect(runCli(["node", "harnix", "setup", "--kiro"], programOptions)).resolves.toBe(1);

    const result = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as { platforms: Array<{ readiness: string }> };
    expect(result.platforms).toEqual([expect.objectContaining({ readiness: "binary-unavailable" })]);
    const warning = stderr.mock.calls.map((call) => String(call[0])).join("");
    expect(warning).toContain("not found on PATH");
    expect(warning).not.toContain(home);
  });
  it("should_inject_available_version_lookup_into_the_public_upgrade_result", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "upgrade"], { availableVersionLookup: async () => "9.9.9" })).resolves.toBe(0);

    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({ installed: expect.any(String), available: "9.9.9", applied: false });
  });
  it("should_redact_unquoted_windows_and_unix_user_paths_from_lifecycle_errors", () => {
    const windowsPath = "C:\\Users\\Tam Nguyen\\.kiro\\harnix\\managed.lock";
    const unixPath = "/home/tam nguyen/.codex/harnix/managed.lock";
    const message = redactPublicErrorMessage(new Error(`Timed out waiting for Harnix locks: ${windowsPath}; ${unixPath}`));

    expect(message).toContain("[PATH]");
    expect(message).not.toContain(windowsPath);
    expect(message).not.toContain(unixPath);
  });
  it.each([
    ["UNC", "\\\\server\\private-share\\users\\tam\\secret.txt"],
    ["Windows device", "\\\\?\\C:\\Users\\Tam Nguyen\\secret.txt"],
    ["Windows forward slash", "C:/Users/Tam Nguyen/secret.txt"],
    ["macOS user", "/Users/tam nguyen/secret.txt"],
  ])("should_redact_an_unquoted_%s_machine_path", (_kind, path) => {
    const message = redactPublicErrorMessage(new Error(`Lifecycle failure at ${path}`));

    expect(message).toContain("[PATH]");
    expect(message).not.toContain(path);
  });
  it("should_report_safe_partial_rollback_paths_for_global_lifecycle_failures", () => {
    const message = redactPublicErrorMessage(new GlobalManagedTransactionError(
      "Global managed reconciliation failed; attempted writes were rolled back conservatively.",
      { partial: ["~/.kiro/steering/harnix.md"], restored: ["~/.kiro/hooks/harnix-context.json"] },
      new Error("concurrent editor"),
    ));

    expect(message).toContain("Partial rollback preserved concurrent edits at: ~/.kiro/steering/harnix.md.");
    expect(message).not.toContain("concurrent editor");
  });
  it("should_map_doctor_warning_and_corrupt_state_to_frozen_exit_codes", async () => {
    const root = await fixture(); const home = await temporaryUserHome(); process.chdir(root);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--yes", "--user", "tam"], { from: "node" });
    await rm(join(root, ".harnix", "workflow.md"));
    const programOptions = { commandLookup: async () => true, environment: { CODEX_HOME: join(home, "codex") }, homeResolver: async () => home };

    await expect(runCli(["node", "harnix", "doctor"], programOptions)).resolves.toBe(1);
    await writeFile(join(root, ".harnix", "config.yaml"), "not: [valid");
    await expect(runCli(["node", "harnix", "doctor"], programOptions)).resolves.toBe(2);
  });
  it("should_return_success_when_help_is_requested", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await expect(runCli(["node", "harnix", "--help"])).resolves.toBe(0);
  });
});
