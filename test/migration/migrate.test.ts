import { access, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { migrateLegacyProject } from "../../src/migration/migrate.js";
import { useTemporaryRepositories } from "../helpers/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-migrate-");

async function legacyFile(root: string, namespace: string, content: string, legacy = ".trellis"): Promise<void> {
  const path = join(root, legacy, ...namespace.split("/"));
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

describe("migrateLegacyProject", () => {
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
