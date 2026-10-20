import { rm, writeFile } from "node:fs/promises";
import { join, sep } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { createProgram, redactPublicErrorMessage, runCli } from "src/cli-program.js";
import { GlobalManagedTransactionError } from "src/core/global/managed-files.js";
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

describe.sequential("CLI errors and exit codes", () => {
  it("should_return_usage_exit_without_stack_when_public_input_is_invalid", async () => {
    const root = await fixture();
    process.chdir(root);
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
  it.each([
    ["repo-map without an action flag", ["repo-map"]],
    ["repo-map with an unknown flag", ["repo-map", "--bogus"]],
    ["repo-map --query without a value", ["repo-map", "--query"]],
    ["a command that needs a project", ["mem"]],
    ["an invalid argument", ["mem", "--limit", "nope"]],
  ])("should_return_the_process_exit_the_public_error_envelope_declares_for_%s", async (_name, args) => {
    const root = await fixture();
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    const exitCode = await runCli(["node", "harnix", ...args]);

    const document = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      error: { exitCode: number; message: string };
      ok: boolean;
    };
    expect(document.ok).toBe(false);
    expect(exitCode).toBe(document.error.exitCode);
    expect(stderr.mock.calls.flatMap((call) => call).join("")).toContain(document.error.message);
  });
  it("should_explain_a_missing_project_without_exposing_the_path_when_a_command_needs_one", async () => {
    const root = await fixture();
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "mem"])).resolves.toBe(2);

    const message = stderr.mock.calls.flatMap((call) => call).join("");
    expect(message).toContain("No initialized Harnix project found from the current directory.");
    expect(message).not.toContain(root);
    expect(message).not.toContain("Error:");
    const errorDocument = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      error: { message: string };
    };
    expect(errorDocument.error.message).toContain("No initialized Harnix project found");
    expect(errorDocument.error.message).not.toContain(root);
  });

  it("should_redact_the_project_path_from_an_error_raised_by_a_real_command", async () => {
    const root = await fixture();
    await initializeProject({ developer: "tam", root, yes: true });
    process.chdir(root);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const code = await runCli(["node", "harnix", "workflow", "--save", "--file", "missing.json", "--brief"]);

    const message = stderr.mock.calls.flatMap((call) => call).join("");
    expect(code).not.toBe(0);
    expect(message).toContain("[PROJECT]");
    expect(message).not.toContain(process.cwd());
    expect(message).not.toContain(root);
  });

  it("should_redact_the_working_directory_from_a_raw_filesystem_error", async () => {
    const root = await fixture();
    process.chdir(root);
    const cwd = process.cwd();

    const message = redactPublicErrorMessage(
      new Error(`ENOENT: no such file or directory, realpath '${cwd}${sep}.harnix'`),
    );

    expect(message).toContain("[PROJECT]");
    expect(message).not.toContain(cwd);
  });

  it("should_name_the_project_not_a_generic_path_when_the_working_directory_is_unquoted", async () => {
    const root = await fixture();
    process.chdir(root);
    const cwd = process.cwd();

    // Unquoted, so only the working-directory replacement (not the quoted-path rule) can turn it into [PROJECT].
    const message = redactPublicErrorMessage(new Error(`EPERM: operation not permitted, mkdir ${cwd}${sep}x`));

    expect(message).toBe("EPERM: operation not permitted, mkdir [PROJECT]" + sep + "x");
  });

  it("should_redact_unquoted_windows_and_unix_user_paths_from_lifecycle_errors", () => {
    const windowsPath = "C:\\Users\\Tam Nguyen\\.kiro\\harnix\\managed.lock";
    const unixPath = "/home/tam nguyen/.codex/harnix/managed.lock";
    const message = redactPublicErrorMessage(
      new Error(`Timed out waiting for Harnix locks: ${windowsPath}; ${unixPath}`),
    );

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
    const message = redactPublicErrorMessage(
      new GlobalManagedTransactionError(
        "Global managed reconciliation failed; attempted writes were rolled back conservatively.",
        { partial: ["~/.kiro/steering/harnix.md"], restored: ["~/.kiro/hooks/harnix-context.json"] },
        new Error("concurrent editor"),
      ),
    );

    expect(message).toContain("Partial rollback preserved concurrent edits at: ~/.kiro/steering/harnix.md.");
    expect(message).not.toContain("concurrent editor");
  });
  it("should_map_doctor_warning_and_corrupt_state_to_frozen_exit_codes", async () => {
    const root = await fixture();
    const home = await temporaryUserHome();
    process.chdir(root);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--yes", "--user", "tam"], {
      from: "node",
    });
    await rm(join(root, ".harnix", "workflow.md"));
    const programOptions = {
      commandLookup: async () => true,
      environment: { CODEX_HOME: join(home, "codex") },
      homeResolver: async () => home,
    };

    await expect(runCli(["node", "harnix", "doctor"], programOptions)).resolves.toBe(1);
    await writeFile(join(root, ".harnix", "config.yaml"), "not: [valid");
    await expect(runCli(["node", "harnix", "doctor"], programOptions)).resolves.toBe(2);
  });
  it("should_return_success_when_help_is_requested", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await expect(runCli(["node", "harnix", "--help"])).resolves.toBe(0);
  });
});
