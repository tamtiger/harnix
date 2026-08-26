import type { PlatformId } from "../core/config/config.js";
import { readdir } from "node:fs/promises";
import { basename } from "node:path";
import { antigravityGlobalPluginDesiredFiles } from "../configurators/antigravity.js";
import { createCodexGlobalSurfacePlan, matchesCodexGlobalContextHookGroup } from "../configurators/codex.js";
import { kiroGlobalDesiredFiles } from "../configurators/kiro.js";
import { acquireHarnixFileLock, readHarnixFileLockSnapshot, type HarnixFileLockRecord } from "../utils/file-lock.js";
import { compareCodeUnits } from "../utils/order.js";
import {
  globalManagedReconciliationOrderKey,
  reconcileGlobalManagedRoots,
  resolveSafeGlobalPath,
  type GlobalJsonMemberMatcher,
  type GlobalManagedReconcileResult,
  type GlobalPlatform,
  type ReconcileGlobalManagedFilesOptions,
} from "../utils/global-managed-files.js";
import { resolveSelectedUserPlatformRoots, type HomeResolver, type SelectedUserPlatformRoots, type UserPathRoot } from "../utils/user-paths.js";
import { lookupHarnixLauncher } from "../utils/harnix-launcher.js";
import { packageVersion } from "../version.js";

export type GlobalSetupPlatform = PlatformId;
export type GlobalIntegrationReadiness = "installed" | "installed-pending-trust" | "binary-unavailable" | "shadowed" | "precedence-unknown" | "unsupported-version" | "drifted";
export type HookCommandLookup = (command: string) => Promise<boolean>;
export interface GlobalSetupLock {
  readonly path?: string;
  readonly recordPath?: string;
  readonly record?: HarnixFileLockRecord;
  release(): Promise<void>;
}
/** Injectable only for deterministic lifecycle tests. */
export type GlobalSetupLockAcquirer = (path: string) => Promise<GlobalSetupLock>;
/** @deprecated Kept only for source compatibility while project-local setup callers migrate. */
export type VersionLookup = (executable: string, args: string[]) => Promise<string | undefined>;

export interface SetupPlatformsOptions {
  readonly platforms: readonly GlobalSetupPlatform[];
  readonly dryRun?: boolean | undefined;
  readonly homeResolver?: HomeResolver | undefined;
  readonly environment?: Readonly<Record<string, string | undefined>> | undefined;
  readonly commandLookup?: HookCommandLookup | undefined;
  /** Internal lifecycle option used by `update --global` to prune unchanged retired fragments. */
  readonly removeObsolete?: boolean | undefined;
  /** Defaults to true for setup; global update opts out unless `--restore` is explicit. */
  readonly restoreDeleted?: boolean | undefined;
  /** Test-only lock injection; production uses Harnix's cross-process lock. */
  readonly lockAcquirer?: GlobalSetupLockAcquirer | undefined;
  /** @deprecated Ignored. Global setup never resolves or reads a project root. */
  readonly root?: string | undefined;
  /** @deprecated Ignored. Platform capability discovery is reported by Doctor. */
  readonly versionLookup?: VersionLookup | undefined;
}

export interface GlobalSetupPlatformResult {
  platform: GlobalSetupPlatform;
  readiness: GlobalIntegrationReadiness;
  created: string[];
  updated: string[];
  unchanged: string[];
  preserved: string[];
  warnings: string[];
}

export interface SetupPlatformsResult {
  scope: "user";
  platforms: GlobalSetupPlatformResult[];
}

interface ReconciliationTarget {
  readonly platform: GlobalSetupPlatform;
  readonly root: UserPathRoot;
  readonly manifestPath: string;
  readonly lockPath: string;
  readonly preserveUnownedRoot: boolean;
  readonly reconciliation: ReconcileGlobalManagedFilesOptions;
}

