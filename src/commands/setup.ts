import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { join } from "node:path";

import { readConfig, type PlatformId } from "../core/config/config.js";
import { atomicWriteFile } from "../utils/atomic-write.js";
import { seedRules } from "../rules/rules.js";
import { renderSkill, workflowSkills } from "../templates/harnix/workflow.js";
import { configureCodex } from "../configurators/codex.js";
import { ensureManagedWorkflow } from "../templates/harnix/managed-workflow.js";

export type VersionLookup = (executable: string, args: string[]) => Promise<string | undefined>;
export interface SetupPlatformsOptions { root: string; platforms: PlatformId[]; versionLookup?: VersionLookup; }
export interface SetupPlatformsResult { configured: PlatformId[]; skipped: PlatformId[]; warnings: string[]; }

const codexBegin = "<!-- harnix:begin -->";
const codexEnd = "<!-- harnix:end -->";

export async function setupPlatforms(options: SetupPlatformsOptions): Promise<SetupPlatformsResult> {
  if (options.platforms.length === 0) throw new Error("At least one platform must be selected.");
  const config = await readConfig(join(options.root, ".harnix", "config.yaml"));
  const configured: PlatformId[] = [];
  const skipped: PlatformId[] = [];
  const warnings: string[] = [];
  for (const platform of [...new Set(options.platforms)].sort()) {
    if (platform === "kiro") { await setupKiro(options.root, config.languages); configured.push(platform); }
    else if (platform === "codex") { await configureCodex(options.root); configured.push(platform); }
    else if (platform === "antigravity") { const version = await (options.versionLookup ?? lookupVersion)("agy", ["--version"]); if (!version) warnings.push("Antigravity executable 'agy' was not found; generated project guidance remains usable offline."); await setupAntigravity(options.root); configured.push(platform); }
    else skipped.push(platform);
  }
  await seedRules({ root: options.root, languages: config.languages });
  return { configured, skipped, warnings };
}

async function setupAntigravity(root: string): Promise<void> {
  const geminiPath = join(root, "GEMINI.md");
  const existing = await readOptionalFile(geminiPath);
  const block = `${codexBegin}\n## Harnix\n\nUse .harnix/workflow.md and Harnix skills. Load bounded context with \`harnix internal context --platform antigravity\` when needed.\n${codexEnd}`;
  const start = existing.indexOf(codexBegin);
  const end = existing.indexOf(codexEnd);
  const gemini = start >= 0 && end >= start ? `${existing.slice(0, start)}${block}${existing.slice(end + codexEnd.length)}` : existing.length === 0 ? `${block}\n` : `${existing.trimEnd()}\n\n${block}\n`;
  const skills = workflowSkills.map((skill) => atomicWriteFile(join(root, ".gemini", "skills", skill.name, "SKILL.md"), renderSkill(skill)));
  await Promise.all([atomicWriteFile(geminiPath, gemini), ...skills, ensureManagedWorkflow(root)]);
}

async function setupKiro(root: string, languages: string[]): Promise<void> {
  const skills = workflowSkills.map((skill) => atomicWriteFile(join(root, ".kiro", "skills", skill.name, "SKILL.md"), renderSkill(skill)));
  await Promise.all([
    ...skills,
    ensureManagedWorkflow(root),
    atomicWriteFile(join(root, ".kiro", "steering", "harnix.md"), `# Harnix\n\nUse the project-local Harnix workflow and relevant .harnix context.\n\nDetected languages: ${languages.join(", ") || "none"}.\n`),
    atomicWriteFile(join(root, ".kiro", "hooks", "harnix-context.kiro.hook"), `${JSON.stringify({ version: "1.0.0", enabled: true, when: { type: "promptSubmit" }, then: { type: "runCommand", command: "harnix internal context --platform kiro" } }, null, 2)}\n`),
  ]);
}

async function readOptionalFile(path: string): Promise<string> {
  try { return await readFile(path, "utf8"); }
  catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return "";
    throw error;
  }
}
async function lookupVersion(executable: string, args: string[]): Promise<string | undefined> { return new Promise((resolve) => execFile(executable, args, { windowsHide: true }, (error, stdout) => resolve(error ? undefined : stdout.trim()))); }
