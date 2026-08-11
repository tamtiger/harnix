import { readdir, readFile, stat } from "node:fs/promises";

import { readConfig, type HarnixConfigV1 } from "../core/config/config.js";
import { ownershipState, readManifest, type ManagedEntry, type ManagedManifest } from "../utils/managed-files.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "../utils/paths.js";
import { desiredFiles, updateProject } from "./update.js";
import {
  diagnoseGlobalIntegrations,
  type CodexTrustLookup,
  type GlobalDoctorCommandLookup,
  type GlobalIntegrationCapabilityLookup,
  type GlobalIntegrationDiagnosis,
} from "./global-doctor.js";
import { updateGlobalPlatforms } from "./global-update.js";
import { GlobalManagedTransactionError } from "../utils/global-managed-files.js";
import type { HomeResolver, UserPlatformRoots } from "../utils/user-paths.js";

export interface DoctorFinding {
  code: string;
  severity: "error" | "warning" | "info";
  path?: string;
  message: string;
  fixable: boolean;
}

export type DoctorProjectStatus = "ready" | "not-initialized" | "invalid";
export interface DoctorProjectSection {
  status: DoctorProjectStatus;
  findings: DoctorFinding[];
}

export interface DoctorReport {
  schemaVersion: 2;
  generator: "harnix";
  ok: boolean;
  project: DoctorProjectSection;
  globalIntegrations: GlobalIntegrationDiagnosis[];
  summary: { errors: number; warnings: number; fixed: number };
}

export interface DoctorOptions {
  root: string;
  fix?: boolean | undefined;
  /** Opt-in safe reconciliation of already-owned user-global integrations. */
  global?: boolean | undefined;
  homeResolver?: HomeResolver | undefined;
  environment?: Readonly<Record<string, string | undefined>> | undefined;
  commandLookup?: GlobalDoctorCommandLookup | undefined;
  userRoots?: UserPlatformRoots | undefined;
  codexTrustLookup?: CodexTrustLookup | undefined;
  /** Optional externally verified activation, precedence, or capability evidence. */
  capabilityLookup?: GlobalIntegrationCapabilityLookup | undefined;
  /** Injectable only for deterministic global-fix failure coverage. */
  globalUpdate?: typeof updateGlobalPlatforms | undefined;
}

/**
 * Doctor v2 keeps project state and user-global integration diagnostics
 * separate. Project-only --fix never writes user-global configuration.
 */
export async function diagnoseProject(options: DoctorOptions): Promise<DoctorReport> {
  let project = await diagnoseProjectSection(options.root);
  let globalIntegrations = await diagnoseGlobals(options);
  let fixed = 0;
  let globalRollbackPartial: string[] = [];

  if (options.fix) {
    if (project.status === "ready") {
      try {
        const reconciliation = await updateProject({ root: options.root });
        fixed += reconciliation.created.length + reconciliation.updated.length + reconciliation.deleted.length;
      } catch {
        // Re-diagnose below to report an invalid project state without exposing
        // an implementation-specific error in a global hook or JSON consumer.
      }
    }
    if (options.global) {
      try {
        const reconciliation = await (options.globalUpdate ?? updateGlobalPlatforms)({
          ...(options.commandLookup === undefined ? {} : { commandLookup: options.commandLookup }),
          ...(options.environment === undefined ? {} : { environment: options.environment }),
          ...(options.homeResolver === undefined ? {} : { homeResolver: options.homeResolver }),
          restoreDeleted: true,
        });
        fixed += reconciliation.platforms.reduce((total, platform) => total + platform.created.length + platform.updated.length, 0);
      } catch (error: unknown) {
        if (error instanceof GlobalManagedTransactionError) {
          globalRollbackPartial = error.rollback.partial;
        }
        // Global diagnostics below preserve corrupt or modified user content.
      }
    }
    project = await diagnoseProjectSection(options.root);
    globalIntegrations = await diagnoseGlobals(options);
    if (globalRollbackPartial.length > 0) {
      globalIntegrations = addGlobalPartialRollbackFindings(globalIntegrations, globalRollbackPartial);
    }
  }
  return report(project, globalIntegrations, fixed);
}

