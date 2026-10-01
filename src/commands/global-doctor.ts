import { configuratorPlans, defaultCommandLookup } from "src/commands/setup.js";
import { diagnoseGlobal } from "src/core/doctor/global.js";
import type {
  CodexTrustLookup,
  CodexTrustState,
  DiagnoseGlobalIntegrationsOptions,
  GlobalDoctorCommandLookup,
  GlobalDoctorFinding,
  GlobalDoctorPlatform,
  GlobalIntegrationCapability,
  GlobalIntegrationCapabilityLookup,
  GlobalIntegrationDiagnosis,
  GlobalIntegrationStatus,
} from "src/core/doctor/global-types.js";
import { packageVersion } from "src/version.js";

export type {
  CodexTrustLookup,
  CodexTrustState,
  DiagnoseGlobalIntegrationsOptions,
  GlobalDoctorCommandLookup,
  GlobalDoctorFinding,
  GlobalDoctorPlatform,
  GlobalIntegrationCapability,
  GlobalIntegrationCapabilityLookup,
  GlobalIntegrationDiagnosis,
  GlobalIntegrationStatus,
};

/** Reads only verified user-global roots; the dry-run reconciler inspects ownership and drift. */
export async function diagnoseGlobalIntegrations(
  options: DiagnoseGlobalIntegrationsOptions = {},
): Promise<GlobalIntegrationDiagnosis[]> {
  return diagnoseGlobal(options, {
    defaultCommandLookup,
    generatorVersion: packageVersion,
    plans: configuratorPlans(),
  });
}
