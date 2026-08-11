import { setupPlatforms, type GlobalSetupPlatform, type HookCommandLookup, type SetupPlatformsResult } from "./setup.js";
import { GlobalManagedManifestError, readGlobalManagedManifest, resolveSafeGlobalPath, type GlobalPlatform } from "../utils/global-managed-files.js";
import { resolveUserPlatformRoots, type HomeResolver } from "../utils/user-paths.js";

export interface UpdateGlobalPlatformsOptions {
  readonly platforms?: readonly GlobalSetupPlatform[] | undefined;
  readonly dryRun?: boolean | undefined;
  readonly homeResolver?: HomeResolver | undefined;
  readonly environment?: Readonly<Record<string, string | undefined>> | undefined;
  readonly commandLookup?: HookCommandLookup | undefined;
  /** Missing owned fragments are preserved by default; callers must opt in to restoration. */
  readonly restoreDeleted?: boolean | undefined;
}

/**
 * Reconciles explicitly selected integrations, or discovers only platform
 * roots that already carry a valid Harnix sidecar. It never consults a project
 * config or project manifest.
 */
export async function updateGlobalPlatforms(options: UpdateGlobalPlatformsOptions = {}): Promise<SetupPlatformsResult> {
  if (isTestProcess() && options.homeResolver === undefined) {
    throw new Error("Global update requires an injected homeResolver in test mode.");
  }
  if (isTestProcess() && options.commandLookup === undefined) {
    throw new Error("Global update requires an injected commandLookup in test mode.");
  }
  const selected = options.platforms === undefined || options.platforms.length === 0
    ? await installedPlatforms(options)
    : [...new Set(options.platforms)].sort();
  if (selected.length === 0) return { scope: "user", platforms: [] };
  return setupPlatforms({
    ...(options.commandLookup === undefined ? {} : { commandLookup: options.commandLookup }),
    ...(options.environment === undefined ? {} : { environment: options.environment }),
    ...(options.homeResolver === undefined ? {} : { homeResolver: options.homeResolver }),
    dryRun: options.dryRun,
    removeObsolete: true,
    restoreDeleted: options.restoreDeleted === true,
    platforms: selected,
  });
}

async function installedPlatforms(options: UpdateGlobalPlatformsOptions): Promise<GlobalSetupPlatform[]> {
  const roots = await resolveUserPlatformRoots({
    ...(options.environment === undefined ? {} : { environment: options.environment }),
    ...(options.homeResolver === undefined ? {} : { homeResolver: options.homeResolver }),
  });
  const [kiro, antigravityDesktop, antigravityCli, codexConfig, codexSkills] = await Promise.all([
    hasValidSidecar(roots.kiro, "harnix/managed.json", "kiro"),
    hasValidSidecar(roots.antigravityDesktop, ".managed.json", "antigravity-desktop"),
    hasValidSidecar(roots.antigravityCli, ".managed.json", "antigravity-cli"),
    hasValidSidecar(roots.codex.config, "harnix/managed.json", "codex"),
    hasValidSidecar(roots.codex.skills, "harnix/managed.json", "codex"),
  ]);
  return [
    ...(kiro ? ["kiro" as const] : []),
    ...(antigravityDesktop || antigravityCli ? ["antigravity" as const] : []),
    ...(codexConfig || codexSkills ? ["codex" as const] : []),
  ];
}

async function hasValidSidecar(
  root: Awaited<ReturnType<typeof resolveUserPlatformRoots>>["kiro"],
  relativePath: string,
  platform: GlobalPlatform,
): Promise<boolean> {
  try {
    const manifest = await readGlobalManagedManifest(await resolveSafeGlobalPath(root, relativePath));
    return manifest.platform === platform;
  } catch (error: unknown) {
    if (isMissing(error) || error instanceof GlobalManagedManifestError) return false;
    throw error;
  }
}

function isMissing(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isTestProcess(): boolean {
  return process.env.VITEST !== undefined || process.env.NODE_ENV === "test";
}
