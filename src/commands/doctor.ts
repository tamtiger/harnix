import { desiredFiles, updateProject } from "./update.js";
import { updateGlobalPlatforms } from "./global-update.js";
import { configuratorPlans, defaultCommandLookup } from "src/commands/setup.js";
import { runDoctor, type DoctorReport, type DoctorRunOptions } from "src/core/doctor/doctor.js";
import type { DoctorFinding } from "src/core/doctor/findings.js";
import type { DoctorProjectSection, DoctorProjectStatus } from "src/core/doctor/project.js";
import { packageVersion } from "src/version.js";

export type { DoctorFinding, DoctorProjectSection, DoctorProjectStatus, DoctorReport };

export interface DoctorOptions extends DoctorRunOptions {
  /** Injectable only for deterministic global-fix failure coverage. */
  globalUpdate?: typeof updateGlobalPlatforms | undefined;
}

/**
 * Doctor v2 keeps project state and user-global integration diagnostics
 * separate. Project-only --fix never writes user-global configuration.
 */
export async function diagnoseProject(options: DoctorOptions): Promise<DoctorReport> {
  return runDoctor(options, {
    defaultCommandLookup,
    desiredPaths: (config) => desiredFiles(config).map((file) => file.entry.path),
    fixGlobal: options.globalUpdate ?? updateGlobalPlatforms,
    fixProject: async (root) => {
      const reconciliation = await updateProject({ root });
      return reconciliation.created.length + reconciliation.updated.length + reconciliation.deleted.length;
    },
    generatorVersion: packageVersion,
    plans: configuratorPlans(),
  });
}
