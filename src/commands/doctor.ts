import { readFile, stat } from "node:fs/promises";

import { readConfig, type HarnixConfigV1 } from "../core/config/config.js";
import { ownershipState, readManifest, type ManagedManifest } from "../utils/managed-files.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "../utils/paths.js";
import { desiredFiles, updateProject } from "./update.js";

export interface DoctorFinding { code: string; severity: "error" | "warning" | "info"; path?: string; message: string; fixable: boolean; }
export interface DoctorReport { schemaVersion: 1; generator: "harnix"; ok: boolean; summary: { errors: number; warnings: number; fixed: number }; findings: DoctorFinding[]; }
export interface DoctorOptions { root: string; fix?: boolean | undefined; }

const harnixCodexCommand = "harnix internal context --platform codex";
const harnixCodexHook = { command: harnixCodexCommand, commandWindows: "harnix.exe internal context --platform codex", timeout: 5, additionalContextLimit: 2500 };

export async function diagnoseProject(options: DoctorOptions): Promise<DoctorReport> {
  const initial = await diagnoseOnce(options.root);
  if (!options.fix || !initial.findings.some((item) => item.fixable)) return initial;

  const reconciliation = await updateProject({ root: options.root });
  const fixed = reconciliation.created.length + reconciliation.updated.length + reconciliation.deleted.length;
  const current = await diagnoseOnce(options.root);
  if (fixed > 0) current.findings.push(finding("safe-fix-applied", "info", undefined, `Reconciled ${fixed} safe managed file(s).`, false));
  return report(current.findings, fixed);
}

