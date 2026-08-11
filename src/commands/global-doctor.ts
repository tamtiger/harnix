import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { antigravityGlobalPluginDesiredFiles } from "../configurators/antigravity.js";
import {
  createCodexGlobalSurfacePlan,
  matchesCodexGlobalContextHookGroup,
} from "../configurators/codex.js";
import { kiroGlobalDesiredFiles } from "../configurators/kiro.js";
import {
  readGlobalManagedManifest,
  reconcileGlobalManagedFiles,
  resolveSafeGlobalPath,
  type DesiredGlobalManagedFile,
  type GlobalJsonMemberMatcher,
  type GlobalManagedManifestV1,
  type GlobalManagedReconcileResult,
  type GlobalManagedWarning,
  type GlobalPlatform,
} from "../utils/global-managed-files.js";
import {
  resolveUserPlatformRoots,
  type HomeResolver,
  type UserPathRoot,
  type UserPlatformRoots,
} from "../utils/user-paths.js";
import { packageVersion } from "../version.js";
import { lookupHarnixLauncher } from "../utils/harnix-launcher.js";

const publicPlatforms = ["kiro", "antigravity", "codex"] as const;
export type GlobalDoctorPlatform = (typeof publicPlatforms)[number];
export type GlobalIntegrationStatus =
  | "not-installed"
  | "installed"
  | "active"
  | "installed-pending-trust"
  | "binary-unavailable"
  | "shadowed"
  | "precedence-unknown"
  | "unsupported-version"
  | "drifted"
  | "invalid";
export type GlobalDoctorCommandLookup = (command: string) => Promise<boolean>;
export type CodexTrustState = "trusted" | "untrusted" | "unknown";
export type CodexTrustLookup = () => Promise<CodexTrustState>;
/**
 * Optional, externally verified platform evidence. Doctor deliberately does
 * not infer runtime activation or precedence from file presence alone.
 */
export type GlobalIntegrationCapability = "supported" | "unsupported-version" | "active" | "shadowed";
export type GlobalIntegrationCapabilityLookup = (platform: GlobalDoctorPlatform) => Promise<GlobalIntegrationCapability | undefined>;

/** Structurally compatible with the Doctor v2 finding shape, without coupling to project Doctor v1. */
export interface GlobalDoctorFinding {
  code: string;
  severity: "error" | "warning" | "info";
  path?: string;
  message: string;
  fixable: boolean;
}

export interface GlobalIntegrationDiagnosis {
  platform: GlobalDoctorPlatform;
  status: GlobalIntegrationStatus;
  findings: GlobalDoctorFinding[];
}

export interface DiagnoseGlobalIntegrationsOptions {
  /** Limits diagnostics to explicit public integrations; omitted means all three. */
  platforms?: readonly GlobalDoctorPlatform[] | undefined;
  /** Already anchored user roots, useful for composition and isolated tests. */
  roots?: UserPlatformRoots | undefined;
  homeResolver?: HomeResolver | undefined;
  environment?: Readonly<Record<string, string | undefined>> | undefined;
  /** Verifies the fixed `harnix` hook command without constructing shell input. */
  commandLookup?: GlobalDoctorCommandLookup | undefined;
  /** Optional external evidence for the exact current Codex hook trust decision. */
  codexTrustLookup?: CodexTrustLookup | undefined;
  /** Optional externally verified version, precedence, or activation evidence. */
  capabilityLookup?: GlobalIntegrationCapabilityLookup | undefined;
}

interface GlobalDoctorTarget {
  platform: GlobalPlatform;
  root: UserPathRoot;
  manifestPath: string;
  desired: readonly DesiredGlobalManagedFile[];
  memberMatchers?: ReadonlyMap<string, GlobalJsonMemberMatcher>;
}

interface TargetInspection {
  target: GlobalDoctorTarget;
  state: "missing" | "valid" | "invalid";
  manifest?: GlobalManagedManifestV1;
  reconciliation?: GlobalManagedReconcileResult;
  findings: GlobalDoctorFinding[];
}

interface PlatformInspection {
  platform: GlobalDoctorPlatform;
  state: "not-installed" | "healthy" | "drifted" | "invalid";
  findings: GlobalDoctorFinding[];
}

/**
 * Reads only verified user-global roots. The dry-run reconciler is used as an
 * ownership/drift inspector and never writes a target or its sidecar manifest.
 */
