import { rmdir } from "node:fs/promises";

import {
  acquireGlobalLocks,
  releaseGlobalLocks,
  type GlobalLock,
  type GlobalLockAcquirer,
} from "src/core/global/locking.js";
import {
  GlobalManagedManifestError,
  readGlobalManagedManifest,
  reconcileGlobalManagedRoots,
  resolveSafeGlobalPath,
} from "src/core/global/managed-files.js";
import { globalTargets, type GlobalPlanProvider, type GlobalTarget } from "src/core/global/targets.js";
import type { GlobalManagedEntry, ReconcileGlobalManagedFilesOptions } from "src/core/global/types.js";
import { isPlatformId, type PlatformId } from "src/core/platform/registry.js";
import {
  resolveSelectedUserPlatformRoots,
  type HomeResolver,
  type SelectedUserPlatformRoots,
  type UserPathRoot,
} from "src/core/platform/user-paths.js";
import { compareCodeUnits } from "src/utils/order.js";

export interface UninstallGlobalOptions {
  readonly platforms: readonly PlatformId[];
  readonly plans: GlobalPlanProvider;
  readonly generatorVersion: string;
  readonly lockAcquirer: GlobalLockAcquirer;
  readonly yes?: boolean | undefined;
  /** Test and lifecycle injection; production resolves roots from the active user profile. */
  readonly roots?: SelectedUserPlatformRoots | undefined;
  readonly homeResolver?: HomeResolver | undefined;
  readonly environment?: Readonly<Record<string, string | undefined>> | undefined;
}

export interface GlobalUninstallPlatformResult {
  platform: PlatformId;
  targets: string[];
  removed: string[];
  preserved: string[];
  confirmationRequired: boolean;
}

export interface UninstallGlobalResult {
  scope: "user";
  platforms: GlobalUninstallPlatformResult[];
}

interface UninstallTarget extends GlobalTarget {
  readonly entries: readonly GlobalManagedEntry[];
}

type Outcomes = ReadonlyMap<UninstallTarget, Awaited<ReturnType<typeof reconcileGlobalManagedRoots>>[number]>;

/**
 * Removes only explicitly selected, manifest-proven global integrations.
 * Filesystem mutations require `yes`; platform roots and untracked content are
 * never candidates for deletion.
 */
export async function uninstallGlobal(options: UninstallGlobalOptions): Promise<UninstallGlobalResult> {
  const platforms = normalizePlatforms(options.platforms);
  const roots =
    options.roots ??
    (await resolveSelectedUserPlatformRoots(platforms, {
      ...(options.environment === undefined ? {} : { environment: options.environment }),
      ...(options.homeResolver === undefined ? {} : { homeResolver: options.homeResolver }),
    }));
  const targets = await loadTargets(platforms, roots);
  if (!options.yes) return resultFromTargets(platforms, targets, new Map(), true);

  const reconciliationOf = (target: UninstallTarget): ReconcileGlobalManagedFilesOptions => {
    const memberMatchers = options.plans.memberMatchers(target.planKey);
    return {
      root: target.root,
      manifestPath: target.manifestPath,
      platform: target.globalPlatform,
      desired: [],
      generatorVersion: options.generatorVersion,
      removeObsolete: true,
      restoreDeleted: false,
      ...(memberMatchers === undefined ? {} : { memberMatchers }),
    };
  };
  const activeTargets = targets.filter((target) => target.entries.length > 0);
  const reconciliations = activeTargets.map(reconciliationOf);
  let locks: GlobalLock[] = [];
  let emptiedTargets: UninstallTarget[] = [];
  try {
    if (reconciliations.length === 0) return resultFromTargets(platforms, targets, new Map(), false);
    await reconcileGlobalManagedRoots({
      reconciliations: reconciliations.map((reconciliation) => ({ ...reconciliation, dryRun: true })),
    });
    locks = (await acquireGlobalLocks(activeTargets, reconciliationOf, options.lockAcquirer)).map(({ lock }) => lock);
    const outcomes = await reconcileGlobalManagedRoots({ reconciliations });
    const outcomesByTarget = new Map(activeTargets.map((target, index) => [target, outcomes[index]!]));
    emptiedTargets = activeTargets.filter((target) => outcomesByTarget.get(target)?.manifest.entries.length === 0);
    return resultFromTargets(platforms, targets, outcomesByTarget, false);
  } finally {
    await releaseGlobalLocks(locks);
    await cleanupEmptyOwnedDirectories(emptiedTargets);
  }
}

async function loadTargets(
  platforms: readonly PlatformId[],
  roots: SelectedUserPlatformRoots,
): Promise<UninstallTarget[]> {
  return Promise.all(
    globalTargets(platforms, roots).map(async (target) => {
      const manifestPath = await resolveSafeGlobalPath(target.root, target.manifestPath);
      let entries: readonly GlobalManagedEntry[] = [];
      try {
        const manifest = await readGlobalManagedManifest(manifestPath);
        if (manifest.platform !== target.globalPlatform) {
          throw new GlobalManagedManifestError("The global managed manifest belongs to a different platform root.");
        }
        if (manifest.entries.some((entry) => entry.path === target.manifestPath)) {
          throw new GlobalManagedManifestError("A global managed manifest must not claim its own sidecar path.");
        }
        entries = manifest.entries;
      } catch (error: unknown) {
        if (!isMissingPathError(error)) throw error;
      }
      return { ...target, entries };
    }),
  );
}