function addGlobalPartialRollbackFindings(
  integrations: readonly GlobalIntegrationDiagnosis[],
  partialPaths: readonly string[],
): GlobalIntegrationDiagnosis[] {
  return integrations.map((integration) => {
    const paths = partialPaths.filter((path) => belongsToGlobalPlatform(path, integration.platform));
    if (paths.length === 0) return integration;
    return {
      ...integration,
      findings: sortFindings([
        ...integration.findings,
        ...paths.map((path) => finding("global-partial-rollback", "warning", path, "A concurrent edit was preserved during rollback; inspect it before retrying the global operation.", false)),
      ]),
      status: integration.status === "invalid" ? "invalid" : "drifted",
    };
  });
}

function belongsToGlobalPlatform(path: string, platform: GlobalIntegrationDiagnosis["platform"]): boolean {
  if (platform === "kiro") return path.startsWith("~/.kiro/");
  if (platform === "antigravity") return path.startsWith("~/.gemini/");
  return path.startsWith("$CODEX_HOME/") || path.startsWith("~/.agents/");
}

async function diagnoseGlobals(options: DoctorOptions): Promise<GlobalIntegrationDiagnosis[]> {
  return diagnoseGlobalIntegrations({
    ...(options.capabilityLookup === undefined ? {} : { capabilityLookup: options.capabilityLookup }),
    ...(options.codexTrustLookup === undefined ? {} : { codexTrustLookup: options.codexTrustLookup }),
    ...(options.commandLookup === undefined ? {} : { commandLookup: options.commandLookup }),
    ...(options.environment === undefined ? {} : { environment: options.environment }),
    ...(options.homeResolver === undefined ? {} : { homeResolver: options.homeResolver }),
    ...(options.userRoots === undefined ? {} : { roots: options.userRoots }),
  });
}

async function diagnoseProjectSection(root: string): Promise<DoctorProjectSection> {
  const findings: DoctorFinding[] = [];
  let config: HarnixConfigV1;
  try {
    config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  } catch (error: unknown) {
    if (isMissing(error)) {
      return { status: "not-initialized", findings: [finding("project-not-initialized", "info", ".harnix/config.yaml", "No initialized Harnix project was found in this directory.", false)] };
    }
    return { status: "invalid", findings: [finding("config-invalid", "error", ".harnix/config.yaml", redact(error, root), false)] };
  }

  let manifest: ManagedManifest;
  try {
    manifest = await readManifest(await resolveSafeHarnixPath(root, ".template-hashes.json"));
  } catch (error: unknown) {
    return { status: "invalid", findings: [finding("manifest-invalid", "error", ".harnix/.template-hashes.json", redact(error, root), false)] };
  }

  const desired = new Map(desiredFiles(config.platforms, config.languages).map((file) => [file.entry.path, file]));
  for (const entry of manifest.entries) {
    if (entry.scope !== "project") {
      await inspectLegacyEntry(root, entry, findings);
      continue;
    }
    try {
      const state = await ownershipState(root, entry, entry);
      if (state === "deleted") findings.push(finding("managed-missing", "warning", entry.path, "Managed file was deleted by the user; run update --restore to recreate it.", false));
      if (state === "modified") findings.push(finding("managed-modified", "warning", entry.path, "Managed file has user changes and will be preserved.", false));
      if (!desired.has(entry.path)) findings.push(finding("managed-obsolete", "warning", entry.path, "Managed file is no longer in the desired template set.", state === "unchanged"));
    } catch (error) {
      findings.push(finding("unsafe-managed-path", "error", entry.path, redact(error, root), false));
    }
  }
  for (const [path] of desired) if (!manifest.entries.some((entry) => entry.scope === "project" && entry.path === path)) findings.push(finding("managed-untracked", "warning", path, "Desired project file is not yet owned by Harnix.", true));

  await inspectUntrackedLegacySurfaces(root, manifest, findings);
  await inspectSensitiveFiles(root, findings);
  await inspectPermissions(root, manifest, findings);
  return { status: "ready", findings: sortFindings(findings) };
}

