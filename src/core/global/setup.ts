import {
  acquireGlobalLocks,
  releaseGlobalLocks,
  targetsForLocking,
  withOwnedRootLock,
  type GlobalLock,
  type GlobalLockAcquirer,
} from "src/core/global/locking.js";
import { reconcileGlobalManagedRoots } from "src/core/global/managed-files.js";
import { globalTargets, type GlobalPlanProvider, type GlobalTarget } from "src/core/global/targets.js";
import type { GlobalManagedReconcileResult, ReconcileGlobalManagedFilesOptions } from "src/core/global/types.js";
import { getPlatform, type HealthyReadiness, type PlatformId } from "src/core/platform/registry.js";
import {
  resolveSelectedUserPlatformRoots,
  type HomeResolver,
  type UserPathRoot,
} from "src/core/platform/user-paths.js";

export type GlobalIntegrationReadiness =
  HealthyReadiness | "binary-unavailable" | "shadowed" | "unsupported-version" | "drifted";
export type HookCommandLookup = (command: string) => Promise<boolean>;

export interface SetupGlobalOptions {
  readonly platforms: readonly PlatformId[];
  readonly plans: GlobalPlanProvider;
  readonly generatorVersion: string;
  /** Looks up the fixed `harnix` hook launcher. */
  readonly commandLookup: HookCommandLookup;
  readonly lockAcquirer: GlobalLockAcquirer;
  readonly dryRun?: boolean | undefined;
  readonly homeResolver?: HomeResolver | undefined;
  readonly environment?: Readonly<Record<string, string | undefined>> | undefined;
  /** Internal lifecycle option used by `update --global` to prune unchanged retired fragments. */
  readonly removeObsolete?: boolean | undefined;
  /** Defaults to true for setup; global update opts out unless `--restore` is explicit. */
  readonly restoreDeleted?: boolean | undefined;
}

export interface GlobalSetupPlatformResult {
  platform: PlatformId;
  readiness: GlobalIntegrationReadiness;
  created: string[];
  updated: string[];
  unchanged: string[];
  preserved: string[];
  warnings: string[];
}

export interface SetupGlobalResult {
  scope: "user";
  platforms: GlobalSetupPlatformResult[];
}

interface ReconciliationTarget extends GlobalTarget {
  readonly reconciliation: ReconcileGlobalManagedFilesOptions;
}

const LAUNCHER_WARNING =
  "The fixed 'harnix' hook command was not found on PATH. Install or expose the Harnix launcher, then rerun setup or Doctor.";

/**
 * Installs only explicit user-global integrations. It deliberately accepts no
 * project lifecycle dependency: an uninitialized directory is a valid caller.
 */
export async function setupGlobal(options: SetupGlobalOptions): Promise<SetupGlobalResult> {
  const platforms = [...new Set(options.platforms)].sort();
  if (platforms.length === 0) throw new Error("At least one platform must be selected.");
  const roots = await resolveSelectedUserPlatformRoots(platforms, {
    ...(options.environment === undefined ? {} : { environment: options.environment }),
    ...(options.homeResolver === undefined ? {} : { homeResolver: options.homeResolver }),
  });
  const targets = globalTargets(platforms, roots).map((target) => reconciliationTarget(target, options));
  const launcherAvailable = await options.commandLookup("harnix");
  const finish = (outcomes: readonly GlobalManagedReconcileResult[]): SetupGlobalResult => ({
    scope: "user",
    platforms: platforms.map((platform) => platformResult(platform, targets, outcomes, launcherAvailable)),
  });

  const reconciliations = targets.map((target) => target.reconciliation);
  if (options.dryRun === true) return finish(await reconcileGlobalManagedRoots({ reconciliations }));

  let locks: GlobalLock[] = [];
  try {
    // Validate every target before lock acquisition can create even an owned
    // lock directory. The real reconciliation below repeats the preflight
    // under locks to close the editor/process race before applying writes.
    const preflightOutcomes = await reconcileGlobalManagedRoots({
      reconciliations: reconciliations.map((reconciliation) => ({ ...reconciliation, dryRun: true })),
    });
    const lockedTargets = await targetsForLocking(targets, preflightOutcomes);
    const acquired = await acquireGlobalLocks(lockedTargets, (target) => target.reconciliation, options.lockAcquirer);
    locks = acquired.map(({ lock }) => lock);
    const lockByTarget = new Map(acquired.map(({ target, lock }) => [target, lock]));
    const lockedOutcomes = await reconcileGlobalManagedRoots({
      reconciliations: lockedTargets.map((target) =>
        withOwnedRootLock(target, target.reconciliation, lockByTarget.get(target)!),
      ),
    });
    const lockedOutcomeByTarget = new Map(lockedTargets.map((target, index) => [target, lockedOutcomes[index]!]));
    return finish(targets.map((target, index) => lockedOutcomeByTarget.get(target) ?? preflightOutcomes[index]!));
  } finally {
    await releaseGlobalLocks(locks);
  }
}

function reconciliationTarget(target: GlobalTarget, options: SetupGlobalOptions): ReconciliationTarget {
  const memberMatchers = options.plans.memberMatchers(target.planKey);
  return {
    ...target,
    reconciliation: {
      desired: options.plans.desired(target.planKey),
      dryRun: options.dryRun === true,
      generatorVersion: options.generatorVersion,
      manifestPath: target.manifestPath,
      platform: target.globalPlatform,
      preserveUnownedRoot: target.preserveUnownedRoot,
      preserveUnownedSkillDirectories: true,
      removeObsolete: options.removeObsolete === true,
      ...(options.restoreDeleted === undefined ? {} : { restoreDeleted: options.restoreDeleted }),
      root: target.root,
      ...(memberMatchers === undefined ? {} : { memberMatchers }),
    },
  };
}

function platformResult(
  platform: PlatformId,
  targets: readonly ReconciliationTarget[],
  outcomes: readonly GlobalManagedReconcileResult[],
  launcherAvailable: boolean,
): GlobalSetupPlatformResult {
  const targetOutcomes = targets
    .map((target, index) => ({ target, outcome: outcomes[index]! }))
    .filter(({ target }) => target.publicPlatform === platform);
  const aggregate = (field: "created" | "updated" | "unchanged" | "preserved") =>
    targetOutcomes
      .flatMap(({ target, outcome }) => outcome[field].map((label) => displayResultLabel(target.root, label)))
      .sort();
  const warnings = targetOutcomes.flatMap(({ target, outcome }) =>
    outcome.warnings.map((warning) => `${displayResultLabel(target.root, warning.path)}: ${warning.message}`),
  );
  const hasDrift = targetOutcomes.some(({ outcome }) => outcome.preserved.length > 0 || outcome.warnings.length > 0);
  const record = getPlatform(platform);
  if (!launcherAvailable) warnings.push(LAUNCHER_WARNING);
  else if (record.setupNotice !== null) warnings.push(record.setupNotice);
  return {
    platform,
    readiness: hasDrift ? "drifted" : !launcherAvailable ? "binary-unavailable" : record.healthyReadiness,
    created: aggregate("created"),
    updated: aggregate("updated"),
    unchanged: aggregate("unchanged"),
    preserved: aggregate("preserved"),
    warnings: warnings.sort(),
  };
}

/** Renders a reconciliation label with the home-free display form of its root. */
export function displayResultLabel(root: UserPathRoot, label: string): string {
  const separator = label.indexOf("#");
  const path = separator < 0 ? label : label.slice(0, separator);
  const suffix = separator < 0 ? "" : label.slice(separator);
  return `${root.display(path)}${suffix}`;
}