export async function diagnoseGlobalIntegrations(
  options: DiagnoseGlobalIntegrationsOptions = {},
): Promise<GlobalIntegrationDiagnosis[]> {
  const platforms = selectedPlatforms(options.platforms);
  if (isTestProcess() && options.roots === undefined && options.homeResolver === undefined) {
    return platforms.map((platform) => ({
      platform,
      status: "invalid",
      findings: [finding("test-home-required", "error", undefined, "Global diagnostics require injected user roots or a homeResolver in test mode.", false)],
    }));
  }
  if (isTestProcess() && options.commandLookup === undefined) {
    return platforms.map((platform) => ({
      platform,
      status: "invalid",
      findings: [finding("test-command-lookup-required", "error", undefined, "Global diagnostics require an injected commandLookup in test mode.", false)],
    }));
  }
  let roots: UserPlatformRoots;
  try {
    roots = options.roots ?? await resolveUserPlatformRoots({
      ...(options.environment === undefined ? {} : { environment: options.environment }),
      ...(options.homeResolver === undefined ? {} : { homeResolver: options.homeResolver }),
    });
  } catch {
    return platforms.map((platform) => ({
      platform,
      status: "invalid",
      findings: [finding("global-root-invalid", "error", undefined, "The user-global integration root could not be resolved safely.", false)],
    }));
  }

  const inspections = await Promise.all(platforms.map(async (platform) => inspectPlatform(platform, roots)));
  const requiresLauncherCheck = inspections.some((inspection) => inspection.state === "healthy");
  const launcherAvailable = requiresLauncherCheck
    ? await safeCommandLookup(options.commandLookup ?? defaultCommandLookup)
    : undefined;

  const diagnoses = await Promise.all(inspections.map(async (inspection) => finalizeInspection(
    inspection,
    launcherAvailable,
    options.codexTrustLookup,
    options.capabilityLookup,
  )));
  return diagnoses.map((diagnosis) => withKiroHomeAmbiguity(diagnosis, options.environment, roots));
}

function withKiroHomeAmbiguity(
  diagnosis: GlobalIntegrationDiagnosis,
  environment: Readonly<Record<string, string | undefined>> | undefined,
  roots: UserPlatformRoots,
): GlobalIntegrationDiagnosis {
  const configuredHome = (environment ?? process.env).KIRO_HOME;
  if (diagnosis.platform !== "kiro"
    || diagnosis.status === "not-installed"
    || diagnosis.status === "invalid"
    || configuredHome === undefined
    || configuredHome.trim().length === 0
    || resolve(configuredHome) === roots.kiro.path) {
    return diagnosis;
  }
  return {
    ...diagnosis,
    findings: sortFindings([
      ...diagnosis.findings,
      finding("kiro-home-ambiguity", "warning", undefined, "KIRO_HOME differs from the documented IDE user root. Harnix kept the integration at ~/.kiro and did not retarget it.", false),
    ]),
  };
}

async function inspectPlatform(platform: GlobalDoctorPlatform, roots: UserPlatformRoots): Promise<PlatformInspection> {
  const inspections = await Promise.all(targetsFor(platform, roots).map(async (target) => inspectTarget(target)));
  const validInspections = inspections.filter((inspection) => inspection.state === "valid");
  const additionalFindings = platform === "codex"
    ? await inspectCodexAgentsOverride(roots.codex.config)
    : [];
  const findings = [...inspections.flatMap((inspection) => inspection.findings), ...additionalFindings];

  if (inspections.some((inspection) => inspection.state === "invalid") || findings.some((item) => item.severity === "error")) {
    return { platform, state: "invalid", findings: sortFindings(findings) };
  }
  if (validInspections.length === 0) {
    const collisionFindings = findings.filter((item) => item.code === "global-untracked-surface");
    return {
      platform,
      state: "not-installed",
      findings: sortFindings([
        finding("global-not-installed", "info", undefined, "No valid Harnix user-global ownership manifest was found for this integration.", false),
        ...collisionFindings,
      ]),
    };
  }

  const drifted = inspections.some((inspection) => inspection.state === "missing")
    || findings.some((item) => item.severity === "error" || isDriftFinding(item));
  if (findings.some((item) => item.severity === "error")) {
    return { platform, state: "invalid", findings: sortFindings(findings) };
  }
  return { platform, state: drifted ? "drifted" : "healthy", findings: sortFindings(findings) };
}