async function inspectLegacyEntry(root: string, entry: ManagedEntry, findings: DoctorFinding[]): Promise<void> {
  try {
    const state = await ownershipState(root, entry, entry);
    if (state === "unchanged") {
      findings.push(finding("legacy-project-surface", "info", entry.path, "A manifest-proven project-local platform surface remains; use uninstall --legacy-project-surfaces to remove it explicitly.", false));
      if (isLegacyProjectHookPath(entry.path)) {
        findings.push(finding("legacy-project-duplicate-hook", "warning", entry.path, "A manifest-proven project-local Harnix hook may run alongside the user-global integration; use uninstall --legacy-project-surfaces to remove it explicitly.", false));
      }
    }
    else if (state === "modified") findings.push(finding("legacy-project-surface-modified", "warning", entry.path, "A legacy project-local platform surface was modified and will be preserved.", false));
    else findings.push(finding("legacy-project-surface-missing", "warning", entry.path, "A manifest-proven legacy project-local platform surface is missing.", false));
  } catch (error) {
    findings.push(finding("legacy-project-surface-unsafe", "error", entry.path, redact(error, root), false));
  }
}

async function inspectUntrackedLegacySurfaces(root: string, manifest: ManagedManifest, findings: DoctorFinding[]): Promise<void> {
  const candidates = new Set([
    ".kiro/hooks/harnix-context.kiro.hook",
    ".kiro/hooks/harnix-context.json",
    ".kiro/steering/harnix.md",
    ".gemini/skills/harnix-implement/SKILL.md",
    ".agents/skills/harnix-implement/SKILL.md",
    ".agents/hooks.json",
    ".agents/plugins/harnix/hooks.json",
    ".codex/hooks.json",
    ".codex/config.toml",
    "AGENTS.md",
    "GEMINI.md",
    ...(await findLegacySkillCandidates(root, findings)),
  ]);
  for (const path of [...candidates].sort()) {
    if (manifest.entries.some((entry) => entry.scope !== "project" && entry.path === path)) continue;
    const text = await optionalSafe(root, path, findings);
    if (text.length === 0) continue;
    const looksHarnix = path.endsWith("hooks.json")
      ? /harnix\s+internal\s+context/iu.test(text)
      : path === "GEMINI.md"
        ? /<!-- harnix:(?:begin|end) -->/u.test(text)
        : path === "AGENTS.md"
          ? hasHistoricalProjectLocalAgentsBlock(text)
        : path === ".codex/config.toml"
          ? /^\s*\[harnix\]/imu.test(text)
        : /harnix/iu.test(text);
    if (looksHarnix) {
      const duplicateHook = isLegacyProjectHookPath(path) && /harnix\s+internal\s+context/iu.test(text);
      findings.push(duplicateHook
        ? finding("legacy-project-duplicate-hook", "warning", path, "An untracked project-local Harnix hook may run alongside the user-global integration; it will not be removed automatically.", false)
        : finding("legacy-project-surface-untracked", "warning", path, "An untracked legacy Harnix platform surface may duplicate the user-global integration; it will not be removed automatically.", false));
    }
  }
}

function hasHistoricalProjectLocalAgentsBlock(text: string): boolean {
  const begin = text.indexOf("<!-- harnix:begin -->");
  const end = text.indexOf("<!-- harnix:end -->", begin);
  if (begin < 0 || end < begin) return false;
  return text.slice(begin, end).includes("Project-local skills are generated by harnix setup");
}

