import { acquireHarnixFileLock } from "../utils/file-lock.js";
import { rmdir } from "node:fs/promises";
import {
  GlobalManagedManifestError,
  globalManagedReconciliationOrderKey,
  readGlobalManagedManifest,
  reconcileGlobalManagedRoots,
  resolveSafeGlobalPath,
  type GlobalJsonMemberMatcher,
  type GlobalManagedEntry,
  type GlobalPlatform,
  type ReconcileGlobalManagedFilesOptions,
} from "../utils/global-managed-files.js";
import { matchesCodexGlobalContextHookGroup } from "../configurators/codex.js";
import { resolveSelectedUserPlatformRoots, type HomeResolver, type SelectedUserPlatformRoots, type UserPathRoot } from "../utils/user-paths.js";
import { packageVersion } from "../version.js";

export type GlobalUninstallPlatform = "kiro" | "antigravity" | "codex";

export interface GlobalUninstallLock {
  release(): Promise<void>;
}

export type GlobalUninstallLockAcquirer = (path: string) => Promise<GlobalUninstallLock>;

export interface GlobalUninstallOptions {
  readonly platforms: readonly GlobalUninstallPlatform[];
  readonly yes?: boolean | undefined;
  /** Test and lifecycle injection; production resolves roots from the active user profile. */
  readonly roots?: SelectedUserPlatformRoots | undefined;
  readonly homeResolver?: HomeResolver | undefined;
  readonly environment?: Readonly<Record<string, string | undefined>> | undefined;
  readonly lockAcquirer?: GlobalUninstallLockAcquirer | undefined;
}

export interface GlobalUninstallPlatformResult {
  platform: GlobalUninstallPlatform;
  targets: string[];
  removed: string[];
  preserved: string[];
  confirmationRequired: boolean;
}

export interface GlobalUninstallResult {
  scope: "user";
  platforms: GlobalUninstallPlatformResult[];
}

interface GlobalUninstallTarget {
  readonly publicPlatform: GlobalUninstallPlatform;
  readonly root: UserPathRoot;
  readonly manifestPath: string;
  readonly lockPath: string;
  readonly platform: GlobalPlatform;
  readonly entries: readonly GlobalManagedEntry[];
  readonly memberMatchers?: ReadonlyMap<string, GlobalJsonMemberMatcher>;
}

/**
 * Removes only explicitly selected, manifest-proven global integrations.
 * Filesystem mutations require `yes`; platform roots and untracked content are
 * never candidates for deletion.
 */
export async function uninstallGlobalIntegrations(options: GlobalUninstallOptions): Promise<GlobalUninstallResult> {
  const platforms = normalizePlatforms(options.platforms);
  if (isTestProcess() && options.roots === undefined && options.homeResolver === undefined) {
    throw new Error("Global uninstall requires an injected homeResolver in test mode.");
  }
  const roots = options.roots ?? await resolveSelectedUserPlatformRoots(platforms, {
    ...(options.environment === undefined ? {} : { environment: options.environment }),
    ...(options.homeResolver === undefined ? {} : { homeResolver: options.homeResolver }),
  });
  const targets = await loadTargets(platforms, roots);

  if (!options.yes) {
    return resultFromTargets(platforms, targets, new Map(), true);
  }

  const activeTargets = targets.filter((target) => target.entries.length > 0);
  const reconciliations = activeTargets.map(createReconciliation);
  let locks: GlobalUninstallLock[] = [];
  let emptiedTargets: GlobalUninstallTarget[] = [];
  try {
    if (reconciliations.length > 0) {
      await reconcileGlobalManagedRoots({
        reconciliations: reconciliations.map((reconciliation) => ({ ...reconciliation, dryRun: true })),
      });
      locks = await acquireLocks(activeTargets, options.lockAcquirer ?? acquireHarnixFileLock);
      const outcomes = await reconcileGlobalManagedRoots({ reconciliations });
      const outcomesByTarget = new Map(activeTargets.map((target, index) => [target, outcomes[index]! ]));
      emptiedTargets = activeTargets.filter((target) => outcomesByTarget.get(target)?.manifest.entries.length === 0);
      return resultFromTargets(platforms, targets, outcomesByTarget, false);
    }
    return resultFromTargets(platforms, targets, new Map(), false);
  } finally {
    await Promise.all(locks.reverse().map(async (lock) => lock.release()));
    await cleanupEmptyOwnedDirectories(emptiedTargets);
  }
}