/** Codex documents a non-empty override as taking precedence over AGENTS.md. */
async function inspectCodexAgentsOverride(root: UserPathRoot): Promise<GlobalDoctorFinding[]> {
  const relativePath = "AGENTS.override.md";
  let path: string;
  try {
    path = await resolveSafeGlobalPath(root, relativePath);
  } catch {
    return [finding("codex-agents-override-invalid", "error", root.display(relativePath), "The Codex AGENTS override path cannot be inspected safely.", false)];
  }
  try {
    const content = await readFile(path, "utf8");
    return content.trim().length === 0
      ? []
      : [finding("codex-agents-override-shadowed", "warning", root.display(relativePath), "A non-empty Codex AGENTS.override.md takes precedence over the Harnix global AGENTS.md block.", false)];
  } catch (error: unknown) {
    if (isMissing(error)) {
      return [];
    }
    return [finding("codex-agents-override-invalid", "error", root.display(relativePath), "The Codex AGENTS override cannot be inspected safely.", false)];
  }
}

async function inspectTarget(target: GlobalDoctorTarget): Promise<TargetInspection> {
  let manifestPath: string;
  try {
    manifestPath = await resolveSafeGlobalPath(target.root, target.manifestPath);
  } catch {
    return invalidTarget(target, "global-root-invalid", target.root.logicalPath, "The user-global root cannot be inspected safely.");
  }

  let manifest: GlobalManagedManifestV1 | undefined;
  try {
    manifest = await readGlobalManagedManifest(manifestPath);
  } catch (error: unknown) {
    if (!isMissing(error)) {
      return invalidTarget(target, "global-manifest-invalid", target.root.display(target.manifestPath), "The Harnix global ownership manifest is invalid or unreadable.");
    }
  }
  if (manifest !== undefined && manifest.platform !== target.platform) {
    return invalidTarget(target, "global-manifest-platform-mismatch", target.root.display(target.manifestPath), "The Harnix global ownership manifest belongs to a different platform root.");
  }

  try {
    const reconciliation = await reconcileGlobalManagedFiles({
      desired: target.desired,
      dryRun: true,
      generatorVersion: packageVersion,
      manifestPath: target.manifestPath,
      platform: target.platform,
      preserveUnownedRoot: target.platform === "antigravity-desktop" || target.platform === "antigravity-cli",
      preserveUnownedSkillDirectories: true,
      removeObsolete: true,
      restoreDeleted: false,
      root: target.root,
      ...(target.memberMatchers === undefined ? {} : { memberMatchers: target.memberMatchers }),
    });
    return {
      target,
      state: manifest === undefined ? "missing" : "valid",
      ...(manifest === undefined ? {} : { manifest }),
      reconciliation,
      findings: findingsFromReconciliation(target, manifest, reconciliation),
    };
  } catch {
    return invalidTarget(target, "global-reconciliation-invalid", target.root.logicalPath, "The installed global integration cannot be inspected safely.");
  }
}

function invalidTarget(
  target: GlobalDoctorTarget,
  code: string,
  path: string | undefined,
  message: string,
): TargetInspection {
  return {
    target,
    state: "invalid",
    findings: [finding(code, "error", path, message, false)],
  };
}

function findingsFromReconciliation(
  target: GlobalDoctorTarget,
  manifest: GlobalManagedManifestV1 | undefined,
  reconciliation: GlobalManagedReconcileResult,
): GlobalDoctorFinding[] {
  const findings: GlobalDoctorFinding[] = [];
  for (const label of reconciliation.created) {
    findings.push(finding("global-managed-missing", "warning", displayLabel(target.root, label), "A Harnix-managed global surface is missing.", true));
  }
  for (const label of reconciliation.updated) {
    findings.push(finding("global-managed-outdated", "warning", displayLabel(target.root, label), "A Harnix-managed global surface differs from the current template.", true));
  }
  for (const label of reconciliation.deleted) {
    findings.push(finding("global-managed-deleted", "warning", displayLabel(target.root, label), "A Harnix-managed global surface would be removed by reconciliation.", true));
  }
  for (const warning of reconciliation.warnings) {
    findings.push(findingForManagedWarning(target.root, warning));
  }
  if (manifest !== undefined) {
    const desiredKeys = new Set(target.desired.map((item) => `${item.path}\u0000${item.sourceId}`));
    for (const entry of manifest.entries) {
      if (!desiredKeys.has(`${entry.path}\u0000${entry.sourceId}`)) {
        findings.push(finding("global-managed-obsolete", "warning", displayLabel(target.root, entryLabel(entry.path, entry.sourceId, entry.kind)), "The global ownership manifest includes an obsolete Harnix surface.", true));
      }
    }
  }
  return findings;
}

