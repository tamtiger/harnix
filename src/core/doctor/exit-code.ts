import type { DoctorReport } from "src/core/doctor/doctor.js";

/**
 * The frozen doctor exit semantics: 2 when project or global state is invalid, 1 when there is anything to act on
 * (`ok` is false), otherwise 0. `allowWarnings` only forgives findings that are all warnings; it never hides an
 * error or an invalid state.
 */
export function doctorExitCode(report: DoctorReport, allowWarnings = false): 0 | 1 | 2 {
  if (
    report.project.status === "invalid" ||
    report.globalIntegrations.some((integration) => integration.status === "invalid")
  )
    return 2;
  if (report.ok) return 0;
  return allowWarnings && report.summary.errors === 0 ? 0 : 1;
}
