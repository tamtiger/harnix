import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { readConfig } from "../core/config/config.js";
import { desiredFiles, updateProject } from "./update.js";
import { ownershipState, readManifest } from "../utils/managed-files.js";
import { discoverLegacy } from "../migration/discovery.js";

export interface DoctorFinding { code: string; severity: "error" | "warning" | "info"; path?: string; message: string; fixable: boolean; }
export interface DoctorReport { schemaVersion: 1; generator: "harnix"; ok: boolean; summary: { errors: number; warnings: number; fixed: number }; findings: DoctorFinding[]; }
export interface DoctorOptions { root: string; fix?: boolean | undefined; }

export async function diagnoseProject(options: DoctorOptions): Promise<DoctorReport> {
  const findings: DoctorFinding[] = []; let config;
  try { config = await readConfig(join(options.root, ".harnix", "config.yaml")); }
  catch (error) { findings.push(finding("config-invalid", "error", ".harnix/config.yaml", redact(error), false)); return report(findings, 0); }
  let manifest;
  try { manifest = await readManifest(join(options.root, ".harnix", ".template-hashes.json")); }
  catch (error) { findings.push(finding("manifest-invalid", "error", ".harnix/.template-hashes.json", redact(error), false)); return report(findings, 0); }
  const desired = new Map(desiredFiles(config.platforms, config.languages).map((file) => [file.entry.path, file]));
  for (const entry of manifest.entries) {
    const state = await ownershipState(options.root, entry, entry);
    if (state === "deleted") findings.push(finding("managed-missing", "warning", entry.path, "Managed file was deleted by the user; run update --restore to recreate it.", false));
    if (state === "modified") findings.push(finding("managed-modified", "warning", entry.path, "Managed file has user changes and will be preserved.", false));
    if (!desired.has(entry.path)) findings.push(finding("managed-obsolete", "warning", entry.path, "Managed file is no longer in the desired template set.", false));
  }
  for (const [path] of desired) if (!manifest.entries.some((entry) => entry.path === path)) findings.push(finding("managed-untracked", "warning", path, "Desired file is not yet owned by Harnix.", true));
  await inspectInjections(options.root, findings);
  await inspectSkillsAndCommands(options.root, config.platforms, findings);
  for (const legacy of await discoverLegacy(options.root)) findings.push(finding("legacy-surface", "warning", legacy, "Legacy compatibility surface detected; migration cleanup is explicit.", false));
  const safe = options.fix ? await updateProject({ root: options.root }) : undefined;
  const fixed = safe ? safe.created.length + safe.updated.length : 0;
  if (fixed > 0) findings.push(finding("safe-fix-applied", "info", undefined, `Reconciled ${fixed} safe managed file(s).`, false));
  return report(findings, fixed);
}

async function inspectInjections(root: string, findings: DoctorFinding[]): Promise<void> {
  for (const path of ["AGENTS.md", "GEMINI.md"]) {
    const text = await optional(join(root, path)); const count = (text.match(/<!-- harnix:begin -->/gu) ?? []).length;
    if (count > 1) findings.push(finding("duplicate-injection", "error", path, "Multiple Harnix managed blocks were found.", false));
    else if ((text.match(/<!-- harnix:end -->/gu) ?? []).length !== count) findings.push(finding("broken-injection", "warning", path, "Harnix managed block markers are unbalanced.", false));
  }
  const hooks = await optional(join(root, ".codex", "hooks.json"));
  if (hooks) try { const value = JSON.parse(hooks) as { hooks?: { UserPromptSubmit?: Array<{ command?: string }> } }; const count = value.hooks?.UserPromptSubmit?.filter((hook) => hook.command === "harnix internal context --platform codex").length ?? 0; if (count > 1) findings.push(finding("duplicate-hook", "error", ".codex/hooks.json", "Multiple Harnix Codex hooks were found.", false)); } catch { findings.push(finding("hooks-invalid", "error", ".codex/hooks.json", "Hooks JSON is invalid.", false)); }
}
async function inspectSkillsAndCommands(root: string, platforms: string[], findings: DoctorFinding[]): Promise<void> {
  for (const platform of platforms) {
    const base = platform === "codex" ? ".agents/skills" : platform === "kiro" ? ".kiro/skills" : ".gemini/skills";
    for (const file of desiredFiles([platform], []).filter((item) => item.entry.path.startsWith(base)).map((item) => item.entry.path)) {
      const text = await optional(join(root, ...file.split("/")));
      if (text.length === 0) findings.push(finding("skill-missing", "warning", file, "Expected platform skill is missing.", true));
      else if (!/^---\r?\nname: harnix-[a-z-]+\r?\n/iu.test(text)) findings.push(finding("skill-frontmatter", "warning", file, "Skill frontmatter is missing or invalid.", false));
      if (containsSecret(text)) findings.push(finding("secret-exposure", "error", file, "Potential secret value detected: [REDACTED].", false));
    }
  }
  const kiroHook = await optional(join(root, ".kiro", "hooks", "harnix-context.kiro.hook"));
  if (kiroHook) try { const hook = JSON.parse(kiroHook) as { then?: { command?: string } }; if (hook.then?.command !== "harnix internal context --platform kiro") findings.push(finding("unsafe-hook-command", "error", ".kiro/hooks/harnix-context.kiro.hook", "Managed hook command is not the approved Harnix command.", false)); } catch { findings.push(finding("hook-schema", "error", ".kiro/hooks/harnix-context.kiro.hook", "Managed Kiro hook is invalid JSON.", false)); }
  for (const path of [".harnix/config.yaml", ".harnix/.template-hashes.json", ".codex/hooks.json"]) { const text = await optional(join(root, ...path.split("/"))); if (containsSecret(text)) findings.push(finding("secret-exposure", "error", path, "Potential secret value detected: [REDACTED].", false)); }
}
function report(findings: DoctorFinding[], fixed: number): DoctorReport { const sorted = findings.sort((left, right) => `${left.path ?? ""}:${left.code}`.localeCompare(`${right.path ?? ""}:${right.code}`)); const errors = sorted.filter((item) => item.severity === "error").length, warnings = sorted.filter((item) => item.severity === "warning").length; return { schemaVersion: 1, generator: "harnix", ok: errors === 0, summary: { errors, warnings, fixed }, findings: sorted }; }
function finding(code: string, severity: DoctorFinding["severity"], path: string | undefined, message: string, fixable: boolean): DoctorFinding { return { code, severity, ...(path ? { path } : {}), message, fixable }; }
function redact(value: unknown): string { return String(value instanceof Error ? value.message : value).replace(/(?:token|secret|password|api[_-]?key)\s*[=:]\s*[^\s,]+/giu, "$1=[REDACTED]"); }
function containsSecret(value: string): boolean { return /(?:token|secret|password|api[_-]?key)\s*[=:]\s*['"]?[^\s,'"]{8,}/iu.test(value); }
async function optional(path: string): Promise<string> { try { return await readFile(path, "utf8"); } catch (error: unknown) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return ""; throw error; } }
