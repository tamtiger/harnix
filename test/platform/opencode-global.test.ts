import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { diagnoseGlobalIntegrations } from "src/commands/global-doctor.js";
import { updateGlobalPlatforms } from "src/commands/global-update.js";
import { setupPlatforms } from "src/commands/setup.js";
import { uninstallGlobalIntegrations } from "src/commands/global-uninstall.js";
import { opencodeGlobalDesiredFiles } from "src/configurators/opencode.js";
import { packageVersion } from "src/version.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-opencode-global-home-");

const options = (home: string) =>
  ({
    commandLookup: async () => true,
    environment: {} as Record<string, string>,
    homeResolver: async () => home,
  }) as const;

const skillPath = (home: string) => join(home, ".config", "opencode", "skills", "harnix-implement", "SKILL.md");
const agentsPath = (home: string) => join(home, ".config", "opencode", "AGENTS.md");

describe("OpenCode user-global lifecycle", () => {
  it("plans skills plus a marked AGENTS.md block and nothing else", () => {
    const files = opencodeGlobalDesiredFiles();
    expect(files.some((file) => file.path === "AGENTS.md" && file.kind === "managed-block")).toBe(true);
    expect(files.some((file) => file.path === "skills/harnix-implement/SKILL.md")).toBe(true);
    expect(files.every((file) => !file.path.endsWith("hooks.json"))).toBe(true);
  });

  it("installs skills and a marked AGENTS.md block, preserving content outside the block", async () => {
    const home = await temporaryUserHome();
    await mkdir(join(home, ".config", "opencode"), { recursive: true });
    await writeFile(agentsPath(home), "# My OpenCode rules\n\nAlways run pnpm test.\n", "utf8");

    const result = await setupPlatforms({ ...options(home), platforms: ["opencode"] });

    expect(result.scope).toBe("user");
    expect(result.platforms.map((platform) => platform.platform)).toEqual(["opencode"]);
    expect(JSON.stringify(result)).not.toContain(home);
    await expect(readFile(skillPath(home), "utf8")).resolves.toContain(`metadata:\n  version: "${packageVersion}"`);
    await expect(readFile(skillPath(home), "utf8")).resolves.toContain("harnix workflow --preflight");
    const agents = await readFile(agentsPath(home), "utf8");
    expect(agents).toContain("Always run pnpm test.");
    expect(agents).toContain("<!-- harnix:begin -->");
    expect(agents).toContain("harnix/config.yaml");
    // Hookless: no shell hook file is written.
    await expect(access(join(home, ".config", "opencode", "hooks.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("reports a hookless install and surfaces the Claude fallback precedence notice", async () => {
    const home = await temporaryUserHome();
    const result = await setupPlatforms({ ...options(home), platforms: ["opencode"] });
    const opencode = result.platforms.find((platform) => platform.platform === "opencode");
    expect(opencode?.readiness).toBe("installed");
    expect(opencode?.warnings.join(" ")).toContain("CLAUDE.md");
  });

  it("reinstalls idempotently and updates without rewriting unchanged bytes", async () => {
    const home = await temporaryUserHome();
    await setupPlatforms({ ...options(home), platforms: ["opencode"] });
    const update = await updateGlobalPlatforms({ ...options(home), platforms: ["opencode"] });
    expect(update.platforms.flatMap((platform) => platform.created)).toEqual([]);
    expect(update.platforms.flatMap((platform) => platform.updated)).toEqual([]);
  });

  it("uninstalls only the owned fragments", async () => {
    const home = await temporaryUserHome();
    await mkdir(join(home, ".config", "opencode"), { recursive: true });
    await writeFile(agentsPath(home), "# Keep me\n", "utf8");
    await setupPlatforms({ ...options(home), platforms: ["opencode"] });

    await uninstallGlobalIntegrations({ ...options(home), platforms: ["opencode"], yes: true });

    await expect(access(skillPath(home))).rejects.toMatchObject({ code: "ENOENT" });
    const agents = await readFile(agentsPath(home), "utf8");
    expect(agents).toContain("Keep me");
    expect(agents).not.toContain("<!-- harnix:begin -->");
  });

  it("doctor lists OpenCode after installation", async () => {
    const home = await temporaryUserHome();
    await setupPlatforms({ ...options(home), platforms: ["opencode"] });
    const integrations = await diagnoseGlobalIntegrations(options(home));
    expect(integrations.map((integration) => integration.platform)).toContain("opencode");
  });

  it("installs, updates and removes below $XDG_CONFIG_HOME/opencode when OpenCode would read it there", async () => {
    const home = await temporaryUserHome();
    const xdg = await temporaryUserHome();
    const xdgOptions = { ...options(home), environment: { XDG_CONFIG_HOME: xdg } };

    await setupPlatforms({ ...xdgOptions, platforms: ["opencode"] });

    await expect(readFile(join(xdg, "opencode", "AGENTS.md"), "utf8")).resolves.toContain("<!-- harnix:begin -->");
    await expect(access(join(xdg, "opencode", "skills", "harnix-implement", "SKILL.md"))).resolves.toBeUndefined();
    await expect(access(join(home, ".config"))).rejects.toMatchObject({ code: "ENOENT" });
    const updated = await updateGlobalPlatforms(xdgOptions);
    expect(updated.platforms.map((platform) => platform.platform)).toEqual(["opencode"]);
    const integrations = await diagnoseGlobalIntegrations(xdgOptions);
    expect(integrations.map((integration) => integration.platform)).toContain("opencode");

    await uninstallGlobalIntegrations({ ...xdgOptions, platforms: ["opencode"], yes: true });
    await expect(access(join(xdg, "opencode", "skills", "harnix-implement"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("falls back to ~/.config/opencode when XDG_CONFIG_HOME is empty or relative", async () => {
    const home = await temporaryUserHome();

    await setupPlatforms({
      ...options(home),
      environment: { XDG_CONFIG_HOME: "relative/dir" },
      platforms: ["opencode"],
    });

    await expect(access(agentsPath(home))).resolves.toBeUndefined();
  });
});
