import { rm } from "node:fs/promises";

import { resolveSafeHarnixPath } from "../utils/paths.js";

export interface UninstallOptions {
  root: string;
  /** Removes only project-owned `.harnix` data; global integrations are separate. */
  purge?: boolean | undefined;
  yes?: boolean | undefined;
}

export interface UninstallResult {
  removed: string[];
  preserved: string[];
  purgeTargets: string[];
  confirmationRequired: boolean;
}

/**
 * Project uninstall deliberately has a narrow lifecycle: legacy platform
 * surfaces remain inventory-only and global integrations require
 * `uninstall --global`. This prevents a project command from inferring
 * ownership of shared user configuration.
 */
export async function uninstallProject(options: UninstallOptions): Promise<UninstallResult> {
  if (!options.purge) {
    return { removed: [], preserved: [], purgeTargets: [], confirmationRequired: false };
  }

  // Resolve and realpath-check before preview or deletion. A symlinked
  // `.harnix` must never become an implicit external recursive-delete target.
  const harnixRoot = await resolveSafeHarnixPath(options.root);
  const purgeTargets = [".harnix"];
  if (!options.yes) {
    return { removed: [], preserved: [], purgeTargets, confirmationRequired: true };
  }

  await rm(harnixRoot, { force: true, recursive: true });
  return { removed: [".harnix"], preserved: [], purgeTargets, confirmationRequired: false };
}
