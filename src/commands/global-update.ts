import {
  configuratorPlans,
  defaultCommandLookup,
  isTestProcess,
  type GlobalSetupPlatform,
  type HookCommandLookup,
  type SetupPlatformsResult,
} from "./setup.js";
import { updateGlobal } from "src/core/global/update.js";
import type { HomeResolver } from "src/core/platform/user-paths.js";
import { acquireHarnixFileLock } from "src/utils/file-lock.js";
import { packageVersion } from "src/version.js";

export interface UpdateGlobalPlatformsOptions {
  readonly platforms?: readonly GlobalSetupPlatform[] | undefined;
  readonly dryRun?: boolean | undefined;
  readonly homeResolver?: HomeResolver | undefined;
  readonly environment?: Readonly<Record<string, string | undefined>> | undefined;
  readonly commandLookup?: HookCommandLookup | undefined;
  /** Missing owned fragments are preserved by default; callers must opt in to restoration. */
  readonly restoreDeleted?: boolean | undefined;
}

/** Reconciles selected integrations, or only roots that already carry a valid Harnix sidecar. */
export async function updateGlobalPlatforms(options: UpdateGlobalPlatformsOptions = {}): Promise<SetupPlatformsResult> {
  if (isTestProcess() && options.homeResolver === undefined) {
    throw new Error("Global update requires an injected homeResolver in test mode.");
  }
  if (isTestProcess() && options.commandLookup === undefined) {
    throw new Error("Global update requires an injected commandLookup in test mode.");
  }
  return updateGlobal({
    ...options,
    commandLookup: options.commandLookup ?? defaultCommandLookup,
    generatorVersion: packageVersion,
    lockAcquirer: acquireHarnixFileLock,
    plans: configuratorPlans(),
  });
}