function findingForManagedWarning(root: UserPathRoot, warning: GlobalManagedWarning): GlobalDoctorFinding {
  const path = displayLabel(root, warning.path);
  if (warning.code === "duplicate-json-member" || warning.code === "invalid-json" || warning.code === "invalid-json-pointer" || warning.code === "malformed-markers") {
    return finding("global-fragment-malformed", "warning", path, "A shared global integration fragment cannot be parsed or matched safely and will be preserved.", false);
  }
  if (warning.code === "manifest-conflict") {
    return finding("global-managed-conflict", "warning", path, "The owned global fragment no longer matches the current selector and will be preserved.", false);
  }
  if (warning.code === "modified") {
    return finding("global-managed-modified", "warning", path, "A Harnix-managed global surface was modified and will be preserved.", false);
  }
  if (warning.code === "untracked-collision") {
    return finding("global-untracked-surface", "warning", path, "A matching global surface is not owned by Harnix and will be preserved.", false);
  }
  if (warning.code === "deleted") {
    return finding("global-managed-missing", "warning", path, "A previously owned global surface is missing.", true);
  }
  return finding("global-managed-drift", "warning", path, "A Harnix-managed global surface requires review.", false);
}

async function finalizeInspection(
  inspection: PlatformInspection,
  launcherAvailable: boolean | undefined,
  codexTrustLookup: CodexTrustLookup | undefined,
  capabilityLookup: GlobalIntegrationCapabilityLookup | undefined,
): Promise<GlobalIntegrationDiagnosis> {
  const findings = [...inspection.findings];
  if (inspection.state === "not-installed" || inspection.state === "invalid" || inspection.state === "drifted") {
    return { platform: inspection.platform, status: inspection.state, findings };
  }
  const capability = await safeCapabilityLookup(capabilityLookup, inspection.platform);
  if (capability === "unsupported-version") {
    findings.push(finding("global-unsupported-version", "warning", undefined, "The installed platform version does not support this Harnix global integration contract.", false));
    return { platform: inspection.platform, status: "unsupported-version", findings: sortFindings(findings) };
  }
  if (launcherAvailable !== true) {
    findings.push(finding("global-binary-unavailable", "warning", undefined, "The fixed 'harnix' hook command was not found on PATH.", false));
    return { platform: inspection.platform, status: "binary-unavailable", findings: sortFindings(findings) };
  }
  if (inspection.platform === "antigravity") {
    if (capability === "active" || capability === "shadowed") {
      findings.push(capabilityFinding(capability));
      return { platform: inspection.platform, status: capability, findings: sortFindings(findings) };
    }
    findings.push(finding("antigravity-precedence-unknown", "warning", undefined, "Antigravity plugin-versus-workspace precedence is not verified.", false));
    return { platform: inspection.platform, status: "precedence-unknown", findings: sortFindings(findings) };
  }
  if (inspection.platform === "codex") {
    if (findings.some((item) => item.code === "codex-agents-override-shadowed")) {
      return { platform: inspection.platform, status: "shadowed", findings: sortFindings(findings) };
    }
    const trust = await safeCodexTrustLookup(codexTrustLookup);
    if (trust === "trusted") {
      findings.push(finding("codex-trust-evidence", "info", undefined, "External evidence confirms the exact current Codex hook is trusted.", false));
      if (capability === "active" || capability === "shadowed") {
        findings.push(capabilityFinding(capability));
        return { platform: inspection.platform, status: capability, findings: sortFindings(findings) };
      }
      return { platform: inspection.platform, status: "installed", findings: sortFindings(findings) };
    }
    findings.push(finding("codex-trust-pending", "warning", undefined, "Review and trust the exact Harnix hook from Codex /hooks before it can run.", false));
    return { platform: inspection.platform, status: "installed-pending-trust", findings: sortFindings(findings) };
  }
  if (capability === "active" || capability === "shadowed") {
    findings.push(capabilityFinding(capability));
    return { platform: inspection.platform, status: capability, findings: sortFindings(findings) };
  }
  return { platform: inspection.platform, status: "installed", findings: sortFindings(findings) };
}

