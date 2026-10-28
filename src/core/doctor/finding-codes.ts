import { PLATFORM_IDS, platformRecords } from "src/core/platform/registry.js";

import { GLOBAL_FINDING_CODES } from "./finding-codes-global.js";
import { PROJECT_FINDING_CODES } from "./finding-codes-project.js";

import type { RepoMapHealth } from "src/core/repo-map/service.js";

/** Suffixes appended to a platform id: `<platform>-trust-pending`, `<platform>-home-ambiguity`, and so on. */
export const PLATFORM_FINDING_SUFFIXES = [
  "home-ambiguity",
  "precedence-unknown",
  "trust-evidence",
  "trust-pending",
] as const;

/** Suffixes appended to a registry shadow-file code: `<shadow.code>-shadowed`, `<shadow.code>-invalid`. */
export const SHADOW_FINDING_SUFFIXES = ["invalid", "shadowed"] as const;

/** Repository-map states that produce a `repo-map-<state>` finding (a `ready` map produces none). */
export const REPO_MAP_FINDING_STATES: readonly Exclude<RepoMapHealth, "ready">[] = ["invalid", "missing", "stale"];

export { GLOBAL_FINDING_CODES, PROJECT_FINDING_CODES };

/** Codes built from the platform registry, so a new platform record needs no catalog edit. */
export function platformFindingCodes(): string[] {
  const shadows = platformRecords().flatMap((record) => record.shadowingFiles.map((shadow) => shadow.code));
  return [
    ...PLATFORM_IDS.flatMap((id) => PLATFORM_FINDING_SUFFIXES.map((suffix) => `${id}-${suffix}`)),
    ...shadows.flatMap((code) => SHADOW_FINDING_SUFFIXES.map((suffix) => `${code}-${suffix}`)),
  ];
}

/** Every finding code `harnix doctor` can report: static project and global codes plus the platform-built ones. */
export const DOCTOR_FINDING_CODES: readonly string[] = [
  ...new Set([
    ...PROJECT_FINDING_CODES,
    ...GLOBAL_FINDING_CODES,
    ...REPO_MAP_FINDING_STATES.map((state) => `repo-map-${state}`),
    ...platformFindingCodes(),
  ]),
].sort();
