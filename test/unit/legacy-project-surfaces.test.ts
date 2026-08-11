import { access, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cleanupLegacyProjectSurfaces } from "../../src/commands/legacy-project-surfaces.js";
import { sha256 } from "../../src/utils/hashing.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-legacy-cleanup-");

interface ManifestEntry {
  path: string;
  sourceId: string;
  scope: "project" | "kiro" | "antigravity" | "codex";
  generatedHash: string;
  generatorVersion: string;
}

async function writeProjectManifest(root: string, entries: ManifestEntry[]): Promise<void> {
  await mkdir(join(root, ".harnix"), { recursive: true });
  await writeFile(join(root, ".harnix", ".template-hashes.json"), `${JSON.stringify({ generator: "harnix", schemaVersion: 1, entries }, null, 2)}\n`);
}

describe("legacy project surface cleanup", () => {
  it("previews only canonical manifest-proven legacy targets and never mutates without confirmation", async () => {
    const root = await temporaryRepository();
    const skillPath = join(root, ".kiro", "skills", "harnix-check", "SKILL.md");
    await mkdir(join(skillPath, ".."), { recursive: true });
    await writeFile(skillPath, "generated skill\n");
    await writeFile(join(root, "AGENTS.md"), "root bootstrap remains\n");
    await writeFile(join(root, "GEMINI.md"), "untracked instruction remains\n");
    await mkdir(join(root, ".codex"), { recursive: true });
    await writeFile(join(root, ".codex", "hooks.json"), "{\"user\":true}\n");
    await writeProjectManifest(root, [
      { path: ".harnix/workflow.md", sourceId: "workflow", scope: "project", generatedHash: sha256("workflow\n"), generatorVersion: "0.5.0" },
      { path: ".kiro/skills/harnix-check/SKILL.md", sourceId: "harnix-check", scope: "kiro", generatedHash: sha256("generated skill\n"), generatorVersion: "0.5.0" },
    ]);

    const result = await cleanupLegacyProjectSurfaces({ root });

    expect(result).toEqual({
      scope: "legacy-project-surfaces",
      targets: [".kiro/skills/harnix-check/SKILL.md"],
      removed: [],
      preserved: [],
      confirmationRequired: true,
    });
    await expect(readFile(skillPath, "utf8")).resolves.toBe("generated skill\n");
    await expect(readFile(join(root, "AGENTS.md"), "utf8")).resolves.toBe("root bootstrap remains\n");
    await expect(readFile(join(root, "GEMINI.md"), "utf8")).resolves.toBe("untracked instruction remains\n");
    await expect(readFile(join(root, ".codex", "hooks.json"), "utf8")).resolves.toBe("{\"user\":true}\n");
  });

  it("does not let non-project manifest scopes authorize arbitrary files or the root AGENTS bootstrap", async () => {
    const root = await temporaryRepository();
    const canonicalSkillPath = join(root, ".agents", "skills", "harnix-check", "SKILL.md");
    const wrongScopeSkillPath = join(root, ".kiro", "skills", "harnix-wrong-scope", "SKILL.md");
    const agentsPath = join(root, "AGENTS.md");
    const readmePath = join(root, "README.md");
    await mkdir(join(canonicalSkillPath, ".."), { recursive: true });
    await mkdir(join(wrongScopeSkillPath, ".."), { recursive: true });
    await writeFile(canonicalSkillPath, "generated skill\n");
    await writeFile(wrongScopeSkillPath, "wrong scope skill\n");
    await writeFile(agentsPath, "current init bootstrap\n");
    await writeFile(readmePath, "project documentation\n");
    await writeProjectManifest(root, [
      { path: ".agents/skills/harnix-check/SKILL.md", sourceId: "harnix-check", scope: "codex", generatedHash: sha256("generated skill\n"), generatorVersion: "0.5.0" },
      { path: ".kiro/skills/harnix-wrong-scope/SKILL.md", sourceId: "harnix-wrong-scope", scope: "codex", generatedHash: sha256("wrong scope skill\n"), generatorVersion: "0.5.0" },
      { path: "AGENTS.md", sourceId: "agents-bootstrap", scope: "codex", generatedHash: sha256("current init bootstrap\n"), generatorVersion: "0.5.0" },
      { path: "README.md", sourceId: "documentation", scope: "antigravity", generatedHash: sha256("project documentation\n"), generatorVersion: "0.5.0" },
    ]);

    expect(await cleanupLegacyProjectSurfaces({ root })).toEqual({
      scope: "legacy-project-surfaces",
      targets: [".agents/skills/harnix-check/SKILL.md"],
      removed: [],
      preserved: [],
      confirmationRequired: true,
    });

    const result = await cleanupLegacyProjectSurfaces({ root, yes: true });

    expect(result).toEqual({
      scope: "legacy-project-surfaces",
      targets: [".agents/skills/harnix-check/SKILL.md"],
      removed: [".agents/skills/harnix-check/SKILL.md"],
      preserved: [],
      confirmationRequired: false,
    });
    await expect(access(canonicalSkillPath)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(wrongScopeSkillPath, "utf8")).resolves.toBe("wrong scope skill\n");
    await expect(readFile(agentsPath, "utf8")).resolves.toBe("current init bootstrap\n");
    await expect(readFile(readmePath, "utf8")).resolves.toBe("project documentation\n");
    const manifest = JSON.parse(await readFile(join(root, ".harnix", ".template-hashes.json"), "utf8")) as { entries: ManifestEntry[] };
    expect(manifest.entries.map((entry) => entry.path)).toEqual([".kiro/skills/harnix-wrong-scope/SKILL.md", "AGENTS.md", "README.md"]);
  });

  it("removes only unchanged regular manifest-proven files and retains ownership for modified or deleted entries", async () => {
    const root = await temporaryRepository();
    const unchangedPath = join(root, ".kiro", "hooks", "harnix-context.kiro.hook");
    const modifiedPath = join(root, ".gemini", "skills", "harnix-check", "SKILL.md");
    await mkdir(join(unchangedPath, ".."), { recursive: true });
    await mkdir(join(modifiedPath, ".."), { recursive: true });
    await writeFile(unchangedPath, "generated hook\n");
    await writeFile(modifiedPath, "user changed skill\n");
    await writeProjectManifest(root, [
      { path: ".agents/skills/harnix-check/SKILL.md", sourceId: "harnix-check", scope: "codex", generatedHash: sha256("missing\n"), generatorVersion: "0.5.0" },
      { path: ".gemini/skills/harnix-check/SKILL.md", sourceId: "harnix-check", scope: "antigravity", generatedHash: sha256("generated skill\n"), generatorVersion: "0.5.0" },
      { path: ".harnix/workflow.md", sourceId: "workflow", scope: "project", generatedHash: sha256("workflow\n"), generatorVersion: "0.5.0" },
      { path: ".kiro/hooks/harnix-context.kiro.hook", sourceId: "kiro-context-hook", scope: "kiro", generatedHash: sha256("generated hook\n"), generatorVersion: "0.5.0" },
    ]);

    const result = await cleanupLegacyProjectSurfaces({ root, yes: true });

    expect(result).toEqual({
      scope: "legacy-project-surfaces",
      targets: [".agents/skills/harnix-check/SKILL.md", ".gemini/skills/harnix-check/SKILL.md", ".kiro/hooks/harnix-context.kiro.hook"],
      removed: [".kiro/hooks/harnix-context.kiro.hook"],
      preserved: [".agents/skills/harnix-check/SKILL.md", ".gemini/skills/harnix-check/SKILL.md"],
      confirmationRequired: false,
    });
    await expect(access(unchangedPath)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(modifiedPath, "utf8")).resolves.toBe("user changed skill\n");
    const manifest = JSON.parse(await readFile(join(root, ".harnix", ".template-hashes.json"), "utf8")) as { entries: ManifestEntry[] };
    expect(manifest.entries.map((entry) => entry.path)).toEqual([
      ".agents/skills/harnix-check/SKILL.md",
      ".gemini/skills/harnix-check/SKILL.md",
      ".harnix/workflow.md",
    ]);
  });

  it("preserves unsafe and non-regular manifest targets without following or unlinking them", async () => {
    const root = await temporaryRepository();
    const external = await temporaryRepository();
    const unsafeSkillPath = join(external, "skills", "harnix-unsafe", "SKILL.md");
    const nonRegularSkillPath = join(root, ".gemini", "skills", "harnix-directory", "SKILL.md");
    await mkdir(join(unsafeSkillPath, ".."), { recursive: true });
    await writeFile(unsafeSkillPath, "external generated\n");
    await symlink(external, join(root, ".kiro"), process.platform === "win32" ? "junction" : "dir");
    await mkdir(nonRegularSkillPath, { recursive: true });
    await writeProjectManifest(root, [
      { path: ".gemini/skills/harnix-directory/SKILL.md", sourceId: "harnix-directory", scope: "antigravity", generatedHash: sha256("directory\n"), generatorVersion: "0.5.0" },
      { path: ".kiro/skills/harnix-unsafe/SKILL.md", sourceId: "harnix-unsafe", scope: "kiro", generatedHash: sha256("external generated\n"), generatorVersion: "0.5.0" },
    ]);

    const result = await cleanupLegacyProjectSurfaces({ root, yes: true });

    expect(result.targets).toEqual([".gemini/skills/harnix-directory/SKILL.md", ".kiro/skills/harnix-unsafe/SKILL.md"]);
    expect(result.removed).toEqual([]);
    expect(result.preserved).toEqual([".gemini/skills/harnix-directory/SKILL.md", ".kiro/skills/harnix-unsafe/SKILL.md"]);
    await expect(readFile(unsafeSkillPath, "utf8")).resolves.toBe("external generated\n");
    await expect(access(nonRegularSkillPath)).resolves.toBeUndefined();
  });

  it("fails before cleanup when the project manifest is corrupt", async () => {
    const root = await temporaryRepository();
    const target = join(root, ".kiro", "hooks", "harnix-context.kiro.hook");
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, "generated hook\n");
    await mkdir(join(root, ".harnix"), { recursive: true });
    await writeFile(join(root, ".harnix", ".template-hashes.json"), "not-a-manifest");

    await expect(cleanupLegacyProjectSurfaces({ root, yes: true })).rejects.toThrow("manifest");
    await expect(readFile(target, "utf8")).resolves.toBe("generated hook\n");
  });
});
