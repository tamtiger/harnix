import { access, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "../../src/commands/init.js";
import { searchMemory } from "../../src/commands/mem.js";
import { setupPlatforms } from "../../src/commands/setup.js";
import { uninstallProject } from "../../src/commands/uninstall.js";
import { updateProject } from "../../src/commands/update.js";
import { readConfig } from "../../src/core/config/config.js";
import { migrateLegacyProject } from "../../src/migration/migrate.js";
import { useTemporaryRepositories } from "../helpers/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-refactor-");

describe("lifecycle regression safety", () => {
  it("should_copy_and_verify_user_data_when_migrating_legacy_project", async () => {
    const root = await temporaryRepository();
    await writeLegacyFile(root, "spec/guides/custom.md", "custom spec\n");
    await writeLegacyFile(root, "tasks/legacy-task/task.json", "{\"legacy\":true}\n");
    await writeLegacyFile(root, "workspace/tam/journal/2026-08-10.jsonl", "{\"legacy\":true}\n");

    const result = await migrateLegacyProject({ root, developer: "tam", apply: true });

    expect(result.activated).toBe(true);
    await expect(readFile(join(root, ".harnix", "spec", "guides", "custom.md"), "utf8")).resolves.toBe("custom spec\n");
    await expect(readFile(join(root, ".harnix", "tasks", "legacy-task", "task.json"), "utf8")).resolves.toContain("legacy");
    await expect(readFile(join(root, ".harnix", "workspace", "tam", "journal", "2026-08-10.jsonl"), "utf8")).resolves.toContain("legacy");
  });

  it("should_preserve_modified_skill_when_setup_is_rerun", async () => {
    const root = await initializedRepository();
    await setupPlatforms({ root, platforms: ["kiro"] });
    const skill = join(root, ".kiro", "skills", "harnix-implement", "SKILL.md");
    await writeFile(skill, "user-owned skill\n");

    await setupPlatforms({ root, platforms: ["kiro"] });

    await expect(readFile(skill, "utf8")).resolves.toBe("user-owned skill\n");
  });

  it("should_preserve_codex_top_level_keys_when_merging_hooks", async () => {
    const root = await initializedRepository();
    await mkdir(join(root, ".codex"), { recursive: true });
    await writeFile(join(root, ".codex", "hooks.json"), JSON.stringify({ version: 1, custom: { enabled: true }, hooks: { UserPromptSubmit: [{ command: "user-command" }] } }));

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

  it("should_not_mutate_any_surface_when_purge_needs_confirmation", async () => {
    const root = await initializedRepository();
    await setupPlatforms({ root, platforms: ["kiro"] });
    const skill = join(root, ".kiro", "skills", "harnix-check", "SKILL.md");
    const before = await readFile(skill, "utf8");

    const result = await uninstallProject({ root, purge: true });

    expect(result.confirmationRequired).toBe(true);
    await expect(readFile(skill, "utf8")).resolves.toBe(before);
    await expect(access(join(root, ".harnix", "config.yaml"))).resolves.toBeUndefined();
  });

  it("should_not_reinstall_platform_when_update_runs_after_uninstall", async () => {
    const root = await initializedRepository();
    await setupPlatforms({ root, platforms: ["kiro"] });
    const hook = join(root, ".kiro", "hooks", "harnix-context.kiro.hook");

    await uninstallProject({ root });
    await updateProject({ root });

    await expect(access(hook)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readConfig(join(root, ".harnix", "config.yaml"))).resolves.toMatchObject({ platforms: [] });
  });

  it("should_preserve_modified_injection_when_uninstalling", async () => {
    const root = await initializedRepository();
    await setupPlatforms({ root, platforms: ["codex"] });
    const agentsPath = join(root, "AGENTS.md");
    const modified = (await readFile(agentsPath, "utf8")).replace("## Harnix", "## Harnix user customization");
    await writeFile(agentsPath, modified);

    const result = await uninstallProject({ root });

    expect(result.preserved).toContain("AGENTS.md");
    await expect(readFile(agentsPath, "utf8")).resolves.toContain("user customization");
  });

  it("should_reject_external_symlink_when_setting_up_platform", async () => {
    const root = await initializedRepository();
    const external = await temporaryRepository();
    await symlink(external, join(root, ".kiro"), process.platform === "win32" ? "junction" : "dir");

    await expect(setupPlatforms({ root, platforms: ["kiro"] })).rejects.toThrow("symbolic link");
    await expect(access(join(external, "skills"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_reject_unsafe_user_when_searching_memory", async () => {
    const root = await initializedRepository();
    await expect(searchMemory({ root, user: "../../outside" })).rejects.toThrow("workspace ID");
  });

  it("should_skip_malformed_journal_shape_when_searching_memory", async () => {
    const root = await initializedRepository();
    const journal = join(root, ".harnix", "workspace", "tam", "journal");
    await mkdir(journal, { recursive: true });
    await writeFile(join(journal, "2026-08-10.jsonl"), "{\"generator\":\"harnix\",\"schemaVersion\":1,\"recordedAt\":7}\n");

    await expect(searchMemory({ root })).resolves.toEqual({ entries: [], malformed: 1 });
  });
});

async function initializedRepository(): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  return root;
}

async function writeLegacyFile(root: string, relativePath: string, content: string): Promise<void> {
  const destination = join(root, ".trellis", ...relativePath.split("/"));
  await mkdir(join(destination, ".."), { recursive: true });
  await writeFile(destination, content);
}
