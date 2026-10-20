import type { HarnixConfigV2 } from "src/core/config/config.js";
import { finding, type DoctorFinding } from "src/core/doctor/findings.js";
import { detectProject, type ProjectDetection } from "src/core/stack/detection.js";
import { compareCodeUnits } from "src/utils/order.js";

const LISTED_PATHS = 10;

function normalize(path: string): string {
  const posix = path.replaceAll("\\", "/").replace(/\/+$/u, "");
  return posix === "" || posix === "./" ? "." : posix.replace(/^\.\//u, "");
}

/** Detected package directories that the configured `packages` do not list, as sorted POSIX paths. */
export function configPackagesDrift(configured: readonly string[], detected: readonly string[]): string[] {
  const known = new Set(configured.map(normalize));
  return [...new Set(detected.map(normalize))].filter((path) => !known.has(path)).sort(compareCodeUnits);
}

/**
 * An `info` finding when the current detection sees package directories that `.harnix/config.yaml` does not list
 * (init detects only once). Read-only; a detection failure is ignored so doctor never fails because of it.
 */
export async function inspectConfigDrift(
  root: string,
  config: Pick<HarnixConfigV2, "packages">,
  findings: DoctorFinding[],
  detect: (projectRoot: string) => Promise<Pick<ProjectDetection, "packages">> = detectProject,
): Promise<void> {
  try {
    const detection = await detect(root);
    const missing = configPackagesDrift(
      config.packages.map(({ path }) => path),
      detection.packages.map(({ path }) => path),
    );
    if (missing.length === 0) return;
    const listed = missing.slice(0, LISTED_PATHS).join(", ");
    const more = missing.length > LISTED_PATHS ? ` (+${missing.length - LISTED_PATHS} more)` : "";
    findings.push(
      finding(
        "config-packages-drift",
        "info",
        ".harnix/config.yaml",
        `Detected package directories not listed in packages: ${listed}${more}. Run harnix update to add them (it only adds; harnix update --dry-run previews).`,
        false,
      ),
    );
  } catch {
    // Detection is best effort: an unreadable tree must not turn a diagnosis into a failure.
  }
}
