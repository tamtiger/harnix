import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { setupPlatforms } from "src/commands/setup.js";
import { packageVersion } from "src/version.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryRepository = useTemporaryRepositories("harnix-global-setup-project-");
const temporaryUserHome = useTemporaryUserHomes("harnix-global-setup-home-");

function fakeEnvironment(home: string): Record<string, string> {
  return { CODEX_HOME: join(home, "codex-home") };
}

describe("setupPlatforms user-global lifecycle", () => {
  it("should_fail_closed_in_test_mode_when_no_fake_home_is_injected", async () => {
    await expect(setupPlatforms({ platforms: ["kiro"] })).rejects.toThrow("injected homeResolver");
  });

  it("should_fail_closed_in_test_mode_when_no_launcher_lookup_is_injected", async () => {
    const home = await temporaryUserHome();

    await expect(
      setupPlatforms({
        environment: fakeEnvironment(home),
        homeResolver: async () => home,
        platforms: ["kiro"],
      }),
    ).rejects.toThrow("injected commandLookup");

    await expect(access(join(home, ".kiro"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_install_all_selected_platforms_in_an_injected_home_without_requiring_a_project", async () => {
    const home = await temporaryUserHome();
    const nonHarnixDirectory = await temporaryRepository();
    const result = await setupPlatforms({
      commandLookup: async () => true,
      environment: fakeEnvironment(home),
      homeResolver: async () => home,
      platforms: ["kiro", "antigravity", "codex"],
    });

    expect(result.scope).toBe("user");
    expect(result.platforms.map((platform) => platform.platform)).toEqual(["antigravity", "codex", "kiro"]);
    expect(JSON.stringify(result)).not.toContain(home);
    await expect(readFile(join(home, ".kiro", "hooks", "harnix-context.json"), "utf8")).resolves.toContain(
      '"UserPromptSubmit"',
    );
    await expect(
      readFile(join(home, ".gemini", "config", "plugins", "harnix", "plugin.json"), "utf8"),
    ).resolves.toContain('"name": "harnix"');
    await expect(
      readFile(join(home, ".gemini", "antigravity-cli", "plugins", "harnix", "hooks.json"), "utf8"),
    ).resolves.toContain('"PreInvocation"');
    await expect(readFile(join(home, ".agents", "skills", "harnix-implement", "SKILL.md"), "utf8")).resolves.toContain(
      `metadata:\n  version: "${packageVersion}"`,
    );
    await expect(readFile(join(home, ".agents", "skills", "harnix-implement", "SKILL.md"), "utf8")).resolves.toContain(
      "harnix workflow --preflight",
    );
    await expect(readFile(join(home, "codex-home", "config.toml"), "utf8")).resolves.toContain(
      "[[hooks.UserPromptSubmit]]",
    );
    await expect(access(join(nonHarnixDirectory, ".harnix", "config.yaml"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(nonHarnixDirectory, ".kiro"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(nonHarnixDirectory, ".gemini"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(nonHarnixDirectory, ".codex"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_install_the_three_owned_claude_fragments_and_preserve_unrelated_user_settings", async () => {
    const home = await temporaryUserHome();
    await mkdir(join(home, ".claude"), { recursive: true });
    await writeFile(join(home, ".claude", "CLAUDE.md"), "# My notes\n\nAlways use pnpm.\n", "utf8");
    await writeFile(
      join(home, ".claude", "settings.json"),
      JSON.stringify(
        {
          hooks: { UserPromptSubmit: [{ hooks: [{ type: "command", command: "my-own-hook" }] }] },
          theme: "dark",
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );
    await writeFile(join(home, ".claude.json"), JSON.stringify({ mcpServers: {} }) + "\n", "utf8");

    const result = await setupPlatforms({
      commandLookup: async () => true,
      environment: fakeEnvironment(home),
      homeResolver: async () => home,
      platforms: ["claude"],
    });

    const memory = await readFile(join(home, ".claude", "CLAUDE.md"), "utf8");
    const settings = JSON.parse(await readFile(join(home, ".claude", "settings.json"), "utf8"));

    expect(result.platforms.map((platform) => platform.platform)).toEqual(["claude"]);
    expect(JSON.stringify(result)).not.toContain(home);
    await expect(readFile(join(home, ".claude", "skills", "harnix-implement", "SKILL.md"), "utf8")).resolves.toContain(
      `metadata:\n  version: "${packageVersion}"`,
    );
    expect(memory).toContain("Always use pnpm.");
    expect(memory).toContain("<!-- harnix:begin -->");
    expect(memory).toContain("harnix/config.yaml");
    expect(settings.theme).toBe("dark");
    expect(settings.hooks.UserPromptSubmit).toHaveLength(2);
    expect(settings.hooks.UserPromptSubmit[0]).toEqual({ hooks: [{ type: "command", command: "my-own-hook" }] });
    expect(settings.hooks.UserPromptSubmit[1]).toEqual({
      hooks: [{ command: "harnix context --platform claude", timeout: 5, type: "command" }],
    });
    await expect(readFile(join(home, ".claude.json"), "utf8")).resolves.toBe(JSON.stringify({ mcpServers: {} }) + "\n");
  });

  it("should_reinstall_claude_idempotently_without_duplicating_the_prompt_hook", async () => {
    const home = await temporaryUserHome();
    const options = {
      commandLookup: async () => true,
      environment: fakeEnvironment(home),
      homeResolver: async () => home,
      platforms: ["claude"] as const,
    };

    await setupPlatforms({ ...options, platforms: [...options.platforms] });
    const second = await setupPlatforms({ ...options, platforms: [...options.platforms] });
    const settings = JSON.parse(await readFile(join(home, ".claude", "settings.json"), "utf8"));

    expect(second.platforms[0]?.created).toEqual([]);
    expect(second.platforms[0]?.unchanged.length).toBeGreaterThan(0);
    expect(settings.hooks.UserPromptSubmit).toHaveLength(1);
  });

  it("should_not_validate_an_unselected_codex_home_when_installing_only_kiro", async () => {
    const home = await temporaryUserHome();

    const result = await setupPlatforms({
      commandLookup: async () => true,
      environment: { CODEX_HOME: "relative-codex-home" },
      homeResolver: async () => home,
      platforms: ["kiro"],
    });

    expect(result.platforms).toEqual([expect.objectContaining({ platform: "kiro", readiness: "installed" })]);
    await expect(access(join(home, ".kiro", "hooks", "harnix-context.json"))).resolves.toBeUndefined();
    await expect(access(join(home, ".agents"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_preview_logical_targets_without_writing_or_creating_a_manifest", async () => {
    const home = await temporaryUserHome();
    const result = await setupPlatforms({
      commandLookup: async () => true,
      dryRun: true,
      environment: fakeEnvironment(home),
      homeResolver: async () => home,
      platforms: ["kiro", "codex"],
    });

    expect(result.scope).toBe("user");
    expect(result.platforms.flatMap((platform) => platform.created)).toEqual(
      expect.arrayContaining([
        "~/.kiro/hooks/harnix-context.json",
        "~/.agents/skills/harnix-implement/SKILL.md",
        "$CODEX_HOME/config.toml#codex-global-context-hook",
      ]),
    );
    expect(JSON.stringify(result)).not.toContain(home);
    await expect(access(join(home, ".kiro"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(home, ".agents"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(home, "codex-home"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_remain_byte_idempotent_when_two_projects_share_one_user_home", async () => {
    const home = await temporaryUserHome();
    const firstProject = await temporaryRepository();
    const secondProject = await temporaryRepository();
    const options = {
      commandLookup: async () => true,
      environment: fakeEnvironment(home),
      homeResolver: async () => home,
      platforms: ["kiro", "antigravity", "codex"] as const,
    };
    await setupPlatforms(options);
    const first = await Promise.all([
      readFile(join(home, ".kiro", "harnix", "managed.json"), "utf8"),
      readFile(join(home, ".gemini", "config", "plugins", "harnix", ".managed.json"), "utf8"),
      readFile(join(home, "codex-home", "harnix", "managed.json"), "utf8"),
      readFile(join(home, ".agents", "harnix", "managed.json"), "utf8"),
    ]);

    // Project identity is intentionally not an input to the global lifecycle.
    expect(firstProject).not.toBe(secondProject);
    const rerun = await setupPlatforms(options);
    const second = await Promise.all([
      readFile(join(home, ".kiro", "harnix", "managed.json"), "utf8"),
      readFile(join(home, ".gemini", "config", "plugins", "harnix", ".managed.json"), "utf8"),
      readFile(join(home, "codex-home", "harnix", "managed.json"), "utf8"),
      readFile(join(home, ".agents", "harnix", "managed.json"), "utf8"),
    ]);

    expect(second).toEqual(first);
    expect(rerun.platforms.flatMap((platform) => platform.updated)).toEqual([]);
    expect(rerun.platforms.flatMap((platform) => platform.created)).toEqual([]);
  });

  it("should_preserve_untracked_user_content_and_report_pending_or_unknown_readiness", async () => {
    const home = await temporaryUserHome();
    await mkdir(join(home, "codex-home"), { recursive: true });
    await writeFile(join(home, "codex-home", "AGENTS.md"), "# User instructions\n\nKeep this text.\n");
    await writeFile(
      join(home, "codex-home", "hooks.json"),
      `${JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [{ type: "command", command: "user-context" }] }] } }, null, 2)}\n`,
    );
    const result = await setupPlatforms({
      commandLookup: async () => true,
      environment: fakeEnvironment(home),
      homeResolver: async () => home,
      platforms: ["antigravity", "codex"],
    });

    await expect(readFile(join(home, "codex-home", "AGENTS.md"), "utf8")).resolves.toContain("Keep this text.");
    const codex = result.platforms.find((platform) => platform.platform === "codex");
    const antigravity = result.platforms.find((platform) => platform.platform === "antigravity");
    expect(codex?.readiness).toBe("installed-pending-trust");
    expect(codex?.warnings.join(" ")).toContain("/hooks");
    expect(antigravity?.readiness).toBe("precedence-unknown");
  });
});
