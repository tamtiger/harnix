import { access } from "node:fs/promises";

import { readConfig } from "../core/config/config.js";
import { commonRules, languageRule } from "../rules/rules.js";
import { workflowTemplate } from "../templates/harnix/workflow.js";
import { reconcileManagedFiles, readManifest, writeManifest, type DesiredManagedFile, type ManagedManifest } from "../utils/managed-files.js";
import { sha256 } from "../utils/hashing.js";
import { kiroDesiredFiles } from "../configurators/kiro.js";
import { antigravityDesiredFiles } from "../configurators/antigravity.js";
import { codexDesiredFiles } from "../configurators/codex.js";
import { packageVersion } from "../version.js";
import { agentsTemplate } from "../templates/harnix/agents.js";
import { resolveSafeHarnixPath } from "../utils/paths.js";

export interface UpdateProjectOptions { root: string; restoreDeleted?: boolean | undefined; }
export interface UpdateProjectResult { created: string[]; updated: string[]; preserved: string[]; deleted: string[]; obsolete: string[]; }

/** Reconciles complete, Harnix-owned files only. Injection surfaces stay user-owned. */
export async function updateProject(options: UpdateProjectOptions): Promise<UpdateProjectResult> {
  const configPath = await resolveSafeHarnixPath(options.root, "config.yaml");
  const manifestPath = await resolveSafeHarnixPath(options.root, ".template-hashes.json");
  const config = await readConfig(configPath);
  const manifest = await loadManifest(manifestPath);
  const desired = desiredFiles(config.platforms, config.languages);
  const reconciled = await reconcileManagedFiles(options.root, manifest, desired, {
    generatorVersion: packageVersion,
    removeObsolete: true,
    restoreDeleted: options.restoreDeleted,
  });
  await writeManifest(manifestPath, reconciled.manifest);
  return reconciled.result;
}

/** Records files immediately after setup has written the exact packaged templates. */
export async function baselineManagedTemplates(root: string): Promise<void> {
  const configPath = await resolveSafeHarnixPath(root, "config.yaml");
  const manifestPath = await resolveSafeHarnixPath(root, ".template-hashes.json");
  const config = await readConfig(configPath);
  const current = await loadManifest(manifestPath);
  const desired = desiredFiles(config.platforms, config.languages);
  const paths = new Set(desired.map((file) => file.entry.path));
  const entries = [...current.entries.filter((entry) => !paths.has(entry.path)), ...desired.map(({ entry, content }) => ({ ...entry, generatedHash: sha256(content), generatorVersion: packageVersion }))].sort((left, right) => left.path.localeCompare(right.path));
  await writeManifest(manifestPath, { generator: "harnix", schemaVersion: 1, entries });
}

export function desiredFiles(platforms: string[], languages: string[]): DesiredManagedFile[] {
  const files: DesiredManagedFile[] = [managed("AGENTS.md", "agents-bootstrap", "project", agentsTemplate), managed(".harnix/workflow.md", "workflow", "project", workflowTemplate), managed(".harnix/spec/guides/common-rules.md", "common-rules", "project", commonRules)];
  for (const language of languages) {
    const content = languageRule(language);
    if (content) files.push(managed(`.harnix/spec/guides/${language}.md`, `rules-${language}`, "project", content));
  }
  for (const platform of platforms) {
    if (platform === "kiro") files.push(...kiroDesiredFiles(languages));
    else if (platform === "antigravity") files.push(...antigravityDesiredFiles());
    else if (platform === "codex") files.push(...codexDesiredFiles());
  }
  return files;
}

function managed(path: string, sourceId: string, scope: "project" | "kiro" | "antigravity" | "codex", content: string): DesiredManagedFile {
  return { entry: { path, sourceId, scope, generatedHash: "0".repeat(64), generatorVersion: packageVersion }, content };
}

async function loadManifest(path: string): Promise<ManagedManifest> {
  try { await access(path); return await readManifest(path); }
  catch (error: unknown) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return { generator: "harnix", schemaVersion: 1, entries: [] }; throw error; }
}
