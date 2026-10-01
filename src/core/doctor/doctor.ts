import { sortFindings, finding } from "src/core/doctor/findings.js";
import { diagnoseGlobal, type DiagnoseGlobalDeps } from "src/core/doctor/global.js";
import type {
  DiagnoseGlobalIntegrationsOptions,
  GlobalDoctorPlatform,
  GlobalIntegrationDiagnosis,
} from "src/core/doctor/global-types.js";
import {
  diagnoseProjectSection,
  type DesiredProjectPaths,
  type DoctorProjectSection,
} from "src/core/doctor/project.js";
import { GlobalManagedTransactionError } from "src/core/global/managed-files.js";
import { getPlatform } from "src/core/platform/registry.js";
import { diagnoseRepoMap, refreshRepoMap } from "src/core/repo-map/service.js";

export interface DoctorReport {
  schemaVersion: 2;
  generator: "harnix";
  ok: boolean;
  project: DoctorProjectSection;
  globalIntegrations: GlobalIntegrationDiagnosis[];
  summary: { errors: number; warnings: number; fixed: number };
}

export interface DoctorRunOptions extends Omit<DiagnoseGlobalIntegrationsOptions, "platforms" | "roots"> {
  root: string;
  fix?: boolean | undefined;
  /** Opt-in safe reconciliation of already-owned user-global integrations. */
  global?: boolean | undefined;
  userRoots?: DiagnoseGlobalIntegrationsOptions["roots"];
}

export type GlobalFix = (options: {
  commandLookup?: DiagnoseGlobalIntegrationsOptions["commandLookup"];
  environment?: DiagnoseGlobalIntegrationsOptions["environment"];
  homeResolver?: DiagnoseGlobalIntegrationsOptions["homeResolver"];
  restoreDeleted: true;
}) => Promise<{ platforms: readonly { created: readonly string[]; updated: readonly string[] }[] }>;

export interface DoctorDeps extends DiagnoseGlobalDeps {
  readonly desiredPaths: DesiredProjectPaths;
  /** Reconciles project-owned files; returns how many entries it created, updated or deleted. */
  readonly fixProject: (root: string) => Promise<number>;
  readonly fixGlobal: GlobalFix;
}

/**
 * One doctor for project state and user-global integration state. Project-only --fix never writes
 * user-global configuration; --fix --global reconciles only already-owned global integrations.
 */
export async function runDoctor(options: DoctorRunOptions, deps: DoctorDeps): Promise<DoctorReport> {
  const diagnoseGlobals = () => diagnoseGlobal(globalOptions(options), deps);
  let project = await diagnoseProjectSection(options.root, deps.desiredPaths);
  let globalIntegrations = await diagnoseGlobals();
  if (!options.fix) return report(project, globalIntegrations, 0);

  let fixed = 0;
  let globalRollbackPartial: string[] = [];
  if (!options.global && project.status === "ready") fixed += await fixProjectState(options.root, deps);
  if (options.global) {
    try {
      const reconciliation = await deps.fixGlobal({
        ...(options.commandLookup === undefined ? {} : { commandLookup: options.commandLookup }),
        ...(options.environment === undefined ? {} : { environment: options.environment }),
        ...(options.homeResolver === undefined ? {} : { homeResolver: options.homeResolver }),
        restoreDeleted: true,
      });
      fixed += reconciliation.platforms.reduce(
        (total, platform) => total + platform.created.length + platform.updated.length,
        0,
      );
    } catch (error: unknown) {
      if (error instanceof GlobalManagedTransactionError) globalRollbackPartial = error.rollback.partial;
      // Global diagnostics below preserve corrupt or modified user content.
    }
  }
  project = await diagnoseProjectSection(options.root, deps.desiredPaths);
  globalIntegrations = await diagnoseGlobals();
  if (globalRollbackPartial.length > 0) {
    globalIntegrations = addPartialRollbackFindings(globalIntegrations, globalRollbackPartial);
  }
  return report(project, globalIntegrations, fixed);
}

async function fixProjectState(root: string, deps: DoctorDeps): Promise<number> {
  let fixed = 0;
  try {
    fixed += await deps.fixProject(root);
  } catch {
    // Re-diagnose to report an invalid project state without exposing an implementation-specific
    // error in a global hook or JSON consumer.
  }
  try {
    if ((await diagnoseRepoMap(root)) !== "ready") {
      await refreshRepoMap({ root });
      fixed += 1;
    }
  } catch {
    // The second diagnosis reports the cache state without replacing an unsafe path.
  }
  return fixed;
}

function globalOptions(options: DoctorRunOptions): DiagnoseGlobalIntegrationsOptions {
  return {
    ...(options.capabilityLookup === undefined ? {} : { capabilityLookup: options.capabilityLookup }),
    ...(options.codexTrustLookup === undefined ? {} : { codexTrustLookup: options.codexTrustLookup }),
    ...(options.commandLookup === undefined ? {} : { commandLookup: options.commandLookup }),
    ...(options.environment === undefined ? {} : { environment: options.environment }),
    ...(options.homeResolver === undefined ? {} : { homeResolver: options.homeResolver }),
    ...(options.userRoots === undefined ? {} : { roots: options.userRoots }),
  };
}

function addPartialRollbackFindings(
  integrations: readonly GlobalIntegrationDiagnosis[],
  partialPaths: readonly string[],
): GlobalIntegrationDiagnosis[] {
  return integrations.map((integration) => {
    const paths = partialPaths.filter((path) => belongsToPlatform(path, integration.platform));
    if (paths.length === 0) return integration;
    return {
      ...integration,
      findings: sortFindings([
        ...integration.findings,
        ...paths.map((path) =>
          finding(
            "global-partial-rollback",
            "warning",
            path,
            "A concurrent edit was preserved during rollback; inspect it before retrying the global operation.",
            false,
          ),
        ),
      ]),
      status: integration.status === "invalid" ? "invalid" : "drifted",
    };
  });
}

/** A display path belongs to a platform when it sits below one of that platform's registered roots. */
function belongsToPlatform(path: string, platform: GlobalDoctorPlatform): boolean {
  return getPlatform(platform).roots.some((root) =>
    [root.logicalPath, ...(root.envOverride === null ? [] : [`$${root.envOverride}`])].some((prefix) =>
      path.startsWith(`${prefix}/`),
    ),
  );
}

function report(
  project: DoctorProjectSection,
  globalIntegrations: GlobalIntegrationDiagnosis[],
  fixed: number,
): DoctorReport {
  const all = [...project.findings, ...globalIntegrations.flatMap((integration) => integration.findings)];
  const errors = all.filter((item) => item.severity === "error").length;
  const warnings = all.filter((item) => item.severity === "warning").length;
  return {
    generator: "harnix",
    schemaVersion: 2,
    ok: errors === 0 && warnings === 0,
    project: { ...project, findings: sortFindings(project.findings) },
    globalIntegrations,
    summary: { errors, warnings, fixed },
  };
}