interface AcquiredSetupLock {
  readonly target: ReconciliationTarget;
  readonly lock: GlobalSetupLock;
}

/**
 * Installs only explicit user-global integrations. It deliberately accepts no
 * project lifecycle dependency: an uninitialized directory is a valid caller.
 */
export async function setupPlatforms(options: SetupPlatformsOptions): Promise<SetupPlatformsResult> {
  const platforms = [...new Set(options.platforms)].sort();
  if (platforms.length === 0) throw new Error("At least one platform must be selected.");
  if (isTestProcess() && options.homeResolver === undefined) {
    throw new Error("Global setup requires an injected homeResolver in test mode.");
  }
  if (isTestProcess() && options.commandLookup === undefined) {
    throw new Error("Global setup requires an injected commandLookup in test mode.");
  }
  const roots = await resolveSelectedUserPlatformRoots(platforms, {
    ...(options.environment === undefined ? {} : { environment: options.environment }),
    ...(options.homeResolver === undefined ? {} : { homeResolver: options.homeResolver }),
  });
  const targets = createTargets(platforms, roots, options.dryRun === true, options.removeObsolete === true, options.restoreDeleted);
  const launcherAvailable = await (options.commandLookup ?? defaultCommandLookup)("harnix");

  const reconciliations = targets.map((target) => target.reconciliation);
  let locks: GlobalSetupLock[] = [];
  try {
    // Validate every target before lock acquisition can create even an owned
    // lock directory. The real reconciliation below repeats the preflight
    // under locks to close the editor/process race before applying writes.
    if (!options.dryRun) {
      const preflightOutcomes = await reconcileGlobalManagedRoots({
        reconciliations: reconciliations.map((reconciliation) => ({ ...reconciliation, dryRun: true })),
      });
      const lockedTargets = await targetsForLocking(targets, preflightOutcomes);
      const acquiredLocks = await acquireLocks(lockedTargets, options.lockAcquirer ?? acquireHarnixFileLock);
      locks = acquiredLocks.map(({ lock }) => lock);
      const locksByTarget = new Map(acquiredLocks.map(({ target, lock }) => [target, lock]));
      const lockedOutcomes = await reconcileGlobalManagedRoots({
        reconciliations: lockedTargets.map((target) => reconciliationWithOwnedRootLock(target, locksByTarget.get(target)!)),
      });
      const lockedTargetSet = new Set(lockedTargets);
      let lockedIndex = 0;
      const outcomes = targets.map((target, index) => {
        if (!lockedTargetSet.has(target)) {
          return preflightOutcomes[index]!;
        }
        return lockedOutcomes[lockedIndex++]!;
      });
      return {
        scope: "user",
        platforms: platforms.map((platform) => platformResult(platform, targets, outcomes, launcherAvailable)),
      };
    }
    const outcomes = await reconcileGlobalManagedRoots({ reconciliations });
    return {
      scope: "user",
      platforms: platforms.map((platform) => platformResult(platform, targets, outcomes, launcherAvailable)),
    };
  } finally {
    await Promise.all(locks.reverse().map(async (lock) => lock.release()));
  }
}

