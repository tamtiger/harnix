import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { setupPlatforms } from "../../src/commands/setup.js";
import { uninstallGlobalIntegrations } from "../../src/commands/global-uninstall.js";
import { updateGlobalPlatforms } from "../../src/commands/global-update.js";
import { sha256 } from "../../src/utils/hashing.js";
import { resolveUserPlatformRoots } from "../../src/utils/user-paths.js";
import { useTemporaryUserHomes } from "../support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-global-lifecycle-");

describe("global integration lifecycle", () => {
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
