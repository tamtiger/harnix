import { readFile } from "node:fs/promises";

import { finding, isMissing, sortFindings, type DoctorFinding } from "src/core/doctor/findings.js";
import type { GlobalDoctorPlatform } from "src/core/doctor/global-types.js";
import {
  readGlobalManagedManifest,
  reconcileGlobalManagedFiles,
  resolveSafeGlobalPath,
  type DesiredGlobalManagedFile,
  type GlobalJsonMemberMatcher,
  type GlobalManagedManifestV1,
  type GlobalManagedReconcileResult,
  type GlobalManagedWarning,
} from "src/core/global/managed-files.js";
import type { GlobalTarget } from "src/core/global/targets.js";
import { getPlatform } from "src/core/platform/registry.js";
import { selectedUserRoot, type UserPathRoot, type UserPlatformRoots } from "src/core/platform/user-paths.js";

/** A registered target together with what the configurators say it should contain. */
export interface DoctorTarget extends GlobalTarget {
  readonly desired: readonly DesiredGlobalManagedFile[];
  readonly memberMatchers?: ReadonlyMap<string, GlobalJsonMemberMatcher> | undefined;
}

export interface PlatformInspection {
  platform: GlobalDoctorPlatform;
  state: "not-installed" | "healthy" | "drifted" | "invalid";
  findings: DoctorFinding[];
}

interface TargetInspection {
  state: "missing" | "valid" | "invalid";
  findings: DoctorFinding[];
}

const DRIFT_CODES = new Set([
  "global-managed-missing",
  "global-managed-outdated",
  "global-managed-deleted",
  "global-managed-modified",
  "global-untracked-surface",
  "global-managed-obsolete",
  "global-managed-drift",
  "global-fragment-malformed",
  "global-managed-conflict",
]);

/**
 * The dry-run reconciler is used as an ownership/drift inspector and never writes a target or its
 * sidecar manifest.
 */
export async function inspectPlatform(
  platform: GlobalDoctorPlatform,
  targets: readonly DoctorTarget[],
  roots: UserPlatformRoots,
  generatorVersion: string,
): Promise<PlatformInspection> {
  const inspections = await Promise.all(targets.map(async (target) => inspectTarget(target, generatorVersion)));
  const additional = await inspectShadowingFiles(platform, roots);
  const findings = [...inspections.flatMap((inspection) => inspection.findings), ...additional];

  if (
    inspections.some((inspection) => inspection.state === "invalid") ||
    findings.some((item) => item.severity === "error")
  ) {
    return { platform, state: "invalid", findings: sortFindings(findings) };
  }
  if (!inspections.some((inspection) => inspection.state === "valid")) {
    return {
      platform,
      state: "not-installed",
      findings: sortFindings([
        finding(
          "global-not-installed",
          "info",
          undefined,
          "No valid Harnix user-global ownership manifest was found for this integration.",
          false,
        ),
        ...findings.filter((item) => item.code === "global-untracked-surface"),
      ]),
    };
  }
  const drifted =
    inspections.some((inspection) => inspection.state === "missing") ||
    findings.some((item) => DRIFT_CODES.has(item.code));
  return { platform, state: drifted ? "drifted" : "healthy", findings: sortFindings(findings) };
}

/** A non-empty shadowing file (for example Codex AGENTS.override.md) takes precedence over the Harnix block. */
async function inspectShadowingFiles(
  platform: GlobalDoctorPlatform,
  roots: UserPlatformRoots,
): Promise<DoctorFinding[]> {
  const record = getPlatform(platform);
  const findings: DoctorFinding[] = [];
  for (const shadow of record.shadowingFiles) {
    const root = selectedUserRoot(roots, platform, shadow.rootKey);
    if (root === undefined) continue;
    findings.push(...(await inspectShadowingFile(root, shadow, record.label, record.instructionFile ?? "")));
  }
  return findings;
}

async function inspectShadowingFile(
  root: UserPathRoot,
  shadow: { path: string; code: string; subject: string },
  label: string,
  instructionFile: string,
): Promise<DoctorFinding[]> {
  const display = root.display(shadow.path);
  let path: string;
  try {
    path = await resolveSafeGlobalPath(root, shadow.path);
  } catch {
    return [
      finding(
        `${shadow.code}-invalid`,
        "error",
        display,
        `The ${label} ${shadow.subject} path cannot be inspected safely.`,
        false,
      ),
    ];
  }
  try {
    const content = await readFile(path, "utf8");
    return content.trim().length === 0
      ? []
      : [
          finding(
            `${shadow.code}-shadowed`,
            "warning",
            display,
            `A non-empty ${label} ${shadow.path} takes precedence over the Harnix global ${instructionFile} block.`,
            false,
          ),
        ];
  } catch (error: unknown) {
    if (isMissing(error)) return [];
    return [
      finding(
        `${shadow.code}-invalid`,
        "error",
        display,
        `The ${label} ${shadow.subject} cannot be inspected safely.`,
        false,
      ),
    ];
  }
}

