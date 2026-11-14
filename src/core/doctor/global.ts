import { resolve } from "node:path";

import { finding, sortFindings, type DoctorFinding } from "src/core/doctor/findings.js";
import { isTestProcess } from "src/utils/test-process.js";
import { inspectPlatform, type DoctorTarget, type PlatformInspection } from "src/core/doctor/global-inspect.js";
import { finalizeInspection, safeCommandLookup } from "src/core/doctor/global-status.js";
import type {
  DiagnoseGlobalIntegrationsOptions,
  GlobalDoctorCommandLookup,
  GlobalDoctorPlatform,
  GlobalIntegrationDiagnosis,
} from "src/core/doctor/global-types.js";
import { globalTargets, type GlobalPlanProvider } from "src/core/global/targets.js";
import { getPlatform, PLATFORM_IDS } from "src/core/platform/registry.js";
import {
  resolveSelectedUserPlatformRoots,
  selectedUserRoot,
  type SelectedUserPlatformRoots,
} from "src/core/platform/user-paths.js";

export interface DiagnoseGlobalDeps {
  readonly plans: GlobalPlanProvider;
  readonly generatorVersion: string;
  /** Used when the caller injected no lookup (production only; test mode requires an injected one). */
  readonly defaultCommandLookup: GlobalDoctorCommandLookup;
}

/** Reads only verified user-global roots; the dry-run reconciler inspects ownership and drift. */
export async function diagnoseGlobal(
  options: DiagnoseGlobalIntegrationsOptions,
  deps: DiagnoseGlobalDeps,
): Promise<GlobalIntegrationDiagnosis[]> {
  const platforms = selectedPlatforms(options.platforms);
  const invalid = (code: string, message: string): GlobalIntegrationDiagnosis[] =>
    platforms.map((platform) => ({
      platform,
      status: "invalid",
      findings: [finding(code, "error", undefined, message, false)],
    }));
  if (isTestProcess() && options.roots === undefined && options.homeResolver === undefined) {
    return invalid(
      "test-home-required",
      "Global diagnostics require injected user roots or a homeResolver in test mode.",
    );
  }
  if (isTestProcess() && options.commandLookup === undefined) {
    return invalid(
      "test-command-lookup-required",
      "Global diagnostics require an injected commandLookup in test mode.",
    );
  }
  const resolved = await Promise.all(platforms.map(async (platform) => resolvePlatform(platform, options, deps)));
  const inspections = resolved.map((item) => item.inspection);
  const launcherAvailable = inspections.some((inspection) => inspection.state === "healthy")
    ? await safeCommandLookup(options.commandLookup ?? deps.defaultCommandLookup)
    : undefined;
  const diagnoses = await Promise.all(
    inspections.map(async (inspection) =>
      finalizeInspection(inspection, launcherAvailable, options.codexTrustLookup, options.capabilityLookup),
    ),
  );
  return diagnoses.map((diagnosis, index) =>
    withAmbiguousRoot(diagnosis, options.environment, resolved[index]?.roots ?? {}),
  );
}

interface ResolvedPlatform {
  readonly roots: SelectedUserPlatformRoots | undefined;
  readonly inspection: PlatformInspection;
}

/** One platform's roots are resolved and inspected alone, so a bad relocation variable invalidates only that platform. */
async function resolvePlatform(
  platform: GlobalDoctorPlatform,
  options: DiagnoseGlobalIntegrationsOptions,
  deps: DiagnoseGlobalDeps,
): Promise<ResolvedPlatform> {
  let roots: SelectedUserPlatformRoots;
  try {
    roots =
      options.roots ??
      (await resolveSelectedUserPlatformRoots([platform], {
        ...(options.environment === undefined ? {} : { environment: options.environment }),
        ...(options.homeResolver === undefined ? {} : { homeResolver: options.homeResolver }),
      }));
  } catch {
    return {
      roots: undefined,
      inspection: {
        platform,
        state: "invalid",
        findings: [finding("global-root-invalid", "error", undefined, invalidRootMessage(platform, options), false)],
      },
    };
  }
  const inspection = await inspectPlatform(
    platform,
    doctorTargets(platform, roots, deps.plans),
    roots,
    deps.generatorVersion,
  );
  return { roots, inspection };
}

/** Names the relocation variable that is set (never its value) so the user knows what to fix. */
function invalidRootMessage(platform: GlobalDoctorPlatform, options: DiagnoseGlobalIntegrationsOptions): string {
  const environment = options.environment ?? process.env;
  const variable = getPlatform(platform).roots.find(
    (root) => root.envOverride !== null && environment[root.envOverride] !== undefined,
  )?.envOverride;
  const subject = variable === null || variable === undefined ? "" : ` Check ${variable}.`;
  return `The user-global integration root could not be resolved safely.${subject}`;
}

function doctorTargets(
  platform: GlobalDoctorPlatform,
  roots: SelectedUserPlatformRoots,
  plans: GlobalPlanProvider,
): DoctorTarget[] {
  return globalTargets([platform], roots).map((target) => ({
    ...target,
    desired: plans.desired(target.planKey),
    memberMatchers: plans.memberMatchers(target.planKey),
  }));
}

function selectedPlatforms(requested: readonly GlobalDoctorPlatform[] | undefined): GlobalDoctorPlatform[] {
  if (requested === undefined) return [...PLATFORM_IDS];
  const selected = new Set(requested);
  return PLATFORM_IDS.filter((platform) => selected.has(platform));
}

/** An environment variable pointing elsewhere makes the documented root ambiguous; Harnix reports it, never follows it. */
function withAmbiguousRoot(
  diagnosis: GlobalIntegrationDiagnosis,
  environment: Readonly<Record<string, string | undefined>> | undefined,
  roots: SelectedUserPlatformRoots,
): GlobalIntegrationDiagnosis {
  const record = getPlatform(diagnosis.platform);
  const configured =
    record.ambiguousRootEnv === null ? undefined : (environment ?? process.env)[record.ambiguousRootEnv];
  const documentedRoot = selectedUserRoot(roots, diagnosis.platform, record.roots[0]?.key ?? "");
  if (
    record.ambiguousRootEnv === null ||
    diagnosis.status === "not-installed" ||
    diagnosis.status === "invalid" ||
    configured === undefined ||
    configured.trim().length === 0 ||
    documentedRoot === undefined ||
    resolve(configured) === documentedRoot.path
  ) {
    return diagnosis;
  }
  const extra: DoctorFinding = finding(
    `${diagnosis.platform}-home-ambiguity`,
    "warning",
    undefined,
    `${record.ambiguousRootEnv} differs from the documented IDE user root. Harnix kept the integration at ${documentedRoot.logicalPath} and did not retarget it.`,
    false,
  );
  return { ...diagnosis, findings: sortFindings([...diagnosis.findings, extra]) };
}
