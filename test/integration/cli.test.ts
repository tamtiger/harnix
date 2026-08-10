import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer", () => ({ default: { prompt: vi.fn() } }));

import { createProgram, runCli } from "../../src/cli.js";
import inquirer from "inquirer";
import { useTemporaryRepositories } from "../helpers/temporary-repository.js";

const originalCwd = process.cwd();
const originalExitCode = process.exitCode;
const fixture = useTemporaryRepositories("harnix-cli-test-");
afterEach(() => { process.chdir(originalCwd); process.exitCode = originalExitCode; vi.restoreAllMocks(); });

describe.sequential("CLI", () => {
  it("should_configure_multiple_platforms_when_automation_flags_are_used", async () => {
    const root = await fixture(); process.chdir(root);
    await createProgram().parseAsync(["node", "harnix", "init", "--yes", "--user", "tam", "--languages", "vue"], { from: "node" });
    await createProgram().parseAsync(["node", "harnix", "setup", "--kiro", "--codex"], { from: "node" });
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("- vue");
    await expect(readFile(join(root, ".codex", "hooks.json"), "utf8")).resolves.toContain("UserPromptSubmit");
  });
  it("should_use_interactive_answers_when_yes_is_omitted", async () => {
    const root = await fixture(); process.chdir(root);
    vi.mocked(inquirer.prompt).mockResolvedValueOnce({ developer: "interactive", languages: "go,vue" });
    await createProgram({ interactive: true }).parseAsync(["node", "harnix", "init"], { from: "node" });
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("developer: interactive");
  });
  it("should_detect_languages_without_prompt_when_yes_omits_languages", async () => {
    const root = await fixture(); process.chdir(root);
    await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: { react: "latest" } }));
    vi.mocked(inquirer.prompt).mockClear();
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--yes", "--user", "tam"], { from: "node" });
    expect(vi.mocked(inquirer.prompt)).not.toHaveBeenCalled();
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("- react-web");
  });
  it("should_accept_doctor_json_when_requested", async () => {
    const root = await fixture(); process.chdir(root);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--yes", "--user", "tam"], { from: "node" });
    await expect(createProgram({ interactive: false }).parseAsync(["node", "harnix", "doctor", "--json"], { from: "node" })).resolves.toBeDefined();
  });
  it("should_use_validated_hook_event_cwd_when_internal_context_is_invoked", async () => {
    const root = await fixture(); const elsewhere = await fixture();
    process.chdir(root);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--yes", "--user", "tam"], { from: "node" });
    process.chdir(elsewhere);
    const output = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await createProgram({ interactive: false, hookEventInput: async () => JSON.stringify({ cwd: root }) }).parseAsync(["node", "harnix", "internal", "context", "--platform", "codex"], { from: "node" });

    expect(output).toHaveBeenCalledWith(expect.stringContaining("hookSpecificOutput"));
  });
  it("should_return_usage_exit_without_stack_when_public_input_is_invalid", async () => {
    const root = await fixture(); process.chdir(root);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "mem", "--limit", "nope"])).resolves.toBe(2);

    const message = stderr.mock.calls.flatMap((call) => call).join("");
    expect(message).toContain("positive integer");
    expect(message).not.toContain("Error:");
    expect(message).not.toContain(root);
  });
  it("should_redact_project_paths_when_command_state_is_missing", async () => {
    const root = await fixture(); process.chdir(root);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "mem"])).resolves.toBe(2);

    const message = stderr.mock.calls.flatMap((call) => call).join("");
    expect(message).toContain("[PROJECT]");
    expect(message).not.toContain(root);
    expect(message).not.toContain("Error:");
  });
  it("should_map_doctor_warning_and_corrupt_state_to_frozen_exit_codes", async () => {
    const root = await fixture(); process.chdir(root);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await createProgram({ interactive: false }).parseAsync(["node", "harnix", "init", "--yes", "--user", "tam"], { from: "node" });
    await rm(join(root, ".harnix", "workflow.md"));

    await expect(runCli(["node", "harnix", "doctor", "--json"])).resolves.toBe(1);
    await writeFile(join(root, ".harnix", "config.yaml"), "not: [valid");
    await expect(runCli(["node", "harnix", "doctor", "--json"])).resolves.toBe(2);
  });
  it("should_return_success_when_help_is_requested", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await expect(runCli(["node", "harnix", "--help"])).resolves.toBe(0);
  });
});
