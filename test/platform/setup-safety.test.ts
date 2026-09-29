import { access, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { setupPlatforms } from "src/commands/setup.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-global-setup-home-");

function fakeEnvironment(home: string): Record<string, string> {
  return { CODEX_HOME: join(home, "codex-home") };
}

describe("setupPlatforms user-global lifecycle: Codex hooks and boundary safety", () => {
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
    await writeFile(
      configPath,
      config.replace('command = "harnix context --platform codex"', 'command = "user-edited-harnix-command"'),
    );

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
    await writeFile(
      configPath,
      config
        .replace('command = "harnix context --platform codex"', 'command = "user-edited-all-hook-identifiers"')
        .replace("additionalContextLimit = 2500", "additionalContextLimit = 42")
        .replace('type = "command"', 'type = "user-edited-type"'),
    );

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
    await writeFile(
      configPath,
      config
        .replace('command = "harnix context --platform codex"', 'command = "user-custom-context"')
        .replace("additionalContextLimit = 2500", "additionalContextLimit = 999")
        .replace('type = "command"', 'type = "user-command"'),
    );

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
    await expect(
      setupPlatforms({
        commandLookup: async () => true,
        environment: fakeEnvironment(escapingHome),
        homeResolver: async () => escapingHome,
        platforms: ["kiro"],
      }),
    ).rejects.toThrow("symbolic link");
    await expect(access(join(external, "hooks", "harnix-context.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_preflight_every_selected_root_before_creating_any_global_lock_or_surface", async () => {
    const home = await temporaryUserHome();
    const invalidManifest = join(home, ".kiro", "harnix", "managed.json");
    await mkdir(join(invalidManifest, ".."), { recursive: true });
    await writeFile(invalidManifest, "not-a-harnix-manifest\n", { encoding: "utf8" });

    await expect(
      setupPlatforms({
        commandLookup: async () => true,
        environment: fakeEnvironment(home),
        homeResolver: async () => home,
        platforms: ["kiro", "codex"],
      }),
    ).rejects.toThrow("manifest");

    await expect(access(join(home, "codex-home"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(home, ".agents"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(invalidManifest, "utf8")).resolves.toBe("not-a-harnix-manifest\n");
  });
});
