import { access, symlink } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "../../src/commands/init.js";
import { setupPlatforms } from "../../src/commands/setup.js";
import { uninstallProject } from "../../src/commands/uninstall.js";
import { updateProject } from "../../src/commands/update.js";
import { createConfig, readConfig, writeConfig } from "../../src/core/config/config.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-project-state-");

async function initializedRepository(): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ developer: "tam", root, yes: true });
  return root;
}

describe("project lifecycle state safety", () => {
  it("should_not_reinstall_platform_when_update_runs_after_uninstall", async () => {
    const root = await initializedRepository();
    await setupPlatforms({ root, platforms: ["kiro"] });
    const hook = join(root, ".kiro", "hooks", "harnix-context.kiro.hook");

    await uninstallProject({ root });
    await updateProject({ root });

    await expect(access(hook)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readConfig(join(root, ".harnix", "config.yaml"))).resolves.toMatchObject({ platforms: [] });
  });

  it("should_reject_external_harnix_symlink_before_reading_or_writing_lifecycle_state", async () => {
    const root = await temporaryRepository();
    const external = await temporaryRepository();
    await writeConfig(join(external, "config.yaml"), createConfig({ developer: "tam" }));
    await symlink(external, join(root, ".harnix"), process.platform === "win32" ? "junction" : "dir");

    await expect(initializeProject({ developer: "tam", root, yes: true })).rejects.toThrow("symbolic link");
    await expect(updateProject({ root })).rejects.toThrow("symbolic link");
    await expect(setupPlatforms({ root, platforms: ["kiro"] })).rejects.toThrow("symbolic link");

    await expect(access(join(root, "AGENTS.md"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(external, "workflow.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