/**
 * Sidecars and leaf `harnix-*` skill folders are ownership namespaces, not
 * platform namespaces. Remove them only after the manifest has reached zero
 * entries and only with non-recursive rmdir, so unrelated platform content is
 * never removed as part of global uninstall.
 */
async function cleanupEmptyOwnedDirectories(targets: readonly GlobalUninstallTarget[]): Promise<void> {
  for (const target of targets) {
    const directories = target.platform === "antigravity-desktop" || target.platform === "antigravity-cli"
      ? ownedPluginDirectories(target.entries)
      : ownedSkillUnitDirectories(target.entries);
    for (const relativePath of directories) {
      await removeEmptyOwnedDirectory(target.root, relativePath);
    }

    const sidecarDirectory = parentRelativePath(target.manifestPath);
    if (sidecarDirectory !== undefined) {
      await removeEmptyOwnedDirectory(target.root, sidecarDirectory);
    }
    if (target.platform === "antigravity-desktop" || target.platform === "antigravity-cli") {
      await removeEmptyOwnedRoot(target.root, target.manifestPath);
    }
  }
}

function ownedSkillUnitDirectories(entries: readonly GlobalManagedEntry[]): string[] {
  return uniqueDeepestFirst(entries.map(ownedSkillUnitDirectory).filter((path): path is string => path !== undefined));
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
    return depth === 0 ? right.localeCompare(left) : depth;
  });
}

function ownedSkillUnitDirectory(entry: GlobalManagedEntry): string | undefined {
  if (entry.kind !== "file") return undefined;
  const segments = entry.path.split("/");
  if (segments.length !== 3 || segments[0] !== "skills" || !segments[1]?.startsWith("harnix-") || segments[2] !== "SKILL.md") {
    return undefined;
  }
  return `${segments[0]}/${segments[1]}`;
}

function parentRelativePath(path: string): string | undefined {
  const separator = path.lastIndexOf("/");
  return separator < 0 ? undefined : path.slice(0, separator);
}