async function diagnoseOnce(root: string): Promise<DoctorReport> {
  const findings: DoctorFinding[] = [];
  let config: HarnixConfigV1;
  try { config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml")); }
  catch (error) { findings.push(finding("config-invalid", "error", ".harnix/config.yaml", redact(error, root), false)); return report(findings, 0); }

  let manifest: ManagedManifest;
  try { manifest = await readManifest(await resolveSafeHarnixPath(root, ".template-hashes.json")); }
  catch (error) { findings.push(finding("manifest-invalid", "error", ".harnix/.template-hashes.json", redact(error, root), false)); return report(findings, 0); }

  const desired = new Map(desiredFiles(config.platforms, config.languages).map((file) => [file.entry.path, file]));
  for (const entry of manifest.entries) {
    try {
      const state = await ownershipState(root, entry, entry);
      if (state === "deleted") findings.push(finding("managed-missing", "warning", entry.path, "Managed file was deleted by the user; run update --restore to recreate it.", false));
      if (state === "modified") findings.push(finding("managed-modified", "warning", entry.path, "Managed file has user changes and will be preserved.", false));
      if (!desired.has(entry.path)) findings.push(finding("managed-obsolete", "warning", entry.path, "Managed file is no longer in the desired template set.", state === "unchanged"));
    } catch (error) {
      findings.push(finding("unsafe-managed-path", "error", entry.path, redact(error, root), false));
    }
  }
  for (const [path] of desired) if (!manifest.entries.some((entry) => entry.path === path)) findings.push(finding("managed-untracked", "warning", path, "Desired file is not yet owned by Harnix.", true));

  await inspectInjections(root, config, findings);
  await inspectSkills(root, config, findings);
  await inspectSensitiveFiles(root, findings);
  await inspectPermissions(root, manifest, findings);
  return report(findings, 0);
}

async function inspectInjections(root: string, config: HarnixConfigV1, findings: DoctorFinding[]): Promise<void> {
  for (const [platform, path] of [["codex", "AGENTS.md"], ["antigravity", "GEMINI.md"]] as const) {
    const text = await optionalSafe(root, path, findings);
    const markers = inspectManagedMarkers(text);
    if (markers.beginCount > 1) findings.push(finding("duplicate-injection", "error", path, "Multiple Harnix managed blocks were found.", false));
    if (markers.malformed) findings.push(finding("broken-injection", "warning", path, "Harnix managed block markers are unbalanced or out of order.", false));
    else if (config.platforms.includes(platform) && markers.beginCount === 0) findings.push(finding("injection-missing", "warning", path, `Expected ${platform} project guidance is missing.`, false));
  }

  if (config.platforms.includes("codex")) {
    const hooksPath = ".codex/hooks.json";
    const hooksText = await optionalSafe(root, hooksPath, findings);
    if (!hooksText) findings.push(finding("hook-missing", "warning", hooksPath, "Expected Codex context hook is missing.", false));
    else inspectCodexHooks(hooksText, findings);
    const configText = await optionalSafe(root, ".codex/config.toml", findings);
    if (!/^\[harnix\]\r?\nenabled\s*=\s*true\s*$/mu.test(configText)) findings.push(finding("codex-trust-drift", "warning", ".codex/config.toml", "Codex Harnix project configuration is missing or modified; verify project trust before use.", false));
  }

  if (config.platforms.includes("kiro")) {
    const path = ".kiro/hooks/harnix-context.kiro.hook";
    const text = await optionalSafe(root, path, findings);
    if (!text) findings.push(finding("hook-missing", "warning", path, "Expected Kiro context hook is missing.", false));
    else try {
      const hook = JSON.parse(text) as { version?: unknown; enabled?: unknown; when?: { type?: unknown }; then?: { type?: unknown; command?: unknown } };
      if (hook.version !== "1.0.0" || hook.enabled !== true || hook.when?.type !== "promptSubmit" || hook.then?.type !== "runCommand" || hook.then.command !== "harnix internal context --platform kiro") findings.push(finding("hook-schema", "error", path, "Managed Kiro hook does not match the approved schema and command.", false));
    } catch { findings.push(finding("hook-schema", "error", path, "Managed Kiro hook is invalid JSON.", false)); }
  }
}

function inspectCodexHooks(source: string, findings: DoctorFinding[]): void {
  const path = ".codex/hooks.json";
  try {
    const value = JSON.parse(source) as { hooks?: { UserPromptSubmit?: unknown[] } };
    const hooks = value.hooks?.UserPromptSubmit;
    if (!Array.isArray(hooks)) { findings.push(finding("hooks-invalid", "error", path, "Codex UserPromptSubmit hooks must be an array.", false)); return; }
    const harnixHooks = hooks.filter((hook) => isRecord(hook) && hook.command === harnixCodexCommand);
    if (harnixHooks.length > 1) findings.push(finding("duplicate-hook", "error", path, "Multiple Harnix Codex hooks were found.", false));
    if (harnixHooks.length === 0) findings.push(finding("hook-missing", "warning", path, "Expected Codex context hook is missing.", false));
    else if (!sameRecord(harnixHooks[0] as Record<string, unknown>, harnixCodexHook)) findings.push(finding("hook-schema", "error", path, "Harnix Codex hook fields differ from the approved schema.", false));
    if (hooks.some((hook) => isRecord(hook) && typeof hook.command === "string" && /harnix\s+internal\s+context/iu.test(hook.command) && hook.command !== harnixCodexCommand)) findings.push(finding("unsafe-hook-command", "error", path, "A Harnix-like hook uses an unapproved command.", false));
  } catch { findings.push(finding("hooks-invalid", "error", path, "Hooks JSON is invalid.", false)); }
}

async function inspectSkills(root: string, config: HarnixConfigV1, findings: DoctorFinding[]): Promise<void> {
  for (const platform of config.platforms) {
    const base = platform === "codex" ? ".agents/skills" : platform === "kiro" ? ".kiro/skills" : ".gemini/skills";
    const files = desiredFiles([platform], []).filter((item) => item.entry.path.startsWith(base)).map((item) => item.entry.path);
    for (const path of files) {
      const text = await optionalSafe(root, path, findings);
      if (!text) findings.push(finding("skill-missing", "warning", path, "Expected platform skill is missing.", true));
      else if (!/^---\r?\nname: harnix-[a-z-]+\r?\ndescription: .+\r?\n---\r?\n/u.test(text)) findings.push(finding("skill-frontmatter", "warning", path, "Skill frontmatter is missing or invalid.", false));
    }
  }
}

async function inspectSensitiveFiles(root: string, findings: DoctorFinding[]): Promise<void> {
  for (const path of [".harnix/config.yaml", ".harnix/.template-hashes.json", ".codex/hooks.json", ".kiro/hooks/harnix-context.kiro.hook", "AGENTS.md", "GEMINI.md"]) {
    const text = await optionalSafe(root, path, findings);
    if (containsSecret(text)) findings.push(finding("secret-exposure", "error", path, "Potential secret value detected: [REDACTED].", false));
  }
}

async function inspectPermissions(root: string, manifest: ManagedManifest, findings: DoctorFinding[]): Promise<void> {
  if (process.platform === "win32") return;
  for (const entry of manifest.entries) try {
    const metadata = await stat(await resolveSafeProjectPath(root, entry.path));
    if ((metadata.mode & 0o002) !== 0) findings.push(finding("broad-permissions", "warning", entry.path, "Managed file is world-writable.", false));
  } catch (error: unknown) { if (!isMissing(error)) findings.push(finding("permission-check-failed", "warning", entry.path, redact(error, root), false)); }
}

async function optionalSafe(root: string, path: string, findings: DoctorFinding[]): Promise<string> {
  try { return await readFile(await resolveSafeProjectPath(root, path), "utf8"); }
  catch (error: unknown) {
    if (isMissing(error)) return "";
    findings.push(finding("unsafe-path", "error", path, redact(error, root), false));
    return "";
  }
}

function report(findings: DoctorFinding[], fixed: number): DoctorReport {
  const order = { error: 0, warning: 1, info: 2 } as const;
  const sorted = findings.sort((left, right) => order[left.severity] - order[right.severity] || left.code.localeCompare(right.code) || (left.path ?? "").localeCompare(right.path ?? ""));
  const errors = sorted.filter((item) => item.severity === "error").length, warnings = sorted.filter((item) => item.severity === "warning").length;
  return { schemaVersion: 1, generator: "harnix", ok: errors === 0 && warnings === 0, summary: { errors, warnings, fixed }, findings: sorted };
}
function inspectManagedMarkers(source: string): { beginCount: number; malformed: boolean } {
  let beginCount = 0, depth = 0, malformed = false;
  for (const match of source.matchAll(/<!-- harnix:(begin|end) -->/gu)) {
    if (match[1] === "begin") { beginCount += 1; depth += 1; }
    else if (depth === 0) malformed = true;
    else depth -= 1;
  }
  return { beginCount, malformed: malformed || depth !== 0 };
}
function finding(code: string, severity: DoctorFinding["severity"], path: string | undefined, message: string, fixable: boolean): DoctorFinding { return { code, severity, ...(path ? { path } : {}), message, fixable }; }
function redact(value: unknown, root: string): string { return String(value instanceof Error ? value.message : value).replaceAll(root, "[PROJECT]").replace(/(?:token|secret|password|api[_-]?key)\s*[=:]\s*[^\s,]+/giu, "$1=[REDACTED]"); }
function containsSecret(value: string): boolean { return /(?:token|secret|password|api[_-]?key)\s*[=:]\s*['"]?[^\s,'"]{8,}/iu.test(value); }
function sameRecord(left: Record<string, unknown>, right: object): boolean { return Object.keys(left).length === Object.keys(right).length && Object.entries(right).every(([key, value]) => left[key] === value); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isMissing(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"; }
