import { access, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "../../src/commands/init.js";
import { setupPlatforms } from "../../src/commands/setup.js";
import { uninstallProject } from "../../src/commands/uninstall.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-uninstall-");

async function initializedRepository(): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  return root;
}

describe("uninstallProject", () => {
  it("should_uninstall_only_unchanged_managed_platform_files_and_require_purge_confirmation", async () => {
    const root = await initializedRepository();
    await setupPlatforms({ root, platforms: ["kiro"] });
    const skill = join(root, ".kiro", "skills", "harnix-implement", "SKILL.md");
    await writeFile(skill, "user skill\n");

    const result = await uninstallProject({ root });

    expect(result.preserved).toContain(".kiro/skills/harnix-implement/SKILL.md");
    await expect(readFile(skill, "utf8")).resolves.toBe("user skill\n");
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("developer: tam");
    await expect(uninstallProject({ root, purge: true })).resolves.toMatchObject({
      confirmationRequired: true,
      purgeTargets: [".harnix"],
    });
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

  it("should_fail_before_removing_platform_files_when_uninstall_path_is_unsafe", async () => {
    const root = await initializedRepository();
    const external = await temporaryRepository();
    await setupPlatforms({ root, platforms: ["kiro", "codex"] });
    const codexSkill = join(root, ".agents", "skills", "harnix-implement", "SKILL.md");
    await rm(join(root, ".kiro"), { recursive: true, force: true });
    await symlink(external, join(root, ".kiro"), process.platform === "win32" ? "junction" : "dir");

    await expect(uninstallProject({ root, yes: true })).rejects.toThrow("symbolic link");

    await expect(access(codexSkill)).resolves.toBeUndefined();
    await expect(access(join(external, "skills"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