async function removeEmptyOwnedDirectory(root: UserPathRoot, relativePath: string): Promise<void> {
  const absolutePath = await resolveSafeGlobalPath(root, relativePath);
  await removeEmptyDirectory(absolutePath);
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

async function loadTargets(platforms: readonly GlobalUninstallPlatform[], roots: SelectedUserPlatformRoots): Promise<GlobalUninstallTarget[]> {
  const descriptors = createTargetDescriptors(platforms, roots);
  return Promise.all(descriptors.map(async (descriptor) => {
    const manifestPath = await resolveSafeGlobalPath(descriptor.root, descriptor.manifestPath);
    let entries: readonly GlobalManagedEntry[] = [];
    try {
      const manifest = await readGlobalManagedManifest(manifestPath);
      if (manifest.platform !== descriptor.platform) {
        throw new GlobalManagedManifestError("The global managed manifest belongs to a different platform root.");
      }
      if (manifest.entries.some((entry) => entry.path === descriptor.manifestPath)) {
        throw new GlobalManagedManifestError("A global managed manifest must not claim its own sidecar path.");
      }
      entries = manifest.entries;
    } catch (error: unknown) {
      if (!isMissingPathError(error)) {
        throw error;
      }
    }
    return { ...descriptor, entries };
  }));
}

function createTargetDescriptors(platforms: readonly GlobalUninstallPlatform[], roots: SelectedUserPlatformRoots): Omit<GlobalUninstallTarget, "entries">[] {
  const targets: Omit<GlobalUninstallTarget, "entries">[] = [];
  if (platforms.includes("kiro")) {
    targets.push({ publicPlatform: "kiro", root: requireSelectedRoot(roots.kiro, "Kiro"), manifestPath: "harnix/managed.json", lockPath: "harnix/managed.lock", platform: "kiro" });
  }
  if (platforms.includes("antigravity")) {
    targets.push(
      { publicPlatform: "antigravity", root: requireSelectedRoot(roots.antigravityDesktop, "Antigravity Desktop"), manifestPath: ".managed.json", lockPath: ".managed.lock", platform: "antigravity-desktop" },
      { publicPlatform: "antigravity", root: requireSelectedRoot(roots.antigravityCli, "Antigravity CLI"), manifestPath: ".managed.json", lockPath: ".managed.lock", platform: "antigravity-cli" },
    );
  }
  if (platforms.includes("codex")) {
    const codex = requireSelectedRoot(roots.codex, "Codex");
    targets.push(
      {
        publicPlatform: "codex",
        root: codex.config,
        manifestPath: "harnix/managed.json",
        lockPath: "harnix/managed.lock",
        platform: "codex",
        memberMatchers: new Map([["codex-global-context-hook", matchesCodexGlobalContextHookGroup]]),
      },
      { publicPlatform: "codex", root: codex.skills, manifestPath: "harnix/managed.json", lockPath: "harnix/managed.lock", platform: "codex" },
    );
  }
  return targets;
}

function requireSelectedRoot<T>(root: T | undefined, label: string): T {
  if (root === undefined) {
    throw new Error(`The selected ${label} user-global root was not resolved.`);
  }
  return root;
}

function createReconciliation(target: GlobalUninstallTarget): ReconcileGlobalManagedFilesOptions {
  return {
    root: target.root,
    manifestPath: target.manifestPath,
    platform: target.platform,
    desired: [],
    generatorVersion: packageVersion,
    removeObsolete: true,
    restoreDeleted: false,
    ...(target.memberMatchers === undefined ? {} : { memberMatchers: target.memberMatchers }),
  };
}

async function acquireLocks(targets: readonly GlobalUninstallTarget[], lockAcquirer: GlobalUninstallLockAcquirer): Promise<GlobalUninstallLock[]> {
  const ordered = [...targets].sort((left, right) => globalManagedReconciliationOrderKey(createReconciliation(left)).localeCompare(globalManagedReconciliationOrderKey(createReconciliation(right))));
  const locks: GlobalUninstallLock[] = [];
  try {
    for (const target of ordered) {
      locks.push(await lockAcquirer(await resolveSafeGlobalPath(target.root, target.lockPath)));
    }
    return locks;
  } catch (error) {
    await Promise.all(locks.reverse().map(async (lock) => lock.release()));
    throw error;
  }
}

function resultFromTargets(
  platforms: readonly GlobalUninstallPlatform[],
  targets: readonly GlobalUninstallTarget[],
  outcomes: ReadonlyMap<GlobalUninstallTarget, Awaited<ReturnType<typeof reconcileGlobalManagedRoots>>[number]>,
  confirmationRequired: boolean,
): GlobalUninstallResult {
  return {
    scope: "user",
    platforms: platforms.map((platform) => {
      const platformTargets = targets.filter((target) => target.publicPlatform === platform);
      const targetsForPlatform = platformTargets.flatMap((target) => target.entries.map((entry) => displayEntry(target.root, entry))).sort((left, right) => left.localeCompare(right));
      const removed = platformTargets.flatMap((target) => (outcomes.get(target)?.deleted ?? []).map((label) => displayLabel(target.root, label)));
      const preserved = platformTargets.flatMap((target) => (outcomes.get(target)?.preserved ?? []).map((label) => displayLabel(target.root, label)));
      return {
        platform,
        targets: uniqueSorted(targetsForPlatform),
        removed: uniqueSorted(removed),
        preserved: uniqueSorted(preserved),
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

function normalizePlatforms(platforms: readonly GlobalUninstallPlatform[]): GlobalUninstallPlatform[] {
  const normalized = [...new Set(platforms)].sort();
  if (normalized.length === 0) {
    throw new Error("At least one platform must be selected for global uninstall.");
  }
  if (normalized.some((platform) => platform !== "kiro" && platform !== "antigravity" && platform !== "codex")) {
    throw new Error("Only Kiro, Antigravity, and Codex are supported for global uninstall.");
  }
  return normalized;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function isMissingPathError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isNonEmptyOrNotDirectory(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error.code === "ENOTEMPTY" || error.code === "EEXIST" || error.code === "ENOTDIR");
}

function isTestProcess(): boolean {
  return process.env.VITEST !== undefined || process.env.NODE_ENV === "test";
}
