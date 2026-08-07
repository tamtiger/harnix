import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { readConfig, type PlatformId } from "../core/config/config.js";
import { atomicWriteFile } from "../utils/atomic-write.js";
import { seedRules } from "../rules/rules.js";

export interface SetupPlatformsOptions { root: string; platforms: PlatformId[]; }
export interface SetupPlatformsResult { configured: PlatformId[]; skipped: PlatformId[]; }

const codexBegin = "<!-- harnix:begin -->";
const codexEnd = "<!-- harnix:end -->";

export async function setupPlatforms(options: SetupPlatformsOptions): Promise<SetupPlatformsResult> {
  if (options.platforms.length === 0) throw new Error("At least one platform must be selected.");
  const config = await readConfig(join(options.root, ".harnix", "config.yaml"));
  const configured: PlatformId[] = [];
  const skipped: PlatformId[] = [];
  for (const platform of [...new Set(options.platforms)].sort()) {
    if (platform === "kiro") { await setupKiro(options.root, config.languages); configured.push(platform); }
    else if (platform === "codex") { await setupCodex(options.root); configured.push(platform); }
    else skipped.push(platform);
  }
  await seedRules({ root: options.root, languages: config.languages });
  return { configured, skipped };
}

async function setupKiro(root: string, languages: string[]): Promise<void> {
  await Promise.all([
    atomicWriteFile(join(root, ".kiro", "skills", "harnix-implement", "SKILL.md"), "---\nname: harnix-implement\ndescription: Implement a verified Harnix task.\n---\n\nFollow the project Harnix workflow and record fresh evidence.\n"),
    atomicWriteFile(join(root, ".kiro", "steering", "harnix.md"), `# Harnix\n\nUse the project-local Harnix workflow and relevant .harnix context.\n\nDetected languages: ${languages.join(", ") || "none"}.\n`),
    atomicWriteFile(join(root, ".kiro", "hooks", "harnix-context.kiro.hook"), `${JSON.stringify({ version: "1.0.0", enabled: true, when: { type: "promptSubmit" }, then: { type: "runCommand", command: "harnix internal context --platform kiro" } }, null, 2)}\n`),
  ]);
}

async function setupCodex(root: string): Promise<void> {
  const agentsPath = join(root, "AGENTS.md");
  const existing = await readOptionalFile(agentsPath);
  const block = `${codexBegin}\n## Harnix\n\nUse .harnix/workflow.md and Harnix skills for project-local workflow guidance.\n${codexEnd}`;
  const start = existing.indexOf(codexBegin);
  const end = existing.indexOf(codexEnd);
  const agents = start >= 0 && end >= start ? `${existing.slice(0, start)}${block}${existing.slice(end + codexEnd.length)}` : existing.length === 0 ? `${block}\n` : `${existing.trimEnd()}\n\n${block}\n`;
  const codexConfigPath = join(root, ".codex", "config.toml");
  const existingCodexConfig = await readOptionalFile(codexConfigPath);
  const codexConfig = existingCodexConfig.includes("[harnix]") ? existingCodexConfig : `${existingCodexConfig.trimEnd()}${existingCodexConfig.length === 0 ? "" : "\n\n"}[harnix]\nenabled = true\n`;
  const hooksPath = join(root, ".codex", "hooks.json");
  const hooks = mergeCodexHooks(await readOptionalFile(hooksPath));
  await Promise.all([
    atomicWriteFile(agentsPath, agents),
    atomicWriteFile(join(root, ".agents", "skills", "harnix-implement", "SKILL.md"), "---\nname: harnix-implement\ndescription: Implement a verified Harnix task.\n---\n\nFollow `.harnix/workflow.md` and preserve user-owned project data.\n"),
    atomicWriteFile(codexConfigPath, codexConfig),
    atomicWriteFile(hooksPath, `${JSON.stringify(hooks, null, 2)}\n`),
  ]);
}

function mergeCodexHooks(existing: string): { hooks: Record<string, unknown[]> } {
  const harnixHook = { command: "harnix internal context --platform codex", commandWindows: "harnix.exe internal context --platform codex", timeout: 5, additionalContextLimit: 2500 };
  if (existing.length === 0) return { hooks: { UserPromptSubmit: [harnixHook] } };
  let parsed: unknown;
  try { parsed = JSON.parse(existing); }
  catch { throw new Error("Cannot merge .codex/hooks.json because it is not valid JSON."); }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("Cannot merge .codex/hooks.json because it must be an object.");
  const record = parsed as Record<string, unknown>;
  const existingHooks = record.hooks;
  if (typeof existingHooks !== "object" || existingHooks === null || Array.isArray(existingHooks)) throw new Error("Cannot merge .codex/hooks.json because hooks must be an object.");
  const hooks = existingHooks as Record<string, unknown>;
  const promptHooks = hooks.UserPromptSubmit;
  if (promptHooks !== undefined && !Array.isArray(promptHooks)) throw new Error("Cannot merge .codex/hooks.json because UserPromptSubmit must be an array.");
  const retained = (promptHooks ?? []).filter((hook) => !isHarnixHook(hook));
  return { hooks: { ...hooks, UserPromptSubmit: [...retained, harnixHook] } as Record<string, unknown[]> };
}

function isHarnixHook(value: unknown): boolean {
  return typeof value === "object" && value !== null && "command" in value
    && (value as { command?: unknown }).command === "harnix internal context --platform codex";
}

async function readOptionalFile(path: string): Promise<string> {
  try { return await readFile(path, "utf8"); }
  catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return "";
    throw error;
  }
}