/**
 * Sidecars and leaf `harnix-*` skill folders are ownership namespaces, not
 * platform namespaces. Remove them only after the manifest has reached zero
 * entries and only with non-recursive rmdir, so unrelated platform content is
 * never removed as part of global uninstall.
 */
async function cleanupEmptyOwnedDirectories(targets: readonly UninstallTarget[]): Promise<void> {
  for (const target of targets) {
    const ownsWholeRoot = target.preserveUnownedRoot;
    const directories = ownsWholeRoot
      ? ownedPluginDirectories(target.entries)
      : ownedSkillUnitDirectories(target.entries);
    for (const relativePath of directories) await removeEmptyOwnedDirectory(target.root, relativePath);

    const sidecarDirectory = parentRelativePath(target.manifestPath);
    if (sidecarDirectory !== undefined) await removeEmptyOwnedDirectory(target.root, sidecarDirectory);
    if (ownsWholeRoot) await removeEmptyOwnedRoot(target.root, target.manifestPath);
  }
}

function ownedSkillUnitDirectories(entries: readonly GlobalManagedEntry[]): string[] {
  const directories: string[] = [];
  for (const entry of entries) {
    if (entry.kind !== "file") continue;
    const segments = entry.path.split("/");
    if (segments[0] === "skills" && segments[1]?.startsWith("harnix-") && segments.length >= 3) {
      for (let length = 2; length < segments.length; length += 1) {
        directories.push(segments.slice(0, length).join("/"));
      }
    }
  }
  return uniqueDeepestFirst(directories);
}

function ownedPluginDirectories(entries: readonly GlobalManagedEntry[]): string[] {
  const directories: string[] = [];
  for (const entry of entries) {
    const segments = entry.path.split("/");
    for (let length = 1; length < segments.length; length += 1) {
      directories.push(segments.slice(0, length).join("/"));
    }
  }
  return uniqueDeepestFirst(directories);
}

function uniqueDeepestFirst(paths: readonly string[]): string[] {
  return [...new Set(paths)].sort((left, right) => {
    const depth = right.split("/").length - left.split("/").length;
    return depth === 0 ? compareCodeUnits(right, left) : depth;
  });
}

function parentRelativePath(path: string): string | undefined {
  const separator = path.lastIndexOf("/");
  return separator < 0 ? undefined : path.slice(0, separator);
}

async function removeEmptyOwnedDirectory(root: UserPathRoot, relativePath: string): Promise<void> {
  await removeEmptyDirectory(await resolveSafeGlobalPath(root, relativePath));
}

async function removeEmptyOwnedRoot(root: UserPathRoot, probePath: string): Promise<void> {
  // Recheck the root's containment immediately before touching it.
  await resolveSafeGlobalPath(root, probePath);
  await removeEmptyDirectory(root.path);
}

async function removeEmptyDirectory(path: string): Promise<void> {
  try {
    await rmdir(path);
  } catch (error: unknown) {
    if (isMissingPathError(error) || isNonEmptyOrNotDirectory(error)) return;
    throw error;
  }
}

function resultFromTargets(
  platforms: readonly PlatformId[],
  targets: readonly UninstallTarget[],
  outcomes: Outcomes,
  confirmationRequired: boolean,
): UninstallGlobalResult {
  return {
    scope: "user",
    platforms: platforms.map((platform) => {
      const platformTargets = targets.filter((target) => target.publicPlatform === platform);
      const listed = platformTargets
        .flatMap((target) => target.entries.map((entry) => displayEntry(target.root, entry)))
        .sort(compareCodeUnits);
      const labels = (field: "deleted" | "preserved") =>
        platformTargets.flatMap((target) =>
          (outcomes.get(target)?.[field] ?? []).map((label) => displayLabel(target.root, label)),
        );
      return {
        platform,
        targets: uniqueSorted(listed),
        removed: uniqueSorted(labels("deleted")),
        preserved: uniqueSorted(labels("preserved")),
        confirmationRequired,
      };
    }),
  };
}

function displayEntry(root: UserPathRoot, entry: GlobalManagedEntry): string {
  return `${root.display(entry.path)}${entry.kind === "file" ? "" : `#${entry.sourceId}`}`;
}

function displayLabel(root: UserPathRoot, label: string): string {
  const separator = label.indexOf("#");
  const path = separator < 0 ? label : label.slice(0, separator);
  const suffix = separator < 0 ? "" : label.slice(separator);
  return `${root.display(path)}${suffix}`;
}

function normalizePlatforms(platforms: readonly PlatformId[]): PlatformId[] {
  const normalized = [...new Set(platforms)].sort();
  if (normalized.length === 0) throw new Error("At least one platform must be selected for global uninstall.");
  if (!normalized.every((platform) => isPlatformId(platform))) {
    throw new Error("Only Kiro, Antigravity, Codex, and Claude Code are supported for global uninstall.");
  }
  return normalized;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort(compareCodeUnits);
}

function isMissingPathError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isNonEmptyOrNotDirectory(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "ENOTEMPTY" || error.code === "EEXIST" || error.code === "ENOTDIR")
  );
}
