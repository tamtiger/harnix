import type { DoctorFinding } from "src/core/doctor/findings.js";
import type { PlatformId } from "src/core/platform/registry.js";
import type { HomeResolver, UserPlatformRoots } from "src/core/platform/user-paths.js";

export type GlobalDoctorPlatform = PlatformId;
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
export type GlobalIntegrationCapabilityLookup = (
  platform: GlobalDoctorPlatform,
) => Promise<GlobalIntegrationCapability | undefined>;

export type GlobalDoctorFinding = DoctorFinding;

export interface GlobalIntegrationDiagnosis {
  platform: GlobalDoctorPlatform;
  status: GlobalIntegrationStatus;
  findings: GlobalDoctorFinding[];
}

export interface DiagnoseGlobalIntegrationsOptions {
  /** Limits diagnostics to explicit public integrations; omitted means every registered platform. */
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
