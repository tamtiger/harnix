const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/u;

export interface VersionSkew {
  /** The highest `generatorVersion` recorded in the project manifest. */
  recorded: string;
  /** The version of the CLI that is running. */
  running: string;
}

function comparePrerelease(left: string | undefined, right: string | undefined): number {
  if (left === right) return 0;
  if (left === undefined) return 1;
  if (right === undefined) return -1;
  const leftParts = left.split(".");
  const rightParts = right.split(".");
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const l = leftParts[index];
    const r = rightParts[index];
    if (l === undefined) return -1;
    if (r === undefined) return 1;
    if (l === r) continue;
    const lNumber = /^\d+$/u.test(l);
    const rNumber = /^\d+$/u.test(r);
    if (lNumber && rNumber) return Number(l) > Number(r) ? 1 : -1;
    if (lNumber !== rNumber) return lNumber ? -1 : 1;
    return l < r ? -1 : 1;
  }
  return 0;
}

/** Semver order: a pre-release (`2.2.0-dev.3`) sorts below its release (`2.2.0`). Both must be valid semver. */
export function compareVersions(left: string, right: string): number {
  const a = SEMVER.exec(left);
  const b = SEMVER.exec(right);
  if (a === null || b === null) throw new Error(`Not a semver version: ${a === null ? left : right}.`);
  for (let index = 1; index <= 3; index += 1) {
    const difference = Number(a[index]) - Number(b[index]);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }
  return comparePrerelease(a[4], b[4]);
}

/** Skew exists when the project was written by a newer Harnix than the one running; local, no network, never blocking. */
export function detectVersionSkew(
  manifest: { entries: readonly { generatorVersion: string }[] },
  running: string,
): VersionSkew | undefined {
  let recorded: string | undefined;
  for (const { generatorVersion } of manifest.entries) {
    if (!SEMVER.test(generatorVersion)) continue;
    if (recorded === undefined || compareVersions(generatorVersion, recorded) > 0) recorded = generatorVersion;
  }
  return recorded !== undefined && SEMVER.test(running) && compareVersions(recorded, running) > 0
    ? { recorded, running }
    : undefined;
}

export const skewMessage = ({ recorded, running }: VersionSkew): string =>
  `harnix ${running} on PATH is older than the ${recorded} this project was written with, so newer gates may be missing: rebuild and reinstall the repository's harnix (only if the user allows).`;