async function findLegacySkillCandidates(root: string, findings: DoctorFinding[]): Promise<string[]> {
  const candidates: string[] = [];
  for (const skillRoot of [".kiro/skills", ".gemini/skills", ".agents/skills"]) {
    try {
      const directory = await resolveSafeProjectPath(root, skillRoot);
      const entries = await readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith("harnix-")) candidates.push(`${skillRoot}/${entry.name}/SKILL.md`);
      }
    } catch (error: unknown) {
      if (!isMissing(error)) findings.push(finding("legacy-surface-inspection-failed", "warning", skillRoot, redact(error, root), false));
    }
  }
  return candidates;
}

function isLegacyProjectHookPath(path: string): boolean {
  return path === ".kiro/hooks/harnix-context.kiro.hook"
    || path === ".kiro/hooks/harnix-context.json"
    || path === ".codex/hooks.json"
    || path === ".agents/hooks.json"
    || path === ".agents/plugins/harnix/hooks.json";
}

async function inspectSensitiveFiles(root: string, findings: DoctorFinding[]): Promise<void> {
  for (const path of [".harnix/config.yaml", ".harnix/.template-hashes.json", "AGENTS.md", "GEMINI.md", ".codex/hooks.json", ".kiro/hooks/harnix-context.kiro.hook"]) {
    const text = await optionalSafe(root, path, findings);
    if (containsSecret(text)) findings.push(finding("secret-exposure", "error", path, "Potential secret value detected: [REDACTED].", false));
  }
}

async function inspectPermissions(root: string, manifest: ManagedManifest, findings: DoctorFinding[]): Promise<void> {
  if (process.platform === "win32") return;
  for (const entry of manifest.entries.filter((item) => item.scope === "project")) {
    try {
      const metadata = await stat(await resolveSafeProjectPath(root, entry.path));
      if ((metadata.mode & 0o002) !== 0) findings.push(finding("broad-permissions", "warning", entry.path, "Managed file is world-writable.", false));
    } catch (error: unknown) {
      if (!isMissing(error)) findings.push(finding("permission-check-failed", "warning", entry.path, redact(error, root), false));
    }
  }
}

async function optionalSafe(root: string, path: string, findings: DoctorFinding[]): Promise<string> {
  try {
    return await readFile(await resolveSafeProjectPath(root, path), "utf8");
  } catch (error: unknown) {
    if (isMissing(error)) return "";
    findings.push(finding("unsafe-path", "error", path, redact(error, root), false));
    return "";
  }
}

function report(project: DoctorProjectSection, globalIntegrations: GlobalIntegrationDiagnosis[], fixed: number): DoctorReport {
  const all = [...project.findings, ...globalIntegrations.flatMap((integration) => integration.findings)];
  const errors = all.filter((item) => item.severity === "error").length;
  const warnings = all.filter((item) => item.severity === "warning").length;
  return { generator: "harnix", schemaVersion: 2, ok: errors === 0 && warnings === 0, project: { ...project, findings: sortFindings(project.findings) }, globalIntegrations, summary: { errors, warnings, fixed } };
}

function sortFindings(findings: readonly DoctorFinding[]): DoctorFinding[] {
  const order = { error: 0, warning: 1, info: 2 } as const;
  return [...findings].sort((left, right) => order[left.severity] - order[right.severity] || left.code.localeCompare(right.code) || (left.path ?? "").localeCompare(right.path ?? ""));
}

function finding(code: string, severity: DoctorFinding["severity"], path: string | undefined, message: string, fixable: boolean): DoctorFinding {
  return { code, severity, ...(path === undefined ? {} : { path }), message, fixable };
}

function redact(value: unknown, root: string): string {
  return String(value instanceof Error ? value.message : value)
    .replaceAll(root, "[PROJECT]")
    .replace(/(?:token|secret|password|api[_-]?key)\s*[=:]\s*[^\s,]+/giu, "$1=[REDACTED]");
}

function containsSecret(value: string): boolean {
  return /(?:token|secret|password|api[_-]?key)\s*[=:]\s*['"]?[^\s,'"]{8,}/iu.test(value);
}

function isMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT";
}
