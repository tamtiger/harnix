import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { setupPlatforms } from "../../src/commands/setup.js";
import { uninstallGlobalIntegrations } from "../../src/commands/global-uninstall.js";
import { resolveUserPlatformRoots, type UserPlatformRoots } from "../../src/utils/user-paths.js";
import { useTemporaryUserHomes } from "../support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-global-uninstall-");

async function configuredRoots(platforms: readonly ("kiro" | "antigravity" | "codex")[]): Promise<{ home: string; roots: UserPlatformRoots }> {
  const home = await temporaryUserHome();
  const roots = await resolveUserPlatformRoots({ homeResolver: async () => home, environment: {} });
  await setupPlatforms({
    platforms,
    homeResolver: async () => home,
    environment: {},
    commandLookup: async () => true,
  });
  return { home, roots };
}

describe("global integration uninstall", () => {
  it("fails closed in test mode before resolving a real user profile", async () => {
    await expect(uninstallGlobalIntegrations({ platforms: ["kiro"] })).rejects.toThrow("injected homeResolver");
  });

  it("returns a confirmation-only preview for exactly the selected public platforms", async () => {
    const { roots } = await configuredRoots(["kiro", "antigravity", "codex"]);
    const kiroSkill = join(roots.kiro.path, "skills", "harnix-check", "SKILL.md");
    const antigravityPlugin = join(roots.antigravityDesktop.path, "plugin.json");
    const codexAgents = join(roots.codex.config.path, "AGENTS.md");

    const result = await uninstallGlobalIntegrations({ platforms: ["codex", "kiro"], roots });

    expect(result.scope).toBe("user");
    expect(result.platforms.map((platform) => platform.platform)).toEqual(["codex", "kiro"]);
    expect(result.platforms.every((platform) => platform.confirmationRequired && platform.removed.length === 0 && platform.preserved.length === 0)).toBe(true);
    expect(result.platforms.find((platform) => platform.platform === "kiro")?.targets).toContain("~/.kiro/skills/harnix-check/SKILL.md");
    expect(result.platforms.find((platform) => platform.platform === "codex")?.targets).toEqual(expect.arrayContaining(["~/.agents/skills/harnix-check/SKILL.md", "~/.codex/AGENTS.md#codex-global-agents", "~/.codex/config.toml#codex-global-context-hook"]));
    expect(result.platforms.flatMap((platform) => platform.targets).some((target) => target.includes(".gemini"))).toBe(false);
    await expect(access(kiroSkill)).resolves.toBeUndefined();
    await expect(access(antigravityPlugin)).resolves.toBeUndefined();
    await expect(access(codexAgents)).resolves.toBeUndefined();
  });

  it("should_not_validate_an_unselected_codex_home_when_previewing_kiro_uninstall", async () => {
    const home = await temporaryUserHome();
    const homeResolver = async () => home;
    await setupPlatforms({ commandLookup: async () => true, environment: {}, homeResolver, platforms: ["kiro"] });

    const result = await uninstallGlobalIntegrations({
      environment: { CODEX_HOME: "relative-codex-home" },
      homeResolver,
      platforms: ["kiro"],
    });

    expect(result.platforms).toEqual([expect.objectContaining({
      confirmationRequired: true,
      platform: "kiro",
      targets: expect.arrayContaining(["~/.kiro/hooks/harnix-context.json"]),
    })]);
  });

  it("removes unchanged selected Kiro and both Antigravity roots without deleting platform roots or unrelated files", async () => {
    const { roots } = await configuredRoots(["kiro", "antigravity"]);
    const kiroUnrelated = join(roots.kiro.path, "settings", "user.json");
    const desktopUnrelated = join(roots.antigravityDesktop.path, "user-plugin-note.txt");
    const cliUnrelated = join(roots.antigravityCli.path, "user-plugin-note.txt");
    await mkdir(join(kiroUnrelated, ".."), { recursive: true });
    await writeFile(kiroUnrelated, "user setting\n");
    await writeFile(desktopUnrelated, "desktop user note\n");
    await writeFile(cliUnrelated, "cli user note\n");

    const result = await uninstallGlobalIntegrations({ platforms: ["antigravity", "kiro"], roots, yes: true });

    expect(result.platforms.map((platform) => platform.platform)).toEqual(["antigravity", "kiro"]);
    expect(result.platforms.every((platform) => platform.confirmationRequired === false && platform.removed.length > 0)).toBe(true);
    expect(result.platforms.flatMap((platform) => platform.preserved)).toEqual([]);
    await expect(readFile(kiroUnrelated, "utf8")).resolves.toBe("user setting\n");
    await expect(readFile(desktopUnrelated, "utf8")).resolves.toBe("desktop user note\n");
    await expect(readFile(cliUnrelated, "utf8")).resolves.toBe("cli user note\n");
    await expect(access(roots.kiro.path)).resolves.toBeUndefined();
    await expect(access(roots.antigravityDesktop.path)).resolves.toBeUndefined();
    await expect(access(roots.antigravityCli.path)).resolves.toBeUndefined();
  });

  it("removes only empty Harnix-owned sidecar namespaces and plugin roots", async () => {
    const { roots } = await configuredRoots(["antigravity", "codex"]);

    await uninstallGlobalIntegrations({ platforms: ["antigravity", "codex"], roots, yes: true });

    await expect(access(roots.antigravityDesktop.path)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(roots.antigravityCli.path)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(roots.codex.config.path, "harnix"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(roots.codex.skills.path, "harnix"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(roots.codex.skills.path, "skills", "harnix-check"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(roots.codex.config.path)).resolves.toBeUndefined();
    await expect(access(roots.codex.skills.path)).resolves.toBeUndefined();
  });

  it("preserves modified Codex fragments and unrelated hook groups while removing unchanged owned skills", async () => {
    const { roots } = await configuredRoots(["codex"]);
    const agentsPath = join(roots.codex.config.path, "AGENTS.md");
    const configPath = join(roots.codex.config.path, "config.toml");
    await writeFile(agentsPath, (await readFile(agentsPath, "utf8")).replace("## Harnix", "## User-modified Harnix"));
    const config = await readFile(configPath, "utf8");
    await writeFile(configPath, `${config.replace("# harnix:codex-hook:begin", "[[hooks.UserPromptSubmit]]\n[[hooks.UserPromptSubmit.hooks]]\ntype = \"command\"\ncommand = \"user hook\"\ntimeout = 1\n\n# harnix:codex-hook:begin").replace("timeout = 5", "timeout = 99")}`);

    const result = await uninstallGlobalIntegrations({ platforms: ["codex"], roots, yes: true });
    const codex = result.platforms[0]!;

    expect(codex.preserved).toEqual(expect.arrayContaining(["~/.codex/AGENTS.md#codex-global-agents", "~/.codex/config.toml#codex-global-context-hook"]));
    expect(codex.removed).toEqual(expect.arrayContaining(["~/.agents/skills/harnix-check/SKILL.md"]));
    await expect(readFile(agentsPath, "utf8")).resolves.toContain("User-modified Harnix");
    await expect(access(join(roots.codex.config.path, "harnix", "managed.json"))).resolves.toBeUndefined();
    const after = await readFile(configPath, "utf8");
    expect(after).toContain('command = "user hook"');
    expect(after).toContain("timeout = 99");
  });

  it("preserves a colliding Codex Harnix hook identity instead of deleting either matching group", async () => {
    const { roots } = await configuredRoots(["codex"]);
    const configPath = join(roots.codex.config.path, "config.toml");
    const config = await readFile(configPath, "utf8");
    const marker = "# harnix:codex-hook:begin";
    const duplicate = config.slice(config.indexOf(marker));
    await writeFile(configPath, `${config}\n${duplicate}`);

    const result = await uninstallGlobalIntegrations({ platforms: ["codex"], roots, yes: true });

    expect(result.platforms[0]?.preserved).toContain("~/.codex/config.toml#codex-global-context-hook");
    const after = await readFile(configPath, "utf8");
    expect(after.match(/# harnix:codex-hook:begin/gu)).toHaveLength(2);
  });

  it("does not create a platform root or sidecar when an explicit selected platform has no manifest", async () => {
    const home = await temporaryUserHome();
    const roots = await resolveUserPlatformRoots({ homeResolver: async () => home, environment: {} });

    await expect(uninstallGlobalIntegrations({ platforms: ["kiro"], roots })).resolves.toEqual({
      scope: "user",
      platforms: [{ platform: "kiro", targets: [], removed: [], preserved: [], confirmationRequired: true }],
    });
    await expect(access(roots.kiro.path)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(uninstallGlobalIntegrations({ platforms: ["kiro"], roots, yes: true })).resolves.toEqual({
      scope: "user",
      platforms: [{ platform: "kiro", targets: [], removed: [], preserved: [], confirmationRequired: false }],
    });
    await expect(access(roots.kiro.path)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("acquires and releases selected global sidecar locks in stable logical-root order", async () => {
    const { roots } = await configuredRoots(["kiro", "codex"]);
    const acquired: string[] = [];
    const released: string[] = [];

    await uninstallGlobalIntegrations({
      platforms: ["kiro", "codex"],
      roots,
      yes: true,
      lockAcquirer: async (path) => {
        acquired.push(path);
        return { release: async () => { released.push(path); } };
      },
    });

    expect(acquired).toEqual([
      join(roots.codex.skills.path, "harnix", "managed.lock"),
      join(roots.codex.config.path, "harnix", "managed.lock"),
      join(roots.kiro.path, "harnix", "managed.lock"),
    ]);
    expect(released).toEqual([...acquired].reverse());
  });
});
