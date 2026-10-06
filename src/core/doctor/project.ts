import { stat } from "node:fs/promises";

import { readConfigDocument, type HarnixConfigV2 } from "src/core/config/config.js";
import {
  containsSecret,
  finding,
  isMissing,
  redact,
  sortFindings,
  type DoctorFinding,
} from "src/core/doctor/findings.js";
import {
  inspectLegacyEntry,
  inspectUntrackedLegacySurfaces,
  readOptionalSafe,
} from "src/core/doctor/project-legacy.js";
import { inspectTaskRecords } from "src/core/doctor/project-tasks.js";
import { ownershipState, readManifest, type ManagedManifest } from "src/core/managed/project-files.js";
import { detectVersionSkew, skewMessage } from "src/core/versions/skew.js";
import { diagnoseRepoMap } from "src/core/repo-map/service.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";

export type DoctorProjectStatus = "ready" | "not-initialized" | "invalid";
export interface DoctorProjectSection {
  status: DoctorProjectStatus;
  findings: DoctorFinding[];
}

/** The project files the current templates would own; supplied by the command layer (templates live there). */
export type DesiredProjectPaths = (config: HarnixConfigV2) => readonly string[];

export async function diagnoseProjectSection(
  root: string,
  desiredPaths: DesiredProjectPaths,
  runningVersion?: string,
): Promise<DoctorProjectSection> {
  const findings: DoctorFinding[] = [];
  let config: HarnixConfigV2;
  try {
    const document = await readConfigDocument(await resolveSafeHarnixPath(root, "config.yaml"));
    config = document.config;
    if (document.sourceSchemaVersion === 1)
      findings.push(
        finding(
          "config-outdated",
          "warning",
          ".harnix/config.yaml",
          "Config schema v1 is valid but outdated; run doctor --fix or update to migrate it without rescanning.",
          true,
        ),
      );
  } catch (error: unknown) {
    if (isMissing(error)) {
      return {
        status: "not-initialized",
        findings: [
          finding(
            "project-not-initialized",
            "info",
            ".harnix/config.yaml",
            "No initialized Harnix project was found in this directory.",
            false,
          ),
        ],
      };
    }
    return {
      status: "invalid",
      findings: [finding("config-invalid", "error", ".harnix/config.yaml", redact(error, root), false)],
    };
  }

  let manifest: ManagedManifest;
  try {
    manifest = await readManifest(await resolveSafeHarnixPath(root, ".template-hashes.json"));
  } catch (error: unknown) {
    return {
      status: "invalid",
      findings: [finding("manifest-invalid", "error", ".harnix/.template-hashes.json", redact(error, root), false)],
    };
  }

  const skew = runningVersion === undefined ? undefined : detectVersionSkew(manifest, runningVersion);
  if (skew !== undefined)
    findings.push(finding("cli-version-skew", "warning", ".harnix/.template-hashes.json", skewMessage(skew), false));
  const desired = new Set(desiredPaths(config));
  inspectProfiles(config, findings);
  await inspectManagedEntries(root, manifest, desired, findings);
  await inspectUntrackedLegacySurfaces(root, manifest, findings);
  await inspectTaskRecords(root, findings);
  await inspectSensitiveFiles(root, findings);
  await inspectPermissions(root, manifest, findings);
  const repoMap = await diagnoseRepoMap(root);
  if (repoMap !== "ready") {
    findings.push(
      finding(
        `repo-map-${repoMap}`,
        repoMap === "invalid" ? "error" : "warning",
        ".harnix/cache/repo-map-v1.json",
        `Repository map cache is ${repoMap}; run doctor --fix to rebuild it.`,
        true,
      ),
    );
  }
  return {
    status: findings.some((entry) => entry.severity === "error") ? "invalid" : "ready",
    findings: sortFindings(findings),
  };
}

function inspectProfiles(config: HarnixConfigV2, findings: DoctorFinding[]): void {
  const projectLanguages = new Set(config.languages);
  const projectTechnologies = new Set(config.technologies);
  for (const packageConfig of config.packages) {
    const missingLanguages = packageConfig.languages.filter((id) => !projectLanguages.has(id));
    const missingTechnologies = packageConfig.technologies.filter((id) => !projectTechnologies.has(id));
    if (missingLanguages.length > 0 || missingTechnologies.length > 0)
      findings.push(
        finding(
          "profile-conflict",
          "warning",
          ".harnix/config.yaml",
          `Package ${packageConfig.path} contains profile IDs absent from the project union.`,
          false,
        ),
      );
  }
}

async function inspectManagedEntries(
  root: string,
  manifest: ManagedManifest,
  desired: ReadonlySet<string>,
  findings: DoctorFinding[],
): Promise<void> {
  for (const entry of manifest.entries) {
    if (entry.scope !== "project") {
      await inspectLegacyEntry(root, entry, findings);
      continue;
    }
    try {
      const state = await ownershipState(root, entry, entry);
      if (state === "deleted")
        findings.push(
          finding(
            "managed-missing",
            "warning",
            entry.path,
            "Managed file was deleted by the user; run update --restore to recreate it.",
            false,
          ),
        );
      if (state === "modified")
        findings.push(
          finding(
            "managed-modified",
            "warning",
            entry.path,
            "Managed file has user changes and will be preserved.",
            false,
          ),
        );
      if (!desired.has(entry.path))
        findings.push(
          finding(
            "managed-obsolete",
            "warning",
            entry.path,
            "Managed file is no longer in the desired template set.",
            state === "unchanged",
          ),
        );
    } catch (error) {
      findings.push(finding("unsafe-managed-path", "error", entry.path, redact(error, root), false));
    }
  }
  for (const path of desired)
    if (!manifest.entries.some((entry) => entry.scope === "project" && entry.path === path))
      findings.push(
        finding("managed-untracked", "warning", path, "Desired project file is not yet owned by Harnix.", true),
      );
}

async function inspectSensitiveFiles(root: string, findings: DoctorFinding[]): Promise<void> {
  for (const path of [
    ".harnix/config.yaml",
    ".harnix/.template-hashes.json",
    "AGENTS.md",
    "GEMINI.md",
    ".codex/hooks.json",
    ".kiro/hooks/harnix-context.kiro.hook",
  ]) {
    const text = await readOptionalSafe(root, path, findings);
    if (containsSecret(text))
      findings.push(finding("secret-exposure", "error", path, "Potential secret value detected: [REDACTED].", false));
  }
}

async function inspectPermissions(root: string, manifest: ManagedManifest, findings: DoctorFinding[]): Promise<void> {
  if (process.platform === "win32") return;
  for (const entry of manifest.entries.filter((item) => item.scope === "project")) {
    try {
      const metadata = await stat(await resolveSafeProjectPath(root, entry.path));
      if ((metadata.mode & 0o002) !== 0)
        findings.push(finding("broad-permissions", "warning", entry.path, "Managed file is world-writable.", false));
    } catch (error: unknown) {
      if (!isMissing(error))
        findings.push(finding("permission-check-failed", "warning", entry.path, redact(error, root), false));
    }
  }
}
