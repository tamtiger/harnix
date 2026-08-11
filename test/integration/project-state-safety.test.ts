import { access, symlink } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "../../src/commands/init.js";
import { updateProject } from "../../src/commands/update.js";
import { createConfig, writeConfig } from "../../src/core/config/config.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-project-state-");

describe("project lifecycle state safety", () => {
  it("should_not_create_any_platform_local_surface_when_project_update_runs", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });

    await updateProject({ root });

    await expect(access(join(root, ".kiro"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root, ".gemini"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root, ".codex"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root, ".agents", "skills"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_reject_external_harnix_symlink_before_reading_or_writing_lifecycle_state", async () => {
    const root = await temporaryRepository();
    const external = await temporaryRepository();
    await writeConfig(join(external, "config.yaml"), createConfig({ developer: "tam" }));
    await symlink(external, join(root, ".harnix"), process.platform === "win32" ? "junction" : "dir");

    await expect(initializeProject({ developer: "tam", root, yes: true })).rejects.toThrow("symbolic link");
    await expect(updateProject({ root })).rejects.toThrow("symbolic link");

    await expect(access(join(root, "AGENTS.md"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(external, "workflow.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
