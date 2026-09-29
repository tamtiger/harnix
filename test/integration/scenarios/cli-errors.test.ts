import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createProgram, redactPublicErrorMessage, runCli } from "src/cli-program.js";
import { GlobalManagedTransactionError } from "src/utils/global-managed-files.js";
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
  it("should_redact_project_paths_when_command_state_is_missing", async () => {
    const root = await fixture();
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "mem"])).resolves.toBe(2);

    const message = stderr.mock.calls.flatMap((call) => call).join("");
    expect(message).toContain("[PROJECT]");
    expect(message).not.toContain(root);
    expect(message).not.toContain("Error:");
    const errorDocument = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      error: { message: string };
    };
    expect(errorDocument.error.message).toContain("[PROJECT]");
    expect(errorDocument.error.message).not.toContain(root);
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
