import { access, mkdir, readFile, readdir, symlink, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { migrateLegacyProject } from "../../src/migration/migrate.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-migrate-");

async function legacyFile(root: string, namespace: string, content: string, legacy = ".trellis"): Promise<void> {
  const path = join(root, legacy, ...namespace.split("/"));
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

describe("migrateLegacyProject", () => {
  it("should_preview_then_stage_migration_without_changing_legacy_sources", async () => {
    const root = await temporaryRepository();
    await legacyFile(root, "keep", "legacy");

    await expect(migrateLegacyProject({ root })).resolves.toMatchObject({
      legacy: [".trellis"],
      activated: false,
    });
    await expect(migrateLegacyProject({ root, apply: true })).resolves.toMatchObject({
      activated: true,
      cleaned: [],
    });
    await expect(readFile(join(root, ".trellis", "keep"), "utf8")).resolves.toBe("legacy");
  });

  it("should_copy_custom_spec_task_and_workspace_data_when_migrating_legacy_project", async () => {
    const root = await temporaryRepository();
    await legacyFile(root, "spec/guides/custom.md", "custom spec\n");
    await legacyFile(root, "tasks/legacy-task/task.json", "{\"legacy\":true}\n");
    await legacyFile(root, "workspace/tam/journal/2026-08-10.jsonl", "{\"legacy\":true}\n");

    const result = await migrateLegacyProject({ root, developer: "tam", apply: true });

    expect(result.activated).toBe(true);
    await expect(readFile(join(root, ".harnix", "spec", "guides", "custom.md"), "utf8")).resolves.toBe("custom spec\n");
    await expect(readFile(join(root, ".harnix", "tasks", "legacy-task", "task.json"), "utf8")).resolves.toContain("legacy");
    await expect(readFile(join(root, ".harnix", "workspace", "tam", "journal", "2026-08-10.jsonl"), "utf8")).resolves.toContain("legacy");
  });

  it("should_copy_and_verify_user_artifacts_when_migration_is_applied", async () => {
    const root = await temporaryRepository();
    await legacyFile(root, "spec/product.md", "spec\n");
    await legacyFile(root, "tasks/task.json", "{\"id\":\"legacy\"}\n");
    await legacyFile(root, "workspace/tam/journal/2026-08-10.jsonl", "{\"legacy\":true}\n");

    await expect(migrateLegacyProject({ root, developer: "tam", apply: true })).resolves.toMatchObject({ activated: true, staged: true });
    await expect(readFile(join(root, ".harnix", "spec", "product.md"), "utf8")).resolves.toBe("spec\n");
    await expect(readFile(join(root, ".harnix", "tasks", "task.json"), "utf8")).resolves.toContain("legacy");
    await expect(readFile(join(root, ".trellis", "spec", "product.md"), "utf8")).resolves.toBe("spec\n");
  });

  it("should_refuse_activation_when_legacy_namespaces_conflict", async () => {
    const root = await temporaryRepository();
    await legacyFile(root, "spec/product.md", "one", ".trellis");
    await legacyFile(root, "spec/product.md", "two", ".trellis-pro");

    const result = await migrateLegacyProject({ root, apply: true });

    expect(result).toMatchObject({ activated: false, conflicts: [".harnix/spec/product.md"] });
    await expect(access(join(root, ".harnix"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_remove_only_discovered_legacy_roots_when_cleanup_is_explicit", async () => {
    const root = await temporaryRepository();
    await legacyFile(root, "spec/product.md", "spec");
    await writeFile(join(root, "keep.txt"), "user");

    await expect(migrateLegacyProject({ root, apply: true, cleanupLegacy: true })).resolves.toMatchObject({ activated: true, cleaned: [".trellis"] });
    await expect(access(join(root, ".trellis"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(root, "keep.txt"), "utf8")).resolves.toBe("user");
  });

  it("should_preserve_legacy_root_when_cleanup_cannot_verify_every_source_file", async () => {
    const root = await temporaryRepository();
    await legacyFile(root, "spec/product.md", "spec");
    await legacyFile(root, "notes/unmigrated.md", "keep this user content");

    const result = await migrateLegacyProject({ root, apply: true, cleanupLegacy: true });

    expect(result).toMatchObject({ activated: true, cleaned: [] });
    await expect(readFile(join(root, ".harnix", "spec", "product.md"), "utf8")).resolves.toBe("spec");
    await expect(readFile(join(root, ".trellis", "spec", "product.md"), "utf8")).resolves.toBe("spec");
    await expect(readFile(join(root, ".trellis", "notes", "unmigrated.md"), "utf8")).resolves.toBe("keep this user content");
  });

  it("should_abort_without_activation_or_cleanup_when_staging_verification_detects_a_mismatch", async () => {
    const root = await temporaryRepository();
    await legacyFile(root, "spec/product.md", "verified source");
    const stagePrefix = `.${basename(root)}.harnix-stage-`;

    await expect(migrateLegacyProject(
      { root, apply: true, cleanupLegacy: true },
      {
        beforeVerifyStage: async (stagedTree) => {
          await writeFile(join(stagedTree, "spec", "product.md"), "tampered staged copy");
        },
      },
    )).rejects.toThrow("Migration staging verification failed");

    await expect(access(join(root, ".harnix"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(root, ".trellis", "spec", "product.md"), "utf8")).resolves.toBe("verified source");
    expect((await readdir(dirname(root))).filter((name) => name.startsWith(stagePrefix))).toHaveLength(0);
  });

  it("should_reject_symbolic_links_without_creating_target_state", async () => {
    const root = await temporaryRepository();
    const outside = await temporaryRepository();
    await mkdir(join(root, ".trellis", "spec"), { recursive: true });
    await writeFile(join(outside, "secret.md"), "outside");
    await symlink(outside, join(root, ".trellis", "spec", "external"), "junction");

    await expect(migrateLegacyProject({ root, apply: true })).rejects.toThrow("refuses symbolic link");
    await expect(access(join(root, ".harnix"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
