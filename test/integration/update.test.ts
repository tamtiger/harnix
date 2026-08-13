import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "../../src/commands/init.js";
import { updateProject } from "../../src/commands/update.js";
import { readConfig, writeConfig } from "../../src/core/config/config.js";
import { readManifest, writeManifest } from "../../src/utils/managed-files.js";
import { sha256 } from "../../src/utils/hashing.js";
import { packageVersion } from "../../src/version.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-update-");
async function fixture(): Promise<string> { const root = await temporaryRepository(); await initializeProject({ developer: "tam", root, yes: true }); return root; }

describe("updateProject", () => {
  it("migrates config v1 and replaces only unchanged legacy guides", async () => {
    const root = await fixture(); const configPath = join(root, ".harnix", "config.yaml");
    await writeFile(configPath, [
      "generator: harnix", "schemaVersion: 1", "developer: tam", "languages: [typescript-nestjs]",
      "packages: [{ path: ., languages: [typescript-nestjs] }]", "platforms: []",
      "context: { maxCharacters: 24000, tokenApproximation: 4 }", "runtime: { research: conditional, fullContext: false }", "unknown: keep", "",
    ].join("\n"));
    const legacyPath = ".harnix/spec/guides/typescript-nestjs.md"; const legacyContent = "legacy generated\n";
    const modifiedLegacyPath = ".harnix/spec/guides/vue.md"; const modifiedLegacyOriginal = "legacy Vue generated\n";
    await writeFile(join(root, legacyPath), legacyContent); await writeFile(join(root, modifiedLegacyPath), modifiedLegacyOriginal);
    const manifestPath = join(root, ".harnix", ".template-hashes.json"); const manifest = await readManifest(manifestPath);
    await writeManifest(manifestPath, { ...manifest, entries: [...manifest.entries,
      { path: legacyPath, sourceId: "rules-typescript-nestjs", scope: "project" as const, generatedHash: sha256(legacyContent), generatorVersion: "0.6.0" },
      { path: modifiedLegacyPath, sourceId: "rules-vue", scope: "project" as const, generatedHash: sha256(modifiedLegacyOriginal), generatorVersion: "0.6.0" },
    ].sort((a, b) => a.path.localeCompare(b.path)) });
    await writeFile(join(root, modifiedLegacyPath), "user-modified legacy Vue guidance\n");

    const result = await updateProject({ root });

    expect(result.deleted).toContain(legacyPath);
    expect(result.preserved).toContain(modifiedLegacyPath);
    await expect(access(join(root, legacyPath))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(root, modifiedLegacyPath), "utf8")).resolves.toBe("user-modified legacy Vue guidance\n");
    await expect(readFile(join(root, ".harnix", "spec", "guides", "languages", "typescript", "engineering.md"), "utf8")).resolves.toContain("TypeScript");
    await expect(readFile(join(root, ".harnix", "spec", "guides", "technologies", "framework", "nestjs", "engineering.md"), "utf8")).resolves.toContain("NestJS");
    const config = await readFile(configPath, "utf8"); expect(config).toContain("schemaVersion: 2"); expect(config).toContain("unknown: keep");
  });

  it("preserves user edits and requires --restore for user-deleted managed files", async () => {
    const root = await fixture(); const workflow = join(root, ".harnix", "workflow.md");
    await unlink(workflow);
    const deleted = await updateProject({ root });
    expect(deleted.deleted).toContain(".harnix/workflow.md"); await expect(access(workflow)).rejects.toMatchObject({ code: "ENOENT" });
    await updateProject({ root, restoreDeleted: true }); await expect(readFile(workflow, "utf8")).resolves.toContain("Harnix workflow");
    await writeFile(join(root, ".harnix", "spec", "guides", "common", "engineering.md"), "my rules\n");
    await updateProject({ root }); await expect(readFile(join(root, ".harnix", "spec", "guides", "common", "engineering.md"), "utf8")).resolves.toBe("my rules\n");
  });
  it("does not touch tasks, journals, or unrelated files", async () => {
    const root = await fixture();
    await Promise.all([
      mkdir(join(root, ".harnix", "tasks"), { recursive: true }),
      mkdir(join(root, ".harnix", "workspace", "tam"), { recursive: true }),
    ]);
    await writeFile(join(root, ".harnix", "tasks", "keep.txt"), "task"); await writeFile(join(root, ".harnix", "workspace", "tam", "keep.jsonl"), "journal"); await writeFile(join(root, "keep.txt"), "user");
    await updateProject({ root });
    await expect(readFile(join(root, ".harnix", "tasks", "keep.txt"), "utf8")).resolves.toBe("task"); await expect(readFile(join(root, ".harnix", "workspace", "tam", "keep.jsonl"), "utf8")).resolves.toBe("journal"); await expect(readFile(join(root, "keep.txt"), "utf8")).resolves.toBe("user");
  });
  it("should_remove_unchanged_obsolete_file_when_template_is_no_longer_desired", async () => {
    const root = await fixture();
    const obsolete = join(root, ".harnix", "spec", "guides", "technologies", "framework", "vue", "engineering.md");
    const configPath = join(root, ".harnix", "config.yaml");
    const config = await readFile(configPath, "utf8");
    await writeFile(configPath, config.replace("technologies: []", "technologies:\n  - vue"));
    await updateProject({ root });
    await writeFile(configPath, config);
    const result = await updateProject({ root });
    expect(result.deleted).toContain(".harnix/spec/guides/technologies/framework/vue/engineering.md");
    await expect(access(obsolete)).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("should_preserve_modified_obsolete_file_and_its_manifest_entry", async () => {
    const root = await fixture();
    const obsolete = join(root, ".harnix", "spec", "guides", "technologies", "framework", "vue", "engineering.md");
    const configPath = join(root, ".harnix", "config.yaml");
    const baseConfig = await readFile(configPath, "utf8");
    await writeFile(configPath, baseConfig.replace("technologies: []", "technologies:\n  - vue"));
    await updateProject({ root });
    await writeFile(obsolete, "user-owned Vue guidance\n");
    await writeFile(configPath, baseConfig);

    const result = await updateProject({ root });
    const manifest = await readFile(join(root, ".harnix", ".template-hashes.json"), "utf8");

    expect(result.preserved).toContain(".harnix/spec/guides/technologies/framework/vue/engineering.md");
    await expect(readFile(obsolete, "utf8")).resolves.toBe("user-owned Vue guidance\n");
    expect(manifest).toContain(".harnix/spec/guides/technologies/framework/vue/engineering.md");
  });

  it("should_keep_legacy_platform_surfaces_out_of_project_update_ownership", async () => {
    const root = await fixture();
    const configPath = join(root, ".harnix", "config.yaml");
    const manifestPath = join(root, ".harnix", ".template-hashes.json");
    const legacyPath = ".kiro/skills/harnix-implement/SKILL.md";
    const legacyContent = "legacy platform skill\n";
    await writeConfig(configPath, { ...(await readConfig(configPath)), platforms: ["kiro"] });
    await mkdir(join(root, ".kiro", "skills", "harnix-implement"), { recursive: true });
    await writeFile(join(root, legacyPath), legacyContent, { encoding: "utf8" });
    const manifest = await readManifest(manifestPath);
    await writeManifest(manifestPath, {
      ...manifest,
      entries: [...manifest.entries, {
        path: legacyPath,
        sourceId: "harnix-implement",
        scope: "kiro" as const,
        generatedHash: sha256(legacyContent),
        generatorVersion: "0.5.0",
      }].sort((left, right) => left.path.localeCompare(right.path)),
    });

    await updateProject({ root });

    await expect(readFile(join(root, legacyPath), "utf8")).resolves.toBe(legacyContent);
    await expect(access(join(root, ".kiro", "hooks", "harnix-context.json"))).rejects.toMatchObject({ code: "ENOENT" });
    expect((await readManifest(manifestPath)).entries).toContainEqual(expect.objectContaining({ path: legacyPath, scope: "kiro" }));
  });

  it("reports metadata-only reconciliation without claiming a managed file update", async () => {
    const root = await fixture();
    const manifestPath = join(root, ".harnix", ".template-hashes.json");
    const manifest = await readManifest(manifestPath);
    await writeManifest(manifestPath, {
      ...manifest,
      entries: manifest.entries.map((entry) => entry.path === ".harnix/workflow.md"
        ? { ...entry, generatorVersion: "0.0.0" }
        : entry),
    });

    const result = await updateProject({ root });
    const reconciled = await readManifest(manifestPath);

    expect(result.updated).not.toContain(".harnix/workflow.md");
    expect(result.metadataUpdated).toEqual([".harnix/workflow.md"]);
    expect(reconciled.entries.find(({ path }) => path === ".harnix/workflow.md")?.generatorVersion).toBe(packageVersion);
  });
});
