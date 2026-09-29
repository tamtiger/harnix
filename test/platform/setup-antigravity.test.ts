import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { setupPlatforms } from "src/commands/setup.js";
import { packageVersion } from "src/version.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-global-setup-home-");
const crashedLockToken = "owner-00000000-0000-4000-8000-000000000001.json";
const recoveredLockToken = "owner-00000000-0000-4000-8000-000000000002.json";

function fakeEnvironment(home: string): Record<string, string> {
  return { CODEX_HOME: join(home, "codex-home") };
}

describe("setupPlatforms user-global lifecycle: Antigravity roots and skills", () => {
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
    await expect(readFile(join(desktopPluginRoot, "plugin.json"), "utf8")).resolves.toBe(
      '{"name":"user-harnix-plugin"}\n',
    );
    await expect(access(join(desktopPluginRoot, ".managed.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(desktopPluginRoot, ".managed.lock"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(desktopPluginRoot, "hooks.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      access(join(home, ".gemini", "antigravity-cli", "plugins", "harnix", ".managed.json")),
    ).resolves.toBeUndefined();
  });

  it("should_recover_a_manifestless_antigravity_root_when_its_only_entry_is_a_harnix_lock_directory", async () => {
    const home = await temporaryUserHome();
    const desktopPluginRoot = join(home, ".gemini", "config", "plugins", "harnix");
    const desktopLock = join(desktopPluginRoot, ".managed.lock");
    await mkdir(desktopLock, { recursive: true });
    await writeFile(
      join(desktopLock, crashedLockToken),
      `${JSON.stringify({
        acquiredAt: "2026-01-01T00:00:00.000Z",
        generator: "harnix",
        generatorVersion: packageVersion,
        operationId: "crashed-operation",
        ownerPid: 123,
        processStartedAt: "2026-01-01T00:00:00.000Z",
        schemaVersion: 1,
      })}\n`,
      "utf8",
    );
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
        await rm(path, { force: true, recursive: true });
        await mkdir(path, { recursive: true });
        const recordPath = join(path, recoveredLockToken);
        await writeFile(recordPath, `${JSON.stringify(record)}\n`, "utf8");
        return {
          path,
          recordPath,
          record,
          release: async () => {
            await rm(path, { force: true, recursive: true });
          },
        };
      },
      platforms: ["antigravity"],
    });

    expect(recoveredLocks).toBe(1);
    expect(result.platforms[0]).toMatchObject({ platform: "antigravity" });
    await expect(access(join(desktopPluginRoot, ".managed.json"))).resolves.toBeUndefined();
    await expect(access(join(desktopPluginRoot, "plugin.json"))).resolves.toBeUndefined();
    await expect(access(desktopLock)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_preserve_a_manifestless_antigravity_root_with_a_legacy_single_file_lock", async () => {
    const home = await temporaryUserHome();
    const desktopPluginRoot = join(home, ".gemini", "config", "plugins", "harnix");
    const desktopLock = join(desktopPluginRoot, ".managed.lock");
    const legacySource = `${JSON.stringify({
      acquiredAt: "2026-01-01T00:00:00.000Z",
      generator: "harnix",
      generatorVersion: packageVersion,
      operationId: "legacy-crashed-operation",
      ownerPid: 123,
      processStartedAt: "2026-01-01T00:00:00.000Z",
      schemaVersion: 1,
    })}\n`;
    await mkdir(desktopPluginRoot, { recursive: true });
    await writeFile(desktopLock, legacySource, "utf8");

    const result = await setupPlatforms({
      commandLookup: async () => true,
      environment: fakeEnvironment(home),
      homeResolver: async () => home,
      platforms: ["antigravity"],
    });

    expect(result.platforms[0]).toMatchObject({ platform: "antigravity", readiness: "drifted" });
    expect(await readFile(desktopLock, "utf8")).toBe(legacySource);
    await expect(access(join(desktopPluginRoot, ".managed.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(desktopPluginRoot, "plugin.json"))).rejects.toMatchObject({ code: "ENOENT" });
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
          await mkdir(path, { recursive: true });
          await writeFile(join(path, recoveredLockToken), "harnix lock\n");
          await writeFile(userPlugin, '{"name":"concurrent-user-plugin"}\n');
          return {
            release: async () => {
              await rm(path, { force: true, recursive: true });
            },
          };
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
    const manifest = JSON.parse(await readFile(join(home, ".kiro", "harnix", "managed.json"), "utf8")) as {
      entries: Array<{ path: string }>;
    };
    expect(manifest.entries.some((entry) => entry.path === "skills/harnix-check/SKILL.md")).toBe(false);
  });
});
