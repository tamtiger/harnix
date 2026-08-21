import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { setupPlatforms } from "../../src/commands/setup.js";
import { uninstallGlobalIntegrations } from "../../src/commands/global-uninstall.js";
import { updateGlobalPlatforms } from "../../src/commands/global-update.js";
import { CODEX_GLOBAL_HOOK_SELECTOR, codexGlobalContextHookGroup } from "../../src/configurators/codex.js";
import { KIRO_GLOBAL_CONTEXT_HOOK } from "../../src/configurators/kiro.js";
import { canonicalJson } from "../../src/utils/global-managed-json.js";
import { sha256 } from "../../src/utils/hashing.js";
import { resolveUserPlatformRoots } from "../../src/utils/user-paths.js";
import { useTemporaryUserHomes } from "../support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-global-lifecycle-");

describe("global integration lifecycle", () => {
  const legacyAntigravityRule = [
    "---",
    "name: harnix",
    "description: Activate Harnix workflow guidance only inside an initialized Harnix project.",
    "---",
    "",
    "# Harnix",
    "",
  ].join("\n");

  it("should_preserve_deleted_owned_files_by_default_and_restore_them_only_when_global_update_is_explicit", async () => {
    const home = await temporaryUserHome();
    const environment = { CODEX_HOME: join(home, "codex") };
    await setupPlatforms({ commandLookup: async () => true, environment, homeResolver: async () => home, platforms: ["kiro"] });
    await rm(join(home, ".kiro", "steering", "harnix.md"));

    const result = await updateGlobalPlatforms({ commandLookup: async () => true, environment, homeResolver: async () => home });

    expect(result.scope).toBe("user");
    expect(result.platforms).toHaveLength(1);
    expect(result.platforms[0]).toMatchObject({ platform: "kiro", readiness: "drifted" });
    await expect(access(join(home, ".kiro", "steering", "harnix.md"))).rejects.toMatchObject({ code: "ENOENT" });
    const restored = await updateGlobalPlatforms({ commandLookup: async () => true, environment, homeResolver: async () => home, restoreDeleted: true });
    expect(restored.platforms[0]).toMatchObject({ platform: "kiro", readiness: "installed" });
    await expect(access(join(home, ".kiro", "steering", "harnix.md"))).resolves.toBeUndefined();
    await expect(access(join(home, ".agents"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_noop_when_global_update_finds_no_owned_platform_manifest", async () => {
    const home = await temporaryUserHome();

    await expect(updateGlobalPlatforms({ commandLookup: async () => true, environment: { CODEX_HOME: join(home, "codex") }, homeResolver: async () => home })).resolves.toEqual({ scope: "user", platforms: [] });
  });

  it("should_not_validate_an_unselected_codex_home_when_updating_only_kiro", async () => {
    const home = await temporaryUserHome();
    const homeResolver = async () => home;
    await setupPlatforms({ commandLookup: async () => true, environment: { CODEX_HOME: join(home, "codex") }, homeResolver, platforms: ["kiro"] });

    const result = await updateGlobalPlatforms({
      commandLookup: async () => true,
      environment: { CODEX_HOME: "relative-codex-home" },
      homeResolver,
      platforms: ["kiro"],
    });

    expect(result.platforms).toEqual([expect.objectContaining({ platform: "kiro", readiness: "installed" })]);
    await expect(access(join(home, ".kiro", "hooks", "harnix-context.json"))).resolves.toBeUndefined();
  });

  it("should_remove_the_last_owned_sidecar_and_not_reinstall_after_global_uninstall", async () => {
    const home = await temporaryUserHome();
    const environment = { CODEX_HOME: join(home, "codex") };
    const homeResolver = async () => home;
    const roots = await resolveUserPlatformRoots({ environment, homeResolver });
    await setupPlatforms({ commandLookup: async () => true, environment, homeResolver, platforms: ["kiro"] });

    await uninstallGlobalIntegrations({ platforms: ["kiro"], roots, yes: true });

    await expect(access(join(home, ".kiro", "harnix", "managed.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(home, ".kiro", "harnix"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(home, ".kiro", "skills", "harnix-check"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(updateGlobalPlatforms({ commandLookup: async () => true, environment, homeResolver })).resolves.toEqual({ scope: "user", platforms: [] });
    await expect(access(join(home, ".kiro", "steering", "harnix.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_safely_remove_unchanged_obsolete_entries_during_global_update", async () => {
    const home = await temporaryUserHome();
    const environment = { CODEX_HOME: join(home, "codex") };
    const homeResolver = async () => home;
    await setupPlatforms({ commandLookup: async () => true, environment, homeResolver, platforms: ["kiro"] });
    const manifestPath = join(home, ".kiro", "harnix", "managed.json");
    const obsoletePath = join(home, ".kiro", "legacy", "harnix.md");
    const obsoleteContent = "obsolete generated content\n";
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      entries: Array<{ path: string; sourceId: string; kind: string; generatedHash: string; generatorVersion: string }>;
    };
    manifest.entries.push({
      path: "legacy/harnix.md",
      sourceId: "obsolete-global-file",
      kind: "file",
      generatedHash: sha256(obsoleteContent),
      generatorVersion: "0.4.0",
    });
    manifest.entries.sort((left, right) => `${left.path}\u0000${left.sourceId}`.localeCompare(`${right.path}\u0000${right.sourceId}`));
    await mkdir(join(obsoletePath, ".."), { recursive: true });
    await writeFile(obsoletePath, obsoleteContent);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const result = await updateGlobalPlatforms({ commandLookup: async () => true, environment, homeResolver });

    expect(result.platforms).toHaveLength(1);
    await expect(access(obsoletePath)).rejects.toMatchObject({ code: "ENOENT" });
    const after = JSON.parse(await readFile(manifestPath, "utf8")) as { entries: Array<{ path: string }> };
    expect(after.entries.some((entry) => entry.path === "legacy/harnix.md")).toBe(false);
  });

  it("should_migrate_an_unchanged_nested_context_command_and_preserve_a_modified_hook", async () => {
    const migratedHome = await temporaryUserHome();
    const preservedHome = await temporaryUserHome();
    for (const [home, modified] of [[migratedHome, false], [preservedHome, true]] as const) {
      const environment = { CODEX_HOME: join(home, "codex") };
      const homeResolver = async () => home;
      await setupPlatforms({ commandLookup: async () => true, environment, homeResolver, platforms: ["kiro"] });
      const hookPath = join(home, ".kiro", "hooks", "harnix-context.json");
      const manifestPath = join(home, ".kiro", "harnix", "managed.json");
      const legacyHook = JSON.parse(JSON.stringify(KIRO_GLOBAL_CONTEXT_HOOK)) as { hooks: Array<{ action: { command: string } }> };
      legacyHook.hooks[0]!.action.command = "harnix internal context --platform kiro";
      const legacyContent = `${JSON.stringify(legacyHook, null, 2)}\n`;
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
        entries: Array<{ path: string; sourceId: string; kind: string; generatedHash: string; generatorVersion: string }>;
      };
      const hookEntry = manifest.entries.find((entry) => entry.path === "hooks/harnix-context.json");
      if (hookEntry === undefined) throw new Error("Expected the owned Kiro hook entry.");
      hookEntry.generatedHash = sha256(legacyContent);
      hookEntry.generatorVersion = "1.0.6";
      await writeFile(hookPath, modified ? legacyContent.replace('"timeout": 5', '"timeout": 99') : legacyContent);
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

      const result = await updateGlobalPlatforms({ commandLookup: async () => true, environment, homeResolver, platforms: ["kiro"] });
      const content = await readFile(hookPath, "utf8");
      if (modified) {
        expect(result.platforms[0]).toMatchObject({ platform: "kiro", readiness: "drifted" });
        expect(content).toContain("harnix internal context --platform kiro");
        expect(content).toContain('"timeout": 99');
      } else {
        expect(result.platforms[0]).toMatchObject({ platform: "kiro", readiness: "installed" });
        expect(content).toContain("harnix context --platform kiro");
        expect(content).not.toContain("harnix internal context");
      }
    }
  });

  it("should_migrate_the_legacy_codex_json_hook_to_config_toml_without_deleting_user_hooks", async () => {
    const migratedHome = await temporaryUserHome();
    const preservedHome = await temporaryUserHome();
    for (const [home, modified] of [[migratedHome, false], [preservedHome, true]] as const) {
      const environment = { CODEX_HOME: join(home, "codex") };
      const homeResolver = async () => home;
      await setupPlatforms({ commandLookup: async () => true, environment, homeResolver, platforms: ["codex"] });
      const configPath = join(home, "codex", "config.toml");
      const hooksPath = join(home, "codex", "hooks.json");
      const manifestPath = join(home, "codex", "harnix", "managed.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
        entries: Array<{ path: string; sourceId: string; kind: string; selector?: unknown; generatedHash: string; generatorVersion: string }>;
      };
      const hookEntry = manifest.entries.find((entry) => entry.sourceId === "codex-global-context-hook");
      if (hookEntry === undefined) throw new Error("Expected the owned Codex hook entry.");
      const legacyGroup = JSON.parse(JSON.stringify(codexGlobalContextHookGroup)) as { hooks: Array<{ command?: string; timeout?: number }> };
      const originalLegacyGroup = JSON.parse(JSON.stringify(legacyGroup)) as typeof legacyGroup;
      if (modified && legacyGroup.hooks[0] !== undefined) legacyGroup.hooks[0].timeout = 99;
      const legacyContent = `${JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [{ type: "command", command: "user hook" }] }, legacyGroup] } }, null, 2)}\n`;
      await writeFile(configPath, "[hooks.state]\n");
      await writeFile(hooksPath, legacyContent);
      Object.assign(hookEntry, {
        kind: "json-member",
        path: "hooks.json",
        selector: CODEX_GLOBAL_HOOK_SELECTOR,
        generatedHash: sha256(canonicalJson(originalLegacyGroup)),
        generatorVersion: "1.0.6",
      });
      manifest.entries.sort((left, right) => `${left.path}\u0000${left.sourceId}`.localeCompare(`${right.path}\u0000${right.sourceId}`));
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

      const result = await updateGlobalPlatforms({ commandLookup: async () => true, environment, homeResolver, platforms: ["codex"] });
      const config = await readFile(configPath, "utf8");
      const hooks = await readFile(hooksPath, "utf8");
      expect(config).toContain("[[hooks.UserPromptSubmit]]");
      expect(config).toContain("[hooks.state]");
      if (modified) {
        expect(result.platforms[0]).toMatchObject({ platform: "codex", readiness: "drifted" });
        expect(hooks).toContain('"timeout": 99');
      } else {
        expect(result.platforms[0]).toMatchObject({ platform: "codex", readiness: "installed-pending-trust" });
        expect(hooks).toContain('"command": "user hook"');
        expect(hooks).not.toContain("harnix context --platform codex");
      }
    }
  });

  it("should_migrate_the_antigravity_rule_path_without_overwriting_a_modified_legacy_rule", async () => {
    const home = await temporaryUserHome();
    const environment = { CODEX_HOME: join(home, "codex") };
    const homeResolver = async () => home;
    await setupPlatforms({ commandLookup: async () => true, environment, homeResolver, platforms: ["antigravity"] });

    const pluginRoots = [
      join(home, ".gemini", "config", "plugins", "harnix"),
      join(home, ".gemini", "antigravity-cli", "plugins", "harnix"),
    ];
    for (const pluginRoot of pluginRoots) {
      const manifestPath = join(pluginRoot, ".managed.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
        entries: Array<{ path: string; sourceId: string; kind: string; generatedHash: string; generatorVersion: string }>;
      };
      const ruleEntry = manifest.entries.find((entry) => entry.sourceId === "antigravity-global-rule");
      expect(ruleEntry).toBeDefined();
      await rm(join(pluginRoot, "rules", "AGENTS.md"), { force: true });
      await mkdir(join(pluginRoot, "rules"), { recursive: true });
      await writeFile(join(pluginRoot, "rules", "harnix.md"), legacyAntigravityRule);
      Object.assign(ruleEntry!, { path: "rules/harnix.md", generatedHash: sha256(legacyAntigravityRule) });
      manifest.entries.sort((left, right) => `${left.path}\u0000${left.sourceId}`.localeCompare(`${right.path}\u0000${right.sourceId}`));
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    }
    await writeFile(join(pluginRoots[1]!, "rules", "harnix.md"), `${legacyAntigravityRule}# user edit\n`);

    const result = await updateGlobalPlatforms({ commandLookup: async () => true, environment, homeResolver, platforms: ["antigravity"] });

    expect(result.platforms).toEqual([expect.objectContaining({ platform: "antigravity", readiness: "drifted" })]);
    await expect(access(join(pluginRoots[0]!, "rules", "harnix.md"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(pluginRoots[1]!, "rules", "harnix.md"), "utf8")).resolves.toContain("# user edit");
    for (const pluginRoot of pluginRoots) {
      await expect(readFile(join(pluginRoot, "rules", "AGENTS.md"), "utf8")).resolves.toContain("# Harnix");
    }
  });

  it("should_ignore_corrupt_or_platform_mismatched_sidecars_when_auto_discovering_global_integrations", async () => {
    const home = await temporaryUserHome();
    const environment = { CODEX_HOME: join(home, "codex") };
    await mkdir(join(home, ".kiro", "harnix"), { recursive: true });
    await writeFile(join(home, ".kiro", "harnix", "managed.json"), "not-json\n");
    await mkdir(join(home, ".agents", "harnix"), { recursive: true });
    await writeFile(join(home, ".agents", "harnix", "managed.json"), `${JSON.stringify({ generator: "harnix", schemaVersion: 1, platform: "antigravity-desktop", entries: [] })}\n`);
    let commandLookups = 0;

    const result = await updateGlobalPlatforms({
      commandLookup: async () => {
        commandLookups += 1;
        return true;
      },
      environment,
      homeResolver: async () => home,
    });

    expect(result).toEqual({ scope: "user", platforms: [] });
    expect(commandLookups).toBe(0);
    await expect(access(join(home, ".kiro", "steering", "harnix.md"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(home, ".agents", "skills", "harnix-check", "SKILL.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_fail_closed_when_global_update_lacks_an_injected_test_home_or_command_lookup", async () => {
    await expect(updateGlobalPlatforms({ commandLookup: async () => true })).rejects.toThrow("injected homeResolver");

    const home = await temporaryUserHome();
    await expect(updateGlobalPlatforms({ environment: { CODEX_HOME: join(home, "codex") }, homeResolver: async () => home })).rejects.toThrow("injected commandLookup");
  });
});