async function inspectTarget(target: DoctorTarget, generatorVersion: string): Promise<TargetInspection> {
  let manifestPath: string;
  try {
    manifestPath = await resolveSafeGlobalPath(target.root, target.manifestPath);
  } catch {
    return invalidTarget(
      "global-root-invalid",
      target.root.logicalPath,
      "The user-global root cannot be inspected safely.",
    );
  }

  let manifest: GlobalManagedManifestV1 | undefined;
  try {
    manifest = await readGlobalManagedManifest(manifestPath);
  } catch (error: unknown) {
    if (!isMissing(error)) {
      return invalidTarget(
        "global-manifest-invalid",
        target.root.display(target.manifestPath),
        "The Harnix global ownership manifest is invalid or unreadable.",
      );
    }
  }
  if (manifest !== undefined && manifest.platform !== target.globalPlatform) {
    return invalidTarget(
      "global-manifest-platform-mismatch",
      target.root.display(target.manifestPath),
      "The Harnix global ownership manifest belongs to a different platform root.",
    );
  }

  try {
    const reconciliation = await reconcileGlobalManagedFiles({
      desired: target.desired,
      dryRun: true,
      generatorVersion,
      manifestPath: target.manifestPath,
      platform: target.globalPlatform,
      preserveUnownedRoot: target.preserveUnownedRoot,
      preserveUnownedSkillDirectories: true,
      removeObsolete: true,
      restoreDeleted: false,
      root: target.root,
      ...(target.memberMatchers === undefined ? {} : { memberMatchers: target.memberMatchers }),
    });
    return {
      state: manifest === undefined ? "missing" : "valid",
      findings: findingsFromReconciliation(target, manifest, reconciliation),
    };
  } catch {
    return invalidTarget(
      "global-reconciliation-invalid",
      target.root.logicalPath,
      "The installed global integration cannot be inspected safely.",
    );
  }
}

function invalidTarget(code: string, path: string | undefined, message: string): TargetInspection {
  return { state: "invalid", findings: [finding(code, "error", path, message, false)] };
}

const RECONCILIATION_FINDINGS = [
  ["created", "global-managed-missing", "A Harnix-managed global surface is missing."],
  ["updated", "global-managed-outdated", "A Harnix-managed global surface differs from the current template."],
  ["deleted", "global-managed-deleted", "A Harnix-managed global surface would be removed by reconciliation."],
] as const;

function findingsFromReconciliation(
  target: DoctorTarget,
  manifest: GlobalManagedManifestV1 | undefined,
  reconciliation: GlobalManagedReconcileResult,
): DoctorFinding[] {
  const findings: DoctorFinding[] = [];
  for (const [field, code, message] of RECONCILIATION_FINDINGS) {
    for (const label of reconciliation[field]) {
      findings.push(finding(code, "warning", displayLabel(target.root, label), message, true));
    }
  }
  for (const warning of reconciliation.warnings) {
    findings.push(findingForManagedWarning(target.root, warning));
  }
  if (manifest !== undefined) {
    const desiredKeys = new Set(target.desired.map((item) => `${item.path}\u0000${item.sourceId}`));
    for (const entry of manifest.entries) {
      if (desiredKeys.has(`${entry.path}\u0000${entry.sourceId}`)) continue;
      const label = entry.kind === "file" ? entry.path : `${entry.path}#${entry.sourceId}`;
      findings.push(
        finding(
          "global-managed-obsolete",
          "warning",
          displayLabel(target.root, label),
          "The global ownership manifest includes an obsolete Harnix surface.",
          true,
        ),
      );
    }
  }
  return findings;
}

const MALFORMED_WARNING_CODES = new Set([
  "duplicate-json-member",
  "invalid-json",
  "invalid-json-pointer",
  "malformed-markers",
]);

function findingForManagedWarning(root: UserPathRoot, warning: GlobalManagedWarning): DoctorFinding {
  const path = displayLabel(root, warning.path);
  if (MALFORMED_WARNING_CODES.has(warning.code)) {
    return finding(
      "global-fragment-malformed",
      "warning",
      path,
      "A shared global integration fragment cannot be parsed or matched safely and will be preserved.",
      false,
    );
  }
  switch (warning.code) {
    case "manifest-conflict":
      return finding(
        "global-managed-conflict",
        "warning",
        path,
        "The owned global fragment no longer matches the current selector and will be preserved.",
        false,
      );
    case "modified":
      return finding(
        "global-managed-modified",
        "warning",
        path,
        "A Harnix-managed global surface was modified and will be preserved.",
        false,
      );
    case "untracked-collision":
      return finding(
        "global-untracked-surface",
        "warning",
        path,
        "A matching global surface is not owned by Harnix and will be preserved.",
        false,
      );
    case "deleted":
      return finding("global-managed-missing", "warning", path, "A previously owned global surface is missing.", true);
    default:
      return finding(
        "global-managed-drift",
        "warning",
        path,
        "A Harnix-managed global surface requires review.",
        false,
      );
  }
}

function displayLabel(root: UserPathRoot, label: string): string {
  const separator = label.indexOf("#");
  const path = separator < 0 ? label : label.slice(0, separator);
  const suffix = separator < 0 ? "" : label.slice(separator);
  return `${root.display(path)}${suffix}`;
}
