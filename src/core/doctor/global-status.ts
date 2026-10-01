import { finding, sortFindings, type DoctorFinding } from "src/core/doctor/findings.js";
import type { PlatformInspection } from "src/core/doctor/global-inspect.js";
import type {
  CodexTrustLookup,
  CodexTrustState,
  GlobalDoctorPlatform,
  GlobalIntegrationCapability,
  GlobalIntegrationCapabilityLookup,
  GlobalIntegrationDiagnosis,
  GlobalIntegrationStatus,
} from "src/core/doctor/global-types.js";
import { getPlatform } from "src/core/platform/registry.js";

/**
 * Turns a healthy inspection into its final status. What a healthy install may claim without external
 * evidence comes from the registry (`healthyReadiness`): trust-gated platforms stay pending until the
 * trust lookup confirms them, and precedence-unknown platforms stay unknown until a capability lookup says more.
 */
export async function finalizeInspection(
  inspection: PlatformInspection,
  launcherAvailable: boolean | undefined,
  trustLookup: CodexTrustLookup | undefined,
  capabilityLookup: GlobalIntegrationCapabilityLookup | undefined,
): Promise<GlobalIntegrationDiagnosis> {
  const { platform } = inspection;
  const findings = [...inspection.findings];
  if (inspection.state === "not-installed" || inspection.state === "invalid" || inspection.state === "drifted") {
    return { platform, status: inspection.state, findings };
  }
  const done = (status: GlobalIntegrationStatus): GlobalIntegrationDiagnosis => ({
    platform,
    status,
    findings: sortFindings(findings),
  });
  const capability = await safeCapabilityLookup(capabilityLookup, platform);
  if (capability === "unsupported-version") {
    findings.push(
      finding(
        "global-unsupported-version",
        "warning",
        undefined,
        "The installed platform version does not support this Harnix global integration contract.",
        false,
      ),
    );
    return done("unsupported-version");
  }
  if (launcherAvailable !== true) {
    findings.push(
      finding(
        "global-binary-unavailable",
        "warning",
        undefined,
        "The fixed 'harnix' hook command was not found on PATH.",
        false,
      ),
    );
    return done("binary-unavailable");
  }
  const record = getPlatform(platform);
  const reportsCapability = (): boolean => {
    if (capability !== "active" && capability !== "shadowed") return false;
    findings.push(capabilityFinding(capability));
    return true;
  };
  if (record.healthyReadiness === "precedence-unknown") {
    if (reportsCapability()) return done(capability as "active" | "shadowed");
    findings.push(
      finding(
        `${platform}-precedence-unknown`,
        "warning",
        undefined,
        `${record.label} plugin-versus-workspace precedence is not verified.`,
        false,
      ),
    );
    return done("precedence-unknown");
  }
  if (record.healthyReadiness === "installed-pending-trust") {
    if (findings.some((item) => record.shadowingFiles.some((shadow) => item.code === `${shadow.code}-shadowed`))) {
      return done("shadowed");
    }
    if ((await safeTrustLookup(trustLookup)) !== "trusted") {
      findings.push(
        finding(
          `${platform}-trust-pending`,
          "warning",
          undefined,
          record.setupNotice ?? `Review and trust the exact Harnix hook from ${record.label} before it can run.`,
          false,
        ),
      );
      return done("installed-pending-trust");
    }
    findings.push(
      finding(
        `${platform}-trust-evidence`,
        "info",
        undefined,
        `External evidence confirms the exact current ${record.label} hook is trusted.`,
        false,
      ),
    );
  }
  if (reportsCapability()) return done(capability as "active" | "shadowed");
  return done("installed");
}

function capabilityFinding(capability: "active" | "shadowed"): DoctorFinding {
  return capability === "active"
    ? finding(
        "global-integration-active",
        "info",
        undefined,
        "External evidence confirms this global integration is active for the inspected platform.",
        false,
      )
    : finding(
        "global-integration-shadowed",
        "warning",
        undefined,
        "External evidence confirms this global integration is shadowed by a higher-precedence surface.",
        false,
      );
}

export async function safeCommandLookup(lookup: (command: string) => Promise<boolean>): Promise<boolean> {
  try {
    return await lookup("harnix");
  } catch {
    return false;
  }
}

async function safeTrustLookup(lookup: CodexTrustLookup | undefined): Promise<CodexTrustState> {
  if (lookup === undefined) return "unknown";
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
  if (lookup === undefined) return undefined;
  try {
    const capability = await lookup(platform);
    return capability === "supported" ||
      capability === "unsupported-version" ||
      capability === "active" ||
      capability === "shadowed"
      ? capability
      : undefined;
  } catch {
    return undefined;
  }
}
