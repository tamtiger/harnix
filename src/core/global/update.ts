import {
  GlobalManagedManifestError,
  readGlobalManagedManifest,
  resolveSafeGlobalPath,
} from "src/core/global/managed-files.js";
import { setupGlobal, type SetupGlobalOptions, type SetupGlobalResult } from "src/core/global/setup.js";
import { platformRecords, type PlatformId } from "src/core/platform/registry.js";
import { resolveSelectedUserPlatformRoots, selectedUserRoot, type HomeResolver } from "src/core/platform/user-paths.js";
import { isMissingPathError } from "src/utils/errno.js";

export interface UpdateGlobalOptions extends Omit<SetupGlobalOptions, "platforms" | "removeObsolete"> {
  /** Explicit platforms; omitted or empty means every platform that already carries a valid Harnix sidecar. */
  readonly platforms?: readonly PlatformId[] | undefined;
  readonly homeResolver?: HomeResolver | undefined;
}

/**
 * Reconciles explicitly selected integrations, or discovers only platform roots that already carry a
 * valid Harnix sidecar. It never consults a project config or project manifest.
 */
export async function updateGlobal(options: UpdateGlobalOptions): Promise<SetupGlobalResult> {
  const selected =
    options.platforms === undefined || options.platforms.length === 0
      ? await installedPlatforms(options)
      : [...new Set(options.platforms)].sort();
  if (selected.length === 0) return { scope: "user", platforms: [] };
  return setupGlobal({
    ...options,
    removeObsolete: true,
    restoreDeleted: options.restoreDeleted === true,
    platforms: selected,
  });
}

/** Platforms with at least one valid sidecar owned by the matching registered target. */
async function installedPlatforms(options: UpdateGlobalOptions): Promise<PlatformId[]> {
  const installed: PlatformId[] = [];
  for (const record of platformRecords()) {
    const id = record.id as PlatformId;
    // Each platform resolves only its own roots: a malformed CODEX_HOME must not stop Kiro from being updated.
    const roots = await resolveSelectedUserPlatformRoots([id], {
      ...(options.environment === undefined ? {} : { environment: options.environment }),
      ...(options.homeResolver === undefined ? {} : { homeResolver: options.homeResolver }),
    }).catch(() => undefined);
    if (roots === undefined) continue;
    const found = await Promise.all(
      record.targets.map(async (target) => {
        const root = selectedUserRoot(roots, id, target.rootKey);
        return root !== undefined && (await hasValidSidecar(root, target.manifestPath, target.globalPlatform));
      }),
    );
    if (found.some(Boolean)) installed.push(id);
  }
  return installed;
}

async function hasValidSidecar(
  root: NonNullable<ReturnType<typeof selectedUserRoot>>,
  relativePath: string,
  platform: string,
): Promise<boolean> {
  try {
    const manifest = await readGlobalManagedManifest(await resolveSafeGlobalPath(root, relativePath));
    return manifest.platform === platform;
  } catch (error: unknown) {
    if (isMissingPathError(error) || error instanceof GlobalManagedManifestError) return false;
    throw error;
  }
}
