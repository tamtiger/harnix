import { access, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "../../src/commands/init.js";
import { uninstallProject } from "../../src/commands/uninstall.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-uninstall-");

async function initializedRepository(): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  return root;
}

describe("uninstallProject", () => {
  it("should_preserve_project_data_and_legacy_platform_surfaces_without_an_explicit_cleanup_mode", async () => {
    const root = await initializedRepository();
    const legacySkill = join(root, ".kiro", "skills", "harnix-check", "SKILL.md");
    await mkdir(join(legacySkill, ".."), { recursive: true });
    await writeFile(legacySkill, "legacy user content\n", { encoding: "utf8" });

    const result = await uninstallProject({ root });

    expect(result).toEqual({
      removed: [],
      preserved: [],
      purgeTargets: [],
      confirmationRequired: false,
    });
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("developer: tam");
    await expect(readFile(legacySkill, "utf8")).resolves.toBe("legacy user content\n");
  });

  it("should_require_confirmation_then_purge_only_project_harnix_data", async () => {
    const root = await initializedRepository();
    const legacySkill = join(root, ".agents", "skills", "harnix-check", "SKILL.md");
    await writeFile(join(root, "AGENTS.md"), "project instructions\n", { encoding: "utf8" });
    await mkdir(join(legacySkill, ".."), { recursive: true });
    await writeFile(legacySkill, "legacy user content\n", { encoding: "utf8" });

    await expect(uninstallProject({ root, purge: true })).resolves.toEqual({
      removed: [],
      preserved: [],
      purgeTargets: [".harnix"],
      confirmationRequired: true,
    });
    await expect(access(join(root, ".harnix", "config.yaml"))).resolves.toBeUndefined();

    await expect(uninstallProject({ root, purge: true, yes: true })).resolves.toEqual({
      removed: [".harnix"],
      preserved: [],
      purgeTargets: [".harnix"],
      confirmationRequired: false,
    });
    await expect(access(join(root, ".harnix"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(root, "AGENTS.md"), "utf8")).resolves.toBe("project instructions\n");
    await expect(readFile(legacySkill, "utf8")).resolves.toBe("legacy user content\n");
  });

  it("should_fail_closed_when_the_purge_target_escapes_through_a_symbolic_link", async () => {
    const root = await initializedRepository();
    const external = await temporaryRepository();
    const externalConfig = join(external, "config.yaml");
    await writeFile(externalConfig, "external data\n", { encoding: "utf8" });
    await rm(join(root, ".harnix"), { recursive: true, force: true });
    await symlink(external, join(root, ".harnix"), process.platform === "win32" ? "junction" : "dir");

    await expect(uninstallProject({ root, purge: true, yes: true })).rejects.toThrow("symbolic link");

    await expect(readFile(externalConfig, "utf8")).resolves.toBe("external data\n");
  });
});
