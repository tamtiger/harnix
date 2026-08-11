import { access, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "../../src/commands/init.js";
import { setupPlatforms } from "../../src/commands/setup.js";
import { mergeCodexConfig } from "../../src/configurators/codex.js";
import { createConfig, readConfig, writeConfig } from "../../src/core/config/config.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const fixture = useTemporaryRepositories("harnix-platform-");

async function initializedRepository(): Promise<string> {
  const root = await fixture();
  await initializeProject({ developer: "tam", root, yes: true });
  return root;
}

describe("setupPlatforms", () => {
  it("writes byte-idempotent Kiro and Codex project surfaces while preserving user-owned Codex data", async () => {
    const root = await fixture();
    await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam", languages: ["vue"] }));
    await writeFile(join(root, "AGENTS.md"), "# User guide\n\nKeep this text.\n");
    await mkdir(join(root, ".codex"), { recursive: true });
    await writeFile(join(root, ".codex", "hooks.json"), JSON.stringify({ hooks: { UserPromptSubmit: [{ command: "user-command" }] } }));
    await writeFile(join(root, ".codex", "config.toml"), "model = \"user-model\"\n\n[harnix]\nenabled = false\n\n[other]\nvalue = true\n");

    await setupPlatforms({ platforms: ["kiro", "codex"], root });
    const firstAgents = await readFile(join(root, "AGENTS.md"), "utf8");
    await setupPlatforms({ platforms: ["kiro", "codex"], root });

    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe(firstAgents);
    expect(firstAgents).toContain("Keep this text.");
    expect(firstAgents).toContain("<!-- harnix:begin -->");
    expect(firstAgents).toContain("Bypass, Lite, or Full");
    expect(firstAgents).toContain("harnix-finish-work");
    await expect(readFile(join(root, ".kiro", "hooks", "harnix-context.kiro.hook"), "utf8")).resolves.toContain('"promptSubmit"');
    await expect(readFile(join(root, ".kiro", "steering", "harnix.md"), "utf8")).resolves.toContain("Harnix");
    await expect(readFile(join(root, ".agents", "skills", "harnix-implement", "SKILL.md"), "utf8")).resolves.toContain("name: harnix-implement");
    const hooks = JSON.parse(await readFile(join(root, ".codex", "hooks.json"), "utf8")) as { hooks: { UserPromptSubmit: Array<{ command: string }> } };
    expect(hooks.hooks.UserPromptSubmit.map((hook) => hook.command)).toEqual(["user-command", "harnix internal context --platform codex"]);
    await expect(readFile(join(root, ".codex", "config.toml"), "utf8")).resolves.toBe("model = \"user-model\"\n\n[other]\nvalue = true\n\n[harnix]\nenabled = true\n");
  });

  it("writes only Antigravity's managed project guidance and skills", async () => {
    const root = await fixture();
    await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam" }));

    await writeFile(join(root, "GEMINI.md"), "# User guidance\n");
    const result = await setupPlatforms({ platforms: ["antigravity"], root, versionLookup: async () => undefined });

    expect(result.configured).toEqual(["antigravity"]);
    expect(result.warnings).toContain("Antigravity executable 'agy' was not found; generated project guidance remains usable offline.");
    await expect(readFile(join(root, "GEMINI.md"), "utf8")).resolves.toContain("# User guidance");
    await expect(readFile(join(root, ".gemini", "skills", "harnix-implement", "SKILL.md"), "utf8")).resolves.toContain("name: harnix-implement");
    await expect(readFile(join(root, ".gemini", "settings.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(root, ".gemini", "hooks.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("sets up all supported platforms without duplicate hooks or machine paths", async () => {
    const root = await fixture(); await writeConfig(join(root, ".harnix", "config.yaml"), createConfig({ developer: "tam", languages: ["vue"] }));
    await setupPlatforms({ root, platforms: ["kiro", "codex", "antigravity"], versionLookup: async () => "1.1.1" });
    const hooks = JSON.parse(await readFile(join(root, ".codex", "hooks.json"), "utf8")) as { hooks: { UserPromptSubmit: Array<{ command: string }> } };
    expect(hooks.hooks.UserPromptSubmit.filter((hook) => hook.command === "harnix internal context --platform codex")).toHaveLength(1);
    for (const skill of ["harnix-brainstorm", "harnix-implement", "harnix-check", "harnix-finish-work", "harnix-continue", "harnix-research", "harnix-debug"]) for (const directory of [".kiro/skills", ".agents/skills", ".gemini/skills"]) expect(await readFile(join(root, directory, skill, "SKILL.md"), "utf8")).not.toContain(root);
  });
  it("should_reject_malformed_or_duplicate_harnix_toml_tables_when_merging", () => {
    expect(() => mergeCodexConfig("[broken\nvalue = true\n")).toThrow("malformed");
    expect(() => mergeCodexConfig("[harnix]\nenabled = true\n[harnix]\nenabled = false\n")).toThrow("duplicated");
  });

  it("should_preserve_modified_skill_when_setup_is_rerun", async () => {
    const root = await initializedRepository();
    await setupPlatforms({ root, platforms: ["kiro"] });
    const skill = join(root, ".kiro", "skills", "harnix-implement", "SKILL.md");
    await writeFile(skill, "user-owned skill\n");

    await setupPlatforms({ root, platforms: ["kiro"] });

    await expect(readFile(skill, "utf8")).resolves.toBe("user-owned skill\n");
  });

  it("should_preserve_modified_managed_blocks_when_a_platform_is_first_configured", async () => {
    const root = await initializedRepository();
    const agentsPath = join(root, "AGENTS.md");
    await writeFile(
      agentsPath,
      (await readFile(agentsPath, "utf8")).replace("This repository uses Harnix", "User customized this Harnix bootstrap"),
    );
    await writeFile(join(root, "GEMINI.md"), "<!-- harnix:begin -->\n## User Antigravity guidance\n<!-- harnix:end -->\n");

    await setupPlatforms({
      root,
      platforms: ["codex", "antigravity"],
      versionLookup: async () => "1.1.1",
    });

    await expect(readFile(agentsPath, "utf8")).resolves.toContain("User customized this Harnix bootstrap");
    await expect(readFile(join(root, "GEMINI.md"), "utf8")).resolves.toContain("## User Antigravity guidance");
  });

  it("should_preserve_codex_top_level_keys_when_merging_hooks", async () => {
    const root = await initializedRepository();
    await mkdir(join(root, ".codex"), { recursive: true });
    await writeFile(
      join(root, ".codex", "hooks.json"),
      JSON.stringify({
        version: 1,
        custom: { enabled: true },
        hooks: { UserPromptSubmit: [{ command: "user-command" }] },
      }),
    );

    await setupPlatforms({ root, platforms: ["codex"] });

    const hooks = JSON.parse(await readFile(join(root, ".codex", "hooks.json"), "utf8")) as Record<string, unknown>;
    expect(hooks.version).toBe(1);
    expect(hooks.custom).toEqual({ enabled: true });
  });

  it("should_fail_before_writes_when_codex_surface_is_malformed", async () => {
    const root = await initializedRepository();
    await mkdir(join(root, ".codex"), { recursive: true });
    await writeFile(join(root, ".codex", "hooks.json"), "{not-json");

    await expect(setupPlatforms({ root, platforms: ["codex"] })).rejects.toThrow("valid JSON");

    await expect(readConfig(join(root, ".harnix", "config.yaml"))).resolves.toMatchObject({ platforms: [] });
    await expect(access(join(root, ".agents"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_reject_external_symlink_when_setting_up_platform", async () => {
    const root = await initializedRepository();
    const external = await fixture();
    await symlink(external, join(root, ".kiro"), process.platform === "win32" ? "junction" : "dir");

    await expect(setupPlatforms({ root, platforms: ["kiro"] })).rejects.toThrow("symbolic link");
    await expect(access(join(external, "skills"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