function createTargets(
  platforms: readonly GlobalSetupPlatform[],
  roots: SelectedUserPlatformRoots,
  dryRun: boolean,
  removeObsolete: boolean,
  restoreDeleted: boolean | undefined,
): ReconciliationTarget[] {
  const targets: ReconciliationTarget[] = [];
  if (platforms.includes("kiro")) {
    targets.push(createTarget("kiro", requireSelectedRoot(roots.kiro, "kiro"), "harnix/managed.json", "harnix/managed.lock", "kiro", kiroGlobalDesiredFiles(), dryRun, removeObsolete, restoreDeleted));
  }
  if (platforms.includes("antigravity")) {
    const desired = antigravityGlobalPluginDesiredFiles();
    targets.push(
      createTarget("antigravity", requireSelectedRoot(roots.antigravityDesktop, "Antigravity Desktop"), ".managed.json", ".managed.lock", "antigravity-desktop", desired, dryRun, removeObsolete, restoreDeleted, undefined, true),
      createTarget("antigravity", requireSelectedRoot(roots.antigravityCli, "Antigravity CLI"), ".managed.json", ".managed.lock", "antigravity-cli", desired, dryRun, removeObsolete, restoreDeleted, undefined, true),
    );
  }
  if (platforms.includes("codex")) {
    const plan = createCodexGlobalSurfacePlan();
    const codex = requireSelectedRoot(roots.codex, "Codex");
    targets.push(
      createTarget("codex", codex.config, "harnix/managed.json", "harnix/managed.lock", "codex", plan.config, dryRun, removeObsolete, restoreDeleted, new Map([["codex-global-context-hook", matchesCodexGlobalContextHookGroup]])),
      createTarget("codex", codex.skills, "harnix/managed.json", "harnix/managed.lock", "codex", plan.skills, dryRun, removeObsolete, restoreDeleted),
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

function createTarget(
  platform: GlobalSetupPlatform,
  root: UserPathRoot,
  manifestPath: string,
  lockPath: string,
  globalPlatform: GlobalPlatform,
  desired: ReconcileGlobalManagedFilesOptions["desired"],
  dryRun: boolean,
  removeObsolete: boolean,
  restoreDeleted: boolean | undefined,
  memberMatchers?: ReadonlyMap<string, GlobalJsonMemberMatcher>,
  preserveUnownedRoot = false,
): ReconciliationTarget {
  const reconciliation: ReconcileGlobalManagedFilesOptions = {
    desired,
    dryRun,
    generatorVersion: packageVersion,
    manifestPath,
    platform: globalPlatform,
    preserveUnownedRoot,
    preserveUnownedSkillDirectories: true,
    removeObsolete,
    ...(restoreDeleted === undefined ? {} : { restoreDeleted }),
    root,
    ...(memberMatchers === undefined ? {} : { memberMatchers }),
  };
  return { lockPath, manifestPath, platform, preserveUnownedRoot, reconciliation, root };
}

function reconciliationWithOwnedRootLock(target: ReconciliationTarget, lock: GlobalSetupLock): ReconcileGlobalManagedFilesOptions {
  if (!target.preserveUnownedRoot || lock.record === undefined || lock.recordPath === undefined) {
    return target.reconciliation;
  }
  return {
    ...target.reconciliation,
    ownedRootLockContent: `${JSON.stringify(lock.record)}\n`,
    ownedRootLockPath: target.lockPath,
    ownedRootLockRecordName: basename(lock.recordPath),
  };
}

function isUnownedRootCollision(target: ReconciliationTarget, outcome: GlobalManagedReconcileResult): boolean {
  return target.preserveUnownedRoot
    && outcome.manifest.entries.length === 0
    && outcome.created.length === 0
    && outcome.updated.length === 0
    && outcome.unchanged.length === 0
    && outcome.deleted.length === 0
    && outcome.warnings.length > 0
    && outcome.warnings.every((warning) => warning.code === "untracked-collision");
}

/**
 * An Antigravity plugin root created by a crashed Harnix setup can contain
 * only a valid Harnix lock and no sidecar yet. That lock is evidence of an
 * interrupted owned operation, not a user plugin collision: acquire it so
 * the lock primitive can wait for a live owner or reclaim a dead one. All
 * other manifestless roots stay conservative untracked collisions.
 */
async function targetsForLocking(
  targets: readonly ReconciliationTarget[],
  preflightOutcomes: readonly GlobalManagedReconcileResult[],
): Promise<ReconciliationTarget[]> {
  const selected: ReconciliationTarget[] = [];
  for (const [index, target] of targets.entries()) {
    const outcome = preflightOutcomes[index];
    if (outcome === undefined || !isUnownedRootCollision(target, outcome) || await hasOnlyHarnixLock(target)) {
      selected.push(target);
    }
  }
  return selected;
}

async function hasOnlyHarnixLock(target: ReconciliationTarget): Promise<boolean> {
  if (!target.preserveUnownedRoot || target.lockPath.includes("/")) return false;
  try {
    const lockPath = await resolveSafeGlobalPath(target.root, target.lockPath);
    const entries = await readdir(target.root.path);
    if (entries.length !== 1 || entries[0] !== target.lockPath) return false;
    await readHarnixFileLockSnapshot(lockPath);
    return true;
  } catch {
    return false;
  }
}

async function acquireLocks(targets: readonly ReconciliationTarget[], lockAcquirer: GlobalSetupLockAcquirer): Promise<AcquiredSetupLock[]> {
  const ordered = [...targets].sort((left, right) => compareCodeUnits(globalManagedReconciliationOrderKey(left.reconciliation), globalManagedReconciliationOrderKey(right.reconciliation)));
  const locks: AcquiredSetupLock[] = [];
  try {
    for (const target of ordered) {
      // Safe resolution rechecks the home anchor immediately before any lock
      // directory is created, preventing a symlink/junction escape.
      locks.push({ target, lock: await lockAcquirer(await resolveSafeGlobalPath(target.root, target.lockPath)) });
    }
    return locks;
  } catch (error) {
    await Promise.all(locks.reverse().map(async ({ lock }) => lock.release()));
    throw error;
  }
}

function platformResult(
  platform: GlobalSetupPlatform,
  targets: readonly ReconciliationTarget[],
  outcomes: readonly GlobalManagedReconcileResult[],
  launcherAvailable: boolean,
): GlobalSetupPlatformResult {
  const targetOutcomes = targets.map((target, index) => ({ target, outcome: outcomes[index]! })).filter(({ target }) => target.platform === platform);
  const aggregate = (field: "created" | "updated" | "unchanged" | "preserved") => targetOutcomes.flatMap(({ target, outcome }) => outcome[field].map((label) => displayResultLabel(target.root, label))).sort();
  const warnings = targetOutcomes.flatMap(({ target, outcome }) => outcome.warnings.map((warning) => `${displayResultLabel(target.root, warning.path)}: ${warning.message}`));
  const hasDrift = targetOutcomes.some(({ outcome }) => outcome.preserved.length > 0 || outcome.warnings.length > 0);
  if (!launcherAvailable) {
    warnings.push("The fixed 'harnix' hook command was not found on PATH. Install or expose the Harnix launcher, then rerun setup or Doctor.");
  }
  if (platform === "codex" && launcherAvailable) {
    warnings.push("Review and trust the exact Harnix hook from Codex /hooks before it can run.");
  }
  if (platform === "antigravity" && launcherAvailable) {
    warnings.push("Antigravity plugin-versus-workspace hook precedence is not verified; inspect the active tool session before relying on injection.");
  }
  return {
    platform,
    readiness: hasDrift ? "drifted" : !launcherAvailable ? "binary-unavailable" : platform === "codex" ? "installed-pending-trust" : platform === "antigravity" ? "precedence-unknown" : "installed",
    created: aggregate("created"),
    updated: aggregate("updated"),
    unchanged: aggregate("unchanged"),
    preserved: aggregate("preserved"),
    warnings: warnings.sort(),
  };
}

function displayResultLabel(root: UserPathRoot, label: string): string {
  const separator = label.indexOf("#");
  const path = separator < 0 ? label : label.slice(0, separator);
  const suffix = separator < 0 ? "" : label.slice(separator);
  return `${root.display(path)}${suffix}`;
}

async function defaultCommandLookup(command: string): Promise<boolean> {
  return command === "harnix" && lookupHarnixLauncher();
}

function isTestProcess(): boolean {
  return process.env.VITEST !== undefined || process.env.NODE_ENV === "test";
}
