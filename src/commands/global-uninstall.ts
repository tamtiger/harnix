import { configuratorPlans } from "src/commands/setup.js";
import { isTestProcess } from "src/utils/test-process.js";
import type { GlobalLock, GlobalLockAcquirer } from "src/core/global/locking.js";
import {
  uninstallGlobal,
  type GlobalUninstallPlatformResult,
  type UninstallGlobalResult,
} from "src/core/global/uninstall.js";
import type { PlatformId } from "src/core/platform/registry.js";
import type { HomeResolver, SelectedUserPlatformRoots } from "src/core/platform/user-paths.js";
import { acquireHarnixFileLock } from "src/utils/file-lock.js";
import { packageVersion } from "src/version.js";

export type GlobalUninstallPlatform = PlatformId;
export type GlobalUninstallLock = GlobalLock;
export type GlobalUninstallLockAcquirer = GlobalLockAcquirer;
export type GlobalUninstallResult = UninstallGlobalResult;
export type { GlobalUninstallPlatformResult };

export interface GlobalUninstallOptions {
  readonly platforms: readonly GlobalUninstallPlatform[];
  readonly yes?: boolean | undefined;
  /** Test and lifecycle injection; production resolves roots from the active user profile. */
  readonly roots?: SelectedUserPlatformRoots | undefined;
  readonly homeResolver?: HomeResolver | undefined;
  readonly environment?: Readonly<Record<string, string | undefined>> | undefined;
  readonly lockAcquirer?: GlobalUninstallLockAcquirer | undefined;
}

/** Removes only explicitly selected, manifest-proven global integrations; mutations require `yes`. */
export async function uninstallGlobalIntegrations(options: GlobalUninstallOptions): Promise<GlobalUninstallResult> {
  if (isTestProcess() && options.roots === undefined && options.homeResolver === undefined) {
    throw new Error("Global uninstall requires an injected homeResolver in test mode.");
  }
  return uninstallGlobal({
    ...options,
    generatorVersion: packageVersion,
    lockAcquirer: options.lockAcquirer ?? acquireHarnixFileLock,
    plans: configuratorPlans(),
  });
}
