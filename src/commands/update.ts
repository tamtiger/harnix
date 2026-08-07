import { access } from "node:fs/promises";
import { join } from "node:path";

import { readConfig } from "../core/config/config.js";
import { commonRules, languageRule } from "../rules/rules.js";
import { renderSkill, workflowSkills, workflowTemplate } from "../templates/harnix/workflow.js";
import { reconcileManagedFiles, readManifest, writeManifest, type DesiredManagedFile, type ManagedManifest } from "../utils/managed-files.js";
import { sha256 } from "../utils/hashing.js";

export interface UpdateProjectOptions { root: string; restoreDeleted?: boolean | undefined; }
export interface UpdateProjectResult { created: string[]; updated: string[]; preserved: string[]; deleted: string[]; obsolete: string[]; }

/** Reconciles complete, Harnix-owned files only. Injection surfaces stay user-owned. */
export async function updateProject(options: UpdateProjectOptions): Promise<UpdateProjectResult> {
  const config = await readConfig(join(options.root, ".harnix", "config.yaml"));
  const manifestPath = join(options.root, ".harnix", ".template-hashes.json");
  const manifest = await loadManifest(manifestPath);
  const desired = desiredFiles(config.platforms, config.languages);
  const reconciled = await reconcileManagedFiles(options.root, manifest, desired, {
    generatorVersion: "0.1.0",
    restoreDeleted: options.restoreDeleted,
  });
  await writeManifest(manifestPath, reconciled.manifest);
  return reconciled.result;
}

/** Records files immediately after setup has written the exact packaged templates. */
export async function baselineManagedTemplates(root: string): Promise<void> {
  const config = await readConfig(join(root, ".harnix", "config.yaml"));
  const manifestPath = join(root, ".harnix", ".template-hashes.json");
  const current = await loadManifest(manifestPath);
  const desired = desiredFiles(config.platforms, config.languages);
  const paths = new Set(desired.map((file) => file.entry.path));
  const entries = [...current.entries.filter((entry) => !paths.has(entry.path)), ...desired.map(({ entry, content }) => ({ ...entry, generatedHash: sha256(content), generatorVersion: "0.1.0" }))].sort((left, right) => left.path.localeCompare(right.path));
  await writeManifest(manifestPath, { generator: "harnix", schemaVersion: 1, entries });
}

export function desiredFiles(platforms: string[], languages: string[]): DesiredManagedFile[] {
  const files: DesiredManagedFile[] = [managed(".harnix/workflow.md", "workflow", "project", workflowTemplate), managed(".harnix/spec/guides/common-rules.md", "common-rules", "project", commonRules)];
  for (const language of languages) {
    const content = languageRule(language);
    if (content) files.push(managed(`.harnix/spec/guides/${language}.md`, `rules-${language}`, "project", content));
  }
  for (const platform of platforms) {
    const scope = platform as "kiro" | "antigravity" | "codex";
    const base = platform === "codex" ? ".agents/skills" : platform === "kiro" ? ".kiro/skills" : ".gemini/skills";
    for (const skill of workflowSkills) files.push(managed(`${base}/${skill.name}/SKILL.md`, skill.name, scope, renderSkill(skill)));
    if (platform === "kiro") {
      files.push(managed(".kiro/steering/harnix.md", "kiro-steering", "kiro", `# Harnix\n\nUse the project-local Harnix workflow and relevant .harnix context.\n\nDetected languages: ${languages.join(", ") || "none"}.\n`));
      files.push(managed(".kiro/hooks/harnix-context.kiro.hook", "kiro-context-hook", "kiro", `${JSON.stringify({ version: "1.0.0", enabled: true, when: { type: "promptSubmit" }, then: { type: "runCommand", command: "harnix internal context --platform kiro" } }, null, 2)}\n`));
    }
  }
  return files;
}

function managed(path: string, sourceId: string, scope: "project" | "kiro" | "antigravity" | "codex", content: string): DesiredManagedFile {
  return { entry: { path, sourceId, scope, generatedHash: "0".repeat(64), generatorVersion: "0.1.0" }, content };
}

async function loadManifest(path: string): Promise<ManagedManifest> {
  try { await access(path); return await readManifest(path); }
  catch (error: unknown) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return { generator: "harnix", schemaVersion: 1, entries: [] }; throw error; }
}
