import { access, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { setupPlatforms } from "../../src/commands/setup.js";
import { packageVersion } from "../../src/version.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";
import { useTemporaryUserHomes } from "../support/temporary-user-home.js";

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

    await expect(setupPlatforms({
      environment: fakeEnvironment(home),
      homeResolver: async () => home,
      platforms: ["kiro"],
    })).rejects.toThrow("injected commandLookup");

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
    await expect(readFile(join(home, ".kiro", "hooks", "harnix-context.json"), "utf8")).resolves.toContain('"UserPromptSubmit"');
    await expect(readFile(join(home, ".gemini", "config", "plugins", "harnix", "plugin.json"), "utf8")).resolves.toContain('"name": "harnix"');
    await expect(readFile(join(home, ".gemini", "antigravity-cli", "plugins", "harnix", "hooks.json"), "utf8")).resolves.toContain('"PreInvocation"');
    await expect(readFile(join(home, ".agents", "skills", "harnix-implement", "SKILL.md"), "utf8")).resolves.toContain(`metadata:\n  version: "${packageVersion}"`);
    await expect(readFile(join(home, ".agents", "skills", "harnix-implement", "SKILL.md"), "utf8")).resolves.toContain("nearest ancestor or workspace root containing `.harnix/config.yaml`");
    await expect(readFile(join(home, "codex-home", "config.toml"), "utf8")).resolves.toContain("[[hooks.UserPromptSubmit]]");
    await expect(access(join(nonHarnixDirectory, ".harnix", "config.yaml"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(nonHarnixDirectory, ".kiro"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(nonHarnixDirectory, ".gemini"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(nonHarnixDirectory, ".codex"))).rejects.toMatchObject({ code: "ENOENT" });
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
    expect(result.platforms.flatMap((platform) => platform.created)).toEqual(expect.arrayContaining([
      "~/.kiro/hooks/harnix-context.json",
      "~/.agents/skills/harnix-implement/SKILL.md",
      "$CODEX_HOME/config.toml#codex-global-context-hook",
    ]));
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
    await writeFile(join(home, "codex-home", "hooks.json"), `${JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [{ type: "command", command: "user-context" }] }] } }, null, 2)}\n`);
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

  it("should_preserve_an_unowned_antigravity_harnix_plugin_root_without_writing_a_sidecar", async () => {
    const home = await temporaryUserHome();
    const desktopPluginRoot = join(home, ".gemini", "config", "plugins", "harnix");
    await mkdir(desktopPluginRoot, { recursive: true });
    await writeFile(join(desktopPluginRoot, "plugin.json"), '{"name":"user-harnix-plugin"}\n');

    const result = await setupPlatforms({
      commandLookup: async () => true,
      environment: fakeEnvironment(home),
      homeResolver: async () => home,
      platforms: ["antigravity"],
    });

    const antigravity = result.platforms[0]!;
    expect(antigravity.readiness).toBe("drifted");
    expect(antigravity.preserved).toContain("~/.gemini/config/plugins/harnix/plugin.json");
    await expect(readFile(join(desktopPluginRoot, "plugin.json"), "utf8")).resolves.toBe('{"name":"user-harnix-plugin"}\n');
    await expect(access(join(desktopPluginRoot, ".managed.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(desktopPluginRoot, ".managed.lock"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(desktopPluginRoot, "hooks.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(home, ".gemini", "antigravity-cli", "plugins", "harnix", ".managed.json"))).resolves.toBeUndefined();
  });

  it("should_recover_a_manifestless_antigravity_root_when_its_only_file_is_a_harnix_lock", async () => {
    const home = await temporaryUserHome();
    const desktopPluginRoot = join(home, ".gemini", "config", "plugins", "harnix");
    const desktopLock = join(desktopPluginRoot, ".managed.lock");
    await mkdir(desktopPluginRoot, { recursive: true });
    await writeFile(desktopLock, `${JSON.stringify({
      acquiredAt: "2026-01-01T00:00:00.000Z",
      generator: "harnix",
      generatorVersion: packageVersion,
      operationId: "crashed-operation",
      ownerPid: 123,
      processStartedAt: "2026-01-01T00:00:00.000Z",
      schemaVersion: 1,
    })}\n`, "utf8");
    let recoveredLocks = 0;

    const result = await setupPlatforms({
      commandLookup: async () => true,
      environment: fakeEnvironment(home),
      homeResolver: async () => home,
      lockAcquirer: async (path) => {
        if (path !== desktopLock) return { release: async () => {} };
        recoveredLocks += 1;
        const record = {
          acquiredAt: "2026-01-02T00:00:00.000Z",
          generator: "harnix" as const,
          generatorVersion: packageVersion,
          operationId: "recovered-operation",
          ownerPid: process.pid,
          processStartedAt: "2026-01-02T00:00:00.000Z",
          schemaVersion: 1 as const,
        };
        await writeFile(path, `${JSON.stringify(record)}\n`, "utf8");
        return { record, release: async () => { await rm(path, { force: true }); } };
      },
      platforms: ["antigravity"],
    });

    expect(recoveredLocks).toBe(1);
    expect(result.platforms[0]).toMatchObject({ platform: "antigravity" });
    await expect(access(join(desktopPluginRoot, ".managed.json"))).resolves.toBeUndefined();
    await expect(access(join(desktopPluginRoot, "plugin.json"))).resolves.toBeUndefined();
    await expect(access(desktopLock)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_preserve_a_plugin_created_between_preflight_and_apply_even_when_its_own_lock_created_the_root", async () => {
    const home = await temporaryUserHome();
    const desktopPluginRoot = join(home, ".gemini", "config", "plugins", "harnix");
    const desktopLock = join(desktopPluginRoot, ".managed.lock");
    const userPlugin = join(desktopPluginRoot, "plugin.json");
    const result = await setupPlatforms({
      commandLookup: async () => true,
      environment: fakeEnvironment(home),
      homeResolver: async () => home,
      lockAcquirer: async (path) => {
        if (path === desktopLock) {
          await mkdir(dirname(path), { recursive: true });
          await writeFile(path, "harnix lock\n");
          await writeFile(userPlugin, '{"name":"concurrent-user-plugin"}\n');
          return { release: async () => { await rm(path, { force: true }); } };
        }
        return { release: async () => {} };
      },
      platforms: ["antigravity"],
    });

    expect(result.platforms[0]).toMatchObject({ platform: "antigravity", readiness: "drifted" });
    await expect(readFile(userPlugin, "utf8")).resolves.toBe('{"name":"concurrent-user-plugin"}\n');
    await expect(access(join(desktopPluginRoot, ".managed.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(desktopPluginRoot, "hooks.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(desktopLock)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_preserve_an_unowned_harnix_skill_unit_without_claiming_or_overwriting_it", async () => {
    const home = await temporaryUserHome();
    const skillUnit = join(home, ".kiro", "skills", "harnix-check");
    await mkdir(skillUnit, { recursive: true });
    await writeFile(join(skillUnit, "USER-NOTES.md"), "do not replace this skill\n");

    const result = await setupPlatforms({
      commandLookup: async () => true,
      environment: fakeEnvironment(home),
      homeResolver: async () => home,
      platforms: ["kiro"],
    });

    expect(result.platforms[0]).toMatchObject({ platform: "kiro", readiness: "drifted" });
    expect(result.platforms[0]?.preserved).toContain("~/.kiro/skills/harnix-check/SKILL.md");
    await expect(readFile(join(skillUnit, "USER-NOTES.md"), "utf8")).resolves.toBe("do not replace this skill\n");
    await expect(access(join(skillUnit, "SKILL.md"))).rejects.toMatchObject({ code: "ENOENT" });
    const manifest = JSON.parse(await readFile(join(home, ".kiro", "harnix", "managed.json"), "utf8")) as { entries: Array<{ path: string }> };
    expect(manifest.entries.some((entry) => entry.path === "skills/harnix-check/SKILL.md")).toBe(false);
  });

  it("should_preserve_a_modified_codex_hook_command_without_adding_a_duplicate_group", async () => {
    const home = await temporaryUserHome();
    const environment = fakeEnvironment(home);
    const options = {
      commandLookup: async () => true,
      environment,
      homeResolver: async () => home,
      platforms: ["codex"] as const,
    };
    await setupPlatforms(options);
    const configPath = join(home, "codex-home", "config.toml");
    const config = await readFile(configPath, "utf8");
    await writeFile(configPath, config.replace('command = "harnix context --platform codex"', 'command = "user-edited-harnix-command"'));

    const rerun = await setupPlatforms(options);
    const after = await readFile(configPath, "utf8");

    expect(rerun.platforms[0]).toMatchObject({ platform: "codex", readiness: "drifted" });
    expect(rerun.platforms[0]?.preserved).toContain("$CODEX_HOME/config.toml#codex-global-context-hook");
    expect(after).toContain('command = "user-edited-harnix-command"');
    expect(after.match(/# harnix:codex-hook:begin/gu)).toHaveLength(1);
  });

  it("should_preserve_a_codex_hook_when_its_context_limit_or_type_is_edited", async () => {
    const home = await temporaryUserHome();
    const environment = fakeEnvironment(home);
    const options = {
      commandLookup: async () => true,
      environment,
      homeResolver: async () => home,
      platforms: ["codex"] as const,
    };
    await setupPlatforms(options);
    const configPath = join(home, "codex-home", "config.toml");
    const config = await readFile(configPath, "utf8");
    await writeFile(configPath, config
      .replace('command = "harnix context --platform codex"', 'command = "user-edited-all-hook-identifiers"')
      .replace("additionalContextLimit = 2500", "additionalContextLimit = 42")
      .replace('type = "command"', 'type = "user-edited-type"'));

    const rerun = await setupPlatforms(options);
    const after = await readFile(configPath, "utf8");

    expect(rerun.platforms[0]).toMatchObject({ platform: "codex", readiness: "drifted" });
    expect(rerun.platforms[0]?.preserved).toContain("$CODEX_HOME/config.toml#codex-global-context-hook");
    expect(after).toContain('command = "user-edited-all-hook-identifiers"');
    expect(after).toContain("additionalContextLimit = 42");
    expect(after).toContain('type = "user-edited-type"');
  });

  it("should_preserve_a_codex_hook_when_all_harnix_identity_fields_are_edited", async () => {
    const home = await temporaryUserHome();
    const environment = fakeEnvironment(home);
    const options = {
      commandLookup: async () => true,
      environment,
      homeResolver: async () => home,
      platforms: ["codex"] as const,
    };
    await setupPlatforms(options);
    const configPath = join(home, "codex-home", "config.toml");
    const config = await readFile(configPath, "utf8");
    await writeFile(configPath, config
      .replace('command = "harnix context --platform codex"', 'command = "user-custom-context"')
      .replace("additionalContextLimit = 2500", "additionalContextLimit = 999")
      .replace('type = "command"', 'type = "user-command"'));

    const rerun = await setupPlatforms(options);
    const after = await readFile(configPath, "utf8");

    expect(rerun.platforms[0]).toMatchObject({ platform: "codex", readiness: "drifted" });
    expect(rerun.platforms[0]?.preserved).toContain("$CODEX_HOME/config.toml#codex-global-context-hook");
    expect(after).toContain('command = "user-custom-context"');
    expect(after).toContain("additionalContextLimit = 999");
    expect(after).toContain('type = "user-command"');
  });

  it("should_install_but_report_binary_unavailable_and_reject_user_root_symlink_escape", async () => {
    const home = await temporaryUserHome();
    const external = await temporaryUserHome();
    const unavailable = await setupPlatforms({
      commandLookup: async () => false,
      environment: fakeEnvironment(home),
      homeResolver: async () => home,
      platforms: ["kiro"],
    });
    expect(unavailable.platforms[0]).toMatchObject({ platform: "kiro", readiness: "binary-unavailable" });
    await expect(access(join(home, ".kiro", "hooks", "harnix-context.json"))).resolves.toBeUndefined();

    const escapingHome = await temporaryUserHome();
    await symlink(external, join(escapingHome, ".kiro"), process.platform === "win32" ? "junction" : "dir");
    await expect(setupPlatforms({
      commandLookup: async () => true,
      environment: fakeEnvironment(escapingHome),
      homeResolver: async () => escapingHome,
      platforms: ["kiro"],
    })).rejects.toThrow("symbolic link");
    await expect(access(join(external, "hooks", "harnix-context.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_preflight_every_selected_root_before_creating_any_global_lock_or_surface", async () => {
    const home = await temporaryUserHome();
    const invalidManifest = join(home, ".kiro", "harnix", "managed.json");
    await mkdir(join(invalidManifest, ".."), { recursive: true });
    await writeFile(invalidManifest, "not-a-harnix-manifest\n", { encoding: "utf8" });

    await expect(setupPlatforms({
      commandLookup: async () => true,
      environment: fakeEnvironment(home),
      homeResolver: async () => home,
      platforms: ["kiro", "codex"],
    })).rejects.toThrow("manifest");

    await expect(access(join(home, "codex-home"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(home, ".agents"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(invalidManifest, "utf8")).resolves.toBe("not-a-harnix-manifest\n");
  });
});
