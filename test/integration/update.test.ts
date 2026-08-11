import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "../../src/commands/init.js";
import { updateProject } from "../../src/commands/update.js";
import { readConfig, writeConfig } from "../../src/core/config/config.js";
import { readManifest, writeManifest } from "../../src/utils/managed-files.js";
import { sha256 } from "../../src/utils/hashing.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-update-");
async function fixture(): Promise<string> { const root = await temporaryRepository(); await initializeProject({ developer: "tam", root, yes: true }); return root; }

describe("updateProject", () => {
  it("preserves user edits and requires --restore for user-deleted managed files", async () => {
    const root = await fixture(); const workflow = join(root, ".harnix", "workflow.md");
    await unlink(workflow);
    const deleted = await updateProject({ root });
    expect(deleted.deleted).toContain(".harnix/workflow.md"); await expect(access(workflow)).rejects.toMatchObject({ code: "ENOENT" });
    await updateProject({ root, restoreDeleted: true }); await expect(readFile(workflow, "utf8")).resolves.toContain("Harnix workflow");
    await writeFile(join(root, ".harnix", "spec", "guides", "common-rules.md"), "my rules\n");
    await updateProject({ root }); await expect(readFile(join(root, ".harnix", "spec", "guides", "common-rules.md"), "utf8")).resolves.toBe("my rules\n");
  });
  it("does not touch tasks, journals, or unrelated files", async () => {
    const root = await fixture();
    await writeFile(join(root, ".harnix", "tasks", "keep.txt"), "task"); await writeFile(join(root, ".harnix", "workspace", "tam", "keep.jsonl"), "journal"); await writeFile(join(root, "keep.txt"), "user");
    await updateProject({ root });
    await expect(readFile(join(root, ".harnix", "tasks", "keep.txt"), "utf8")).resolves.toBe("task"); await expect(readFile(join(root, ".harnix", "workspace", "tam", "keep.jsonl"), "utf8")).resolves.toBe("journal"); await expect(readFile(join(root, "keep.txt"), "utf8")).resolves.toBe("user");
  });
  it("should_remove_unchanged_obsolete_file_when_template_is_no_longer_desired", async () => {
    const root = await fixture();
    const obsolete = join(root, ".harnix", "spec", "guides", "vue.md");
    const configPath = join(root, ".harnix", "config.yaml");
    const config = await readFile(configPath, "utf8");
    await writeFile(configPath, config.replace("languages: []", "languages:\n  - vue"));
    await updateProject({ root });
    await writeFile(configPath, config);
    const result = await updateProject({ root });
    expect(result.deleted).toContain(".harnix/spec/guides/vue.md");
    await expect(access(obsolete)).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("should_preserve_modified_obsolete_file_and_its_manifest_entry", async () => {
    const root = await fixture();
    const obsolete = join(root, ".harnix", "spec", "guides", "vue.md");
    const configPath = join(root, ".harnix", "config.yaml");
    const baseConfig = await readFile(configPath, "utf8");
    await writeFile(configPath, baseConfig.replace("languages: []", "languages:\n  - vue"));
    await updateProject({ root });
    await writeFile(obsolete, "user-owned Vue guidance\n");
    await writeFile(configPath, baseConfig);

    const result = await updateProject({ root });
    const manifest = await readFile(join(root, ".harnix", ".template-hashes.json"), "utf8");

    expect(result.preserved).toContain(".harnix/spec/guides/vue.md");
    await expect(readFile(obsolete, "utf8")).resolves.toBe("user-owned Vue guidance\n");
    expect(manifest).toContain(".harnix/spec/guides/vue.md");
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
});
