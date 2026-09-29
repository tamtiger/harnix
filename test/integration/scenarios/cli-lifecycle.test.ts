import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createProgram, runCli } from "src/cli-program.js";
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

describe.sequential("CLI lifecycle commands", () => {
  it("accepts independent language and technology overrides", async () => {
    const root = await fixture();
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await createProgram({ environment: { USERNAME: "tam" } }).parseAsync(
      ["node", "harnix", "init", "--languages", "typescript", "--technologies", "nestjs,vue"],
      { from: "node" },
    );
    const config = await readFile(join(root, ".harnix", "config.yaml"), "utf8");
    expect(config).toContain("languages:\n  - typescript");
    expect(config).toContain("technologies:\n  - nestjs\n  - vue");
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({
      languages: ["typescript"],
      technologies: ["nestjs", "vue"],
    });
  });

  it("rejects unknown profile overrides before creating project state", async () => {
    const root = await fixture();
    process.chdir(root);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    await expect(
      runCli(["node", "harnix", "init", "--technologies", "unknown-tech"], { environment: { USERNAME: "tam" } }),
    ).resolves.toBe(2);
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_configure_multiple_user_global_platforms_when_automation_flags_are_used", async () => {
    const root = await fixture();
    process.chdir(root);
    const home = await temporaryUserHome();
    const programOptions = {
      commandLookup: async () => true,
      environment: { CODEX_HOME: join(home, "codex") },
      homeResolver: async () => home,
    };
    await createProgram(programOptions).parseAsync(
      ["node", "harnix", "init", "--yes", "--user", "tam", "--languages", "vue"],
      { from: "node" },
    );
    await createProgram(programOptions).parseAsync(["node", "harnix", "setup", "--kiro", "--codex"], { from: "node" });
    await createProgram(programOptions).parseAsync(["node", "harnix", "setup", "--claude"], { from: "node" });
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("- vue");
    await expect(readFile(join(home, ".kiro", "hooks", "harnix-context.json"), "utf8")).resolves.toContain(
      "UserPromptSubmit",
    );
    await expect(readFile(join(home, "codex", "config.toml"), "utf8")).resolves.toContain("UserPromptSubmit");
    await expect(readFile(join(home, ".claude", "settings.json"), "utf8")).resolves.toContain(
      "harnix context --platform claude",
    );
    await expect(readFile(join(root, ".codex", "config.toml"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("should_restore_deleted_user_global_integrations_only_when_global_restore_is_explicit", async () => {
    const root = await fixture();
    const home = await temporaryUserHome();
    process.chdir(root);
    const programOptions = {
      commandLookup: async () => true,
      environment: { CODEX_HOME: join(home, "codex") },
      homeResolver: async () => home,
    };
    await createProgram(programOptions).parseAsync(["node", "harnix", "setup", "--kiro"], { from: "node" });
    await rm(join(home, ".kiro", "steering", "harnix.md"));

    await createProgram(programOptions).parseAsync(["node", "harnix", "update", "--global"], { from: "node" });

    await expect(readFile(join(home, ".kiro", "steering", "harnix.md"), "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });
    await createProgram(programOptions).parseAsync(["node", "harnix", "update", "--global", "--restore"], {
      from: "node",
    });

    await expect(readFile(join(home, ".kiro", "steering", "harnix.md"), "utf8")).resolves.toContain(
      "Harnix activation guard",
    );
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("should_preview_then_uninstall_only_explicit_user_global_platforms", async () => {
    const root = await fixture();
    const home = await temporaryUserHome();
    process.chdir(root);
    const programOptions = {
      commandLookup: async () => true,
      environment: { CODEX_HOME: join(home, "codex") },
      homeResolver: async () => home,
    };
    await createProgram(programOptions).parseAsync(["node", "harnix", "setup", "--kiro"], { from: "node" });
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "uninstall", "--global", "--kiro"], programOptions)).resolves.toBe(2);
    const preview = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      scope: string;
      platforms: Array<{ platform: string; confirmationRequired: boolean }>;
    };
    expect(preview).toMatchObject({ scope: "user", platforms: [{ platform: "kiro", confirmationRequired: true }] });
    await expect(readFile(join(home, ".kiro", "steering", "harnix.md"), "utf8")).resolves.toContain(
      "Harnix activation guard",
    );

    stdout.mockClear();
    await expect(runCli(["node", "harnix", "uninstall", "--global", "--kiro", "--yes"], programOptions)).resolves.toBe(
      0,
    );
    await expect(readFile(join(home, ".kiro", "steering", "harnix.md"), "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("should_initialize_without_confirmation_or_user_flags", async () => {
    const root = await fixture();
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    await createProgram({ environment: { USERNAME: "interactive" }, interactive: true }).parseAsync(
      ["node", "harnix", "init"],
      { from: "node" },
    );
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("developer: interactive");
    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({
      scope: "project",
      status: "initialized",
      developer: "interactive",
      created: expect.arrayContaining([".harnix/config.yaml", ".harnix/workflow.md", "AGENTS.md"]),
    });
  });
  it("should_detect_languages_when_init_omits_all_options", async () => {
    const root = await fixture();
    process.chdir(root);
    await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: { react: "latest" } }));
    await createProgram({ environment: { USERNAME: "tam" }, interactive: false }).parseAsync(
      ["node", "harnix", "init"],
      { from: "node" },
    );
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("- react-web");
  });

  it("should_return_exit_one_and_stderr_warning_for_actionable_setup_readiness", async () => {
    const root = await fixture();
    const home = await temporaryUserHome();
    process.chdir(root);
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const programOptions = {
      commandLookup: async () => false,
      environment: { CODEX_HOME: join(home, "codex") },
      homeResolver: async () => home,
    };

    await expect(runCli(["node", "harnix", "setup", "--kiro"], programOptions)).resolves.toBe(1);

    const result = JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join("")) as {
      platforms: Array<{ readiness: string }>;
    };
    expect(result.platforms).toEqual([expect.objectContaining({ readiness: "binary-unavailable" })]);
    const warning = stderr.mock.calls.map((call) => String(call[0])).join("");
    expect(warning).toContain("not found on PATH");
    expect(warning).not.toContain(home);
  });
  it("should_inject_available_version_lookup_into_the_public_upgrade_result", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await expect(runCli(["node", "harnix", "upgrade"], { availableVersionLookup: async () => "9.9.9" })).resolves.toBe(
      0,
    );

    expect(JSON.parse(stdout.mock.calls.map((call) => String(call[0])).join(""))).toMatchObject({
      installed: expect.any(String),
      available: "9.9.9",
      applied: false,
    });
  });
});