function capabilityFinding(capability: "active" | "shadowed"): GlobalDoctorFinding {
  return capability === "active"
    ? finding("global-integration-active", "info", undefined, "External evidence confirms this global integration is active for the inspected platform.", false)
    : finding("global-integration-shadowed", "warning", undefined, "External evidence confirms this global integration is shadowed by a higher-precedence surface.", false);
}

function targetsFor(platform: GlobalDoctorPlatform, roots: UserPlatformRoots): GlobalDoctorTarget[] {
  if (platform === "kiro") {
    return [{
      desired: kiroGlobalDesiredFiles(),
      manifestPath: "harnix/managed.json",
      platform: "kiro",
      root: roots.kiro,
    }];
  }
  if (platform === "antigravity") {
    const desired = antigravityGlobalPluginDesiredFiles();
    return [
      {
        desired,
        manifestPath: ".managed.json",
        platform: "antigravity-desktop",
        root: roots.antigravityDesktop,
      },
      {
        desired,
        manifestPath: ".managed.json",
        platform: "antigravity-cli",
        root: roots.antigravityCli,
      },
    ];
  }
  const plan = createCodexGlobalSurfacePlan();
  return [
    {
      desired: plan.config,
      manifestPath: "harnix/managed.json",
      memberMatchers: new Map([["codex-global-context-hook", matchesCodexGlobalContextHookGroup]]),
      platform: "codex",
      root: roots.codex.config,
    },
    {
      desired: plan.skills,
      manifestPath: "harnix/managed.json",
      platform: "codex",
      root: roots.codex.skills,
    },
  ];
}

function selectedPlatforms(requested: readonly GlobalDoctorPlatform[] | undefined): GlobalDoctorPlatform[] {
  if (requested === undefined) {
    return [...publicPlatforms];
  }
  const selected = new Set(requested);
  return publicPlatforms.filter((platform) => selected.has(platform));
}

function isDriftFinding(finding: GlobalDoctorFinding): boolean {
  return finding.code === "global-managed-missing"
    || finding.code === "global-managed-outdated"
    || finding.code === "global-managed-deleted"
    || finding.code === "global-managed-modified"
    || finding.code === "global-untracked-surface"
    || finding.code === "global-managed-obsolete"
    || finding.code === "global-managed-drift"
    || finding.code === "global-fragment-malformed"
    || finding.code === "global-managed-conflict";
}

function displayLabel(root: UserPathRoot, label: string): string {
  const separator = label.indexOf("#");
  const path = separator < 0 ? label : label.slice(0, separator);
  const suffix = separator < 0 ? "" : label.slice(separator);
  return `${root.display(path)}${suffix}`;
}

function entryLabel(path: string, sourceId: string, kind: string): string {
  return kind === "file" ? path : `${path}#${sourceId}`;
}

function finding(
  code: string,
  severity: GlobalDoctorFinding["severity"],
  path: string | undefined,
  message: string,
  fixable: boolean,
): GlobalDoctorFinding {
  return { code, severity, ...(path === undefined ? {} : { path }), message, fixable };
}

function sortFindings(findings: readonly GlobalDoctorFinding[]): GlobalDoctorFinding[] {
  const order = { error: 0, warning: 1, info: 2 } as const;
  return [...findings].sort((left, right) => order[left.severity] - order[right.severity]
    || left.code.localeCompare(right.code)
    || (left.path ?? "").localeCompare(right.path ?? ""));
}

async function safeCommandLookup(lookup: GlobalDoctorCommandLookup): Promise<boolean> {
  try {
    return await lookup("harnix");
  } catch {
    return false;
  }
}

async function safeCodexTrustLookup(lookup: CodexTrustLookup | undefined): Promise<CodexTrustState> {
  if (lookup === undefined) {
    return "unknown";
  }
  try {
    return await lookup();
  } catch {
    return "unknown";
  }
}

async function safeCapabilityLookup(
  lookup: GlobalIntegrationCapabilityLookup | undefined,
  platform: GlobalDoctorPlatform,
): Promise<GlobalIntegrationCapability | undefined> {
  if (lookup === undefined) {
    return undefined;
  }
  try {
    const capability = await lookup(platform);
    return capability === "supported" || capability === "unsupported-version" || capability === "active" || capability === "shadowed"
      ? capability
      : undefined;
  } catch {
    return undefined;
  }
}

async function defaultCommandLookup(command: string): Promise<boolean> {
  return command === "harnix" && lookupHarnixLauncher();
}

function isMissing(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isTestProcess(): boolean {
  return process.env.VITEST !== undefined || process.env.NODE_ENV === "test";
}
