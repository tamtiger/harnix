import { readdir } from "node:fs/promises";
import { basename } from "node:path";

import { globalManagedReconciliationOrderKey, resolveSafeGlobalPath } from "src/core/global/managed-files.js";
import type { GlobalManagedReconcileResult, ReconcileGlobalManagedFilesOptions } from "src/core/global/types.js";
import type { GlobalTarget } from "src/core/global/targets.js";
import { readHarnixFileLockSnapshot, type HarnixFileLockRecord } from "src/utils/file-lock.js";
import { compareCodeUnits } from "src/utils/order.js";

export interface GlobalLock {
  readonly path?: string;
  readonly recordPath?: string;
  readonly record?: HarnixFileLockRecord;
  release(): Promise<void>;
}

/** Injectable only for deterministic lifecycle tests. */
export type GlobalLockAcquirer = (path: string) => Promise<GlobalLock>;

export interface AcquiredGlobalLock<T extends GlobalTarget> {
  readonly target: T;
  readonly lock: GlobalLock;
}

/**
 * Locks every target in the stable order of its reconciliation key, so two processes can never wait
 * on each other. A failure releases everything already acquired.
 */
export async function acquireGlobalLocks<T extends GlobalTarget>(
  targets: readonly T[],
  reconciliationOf: (target: T) => ReconcileGlobalManagedFilesOptions,
  lockAcquirer: GlobalLockAcquirer,
): Promise<AcquiredGlobalLock<T>[]> {
  const ordered = [...targets].sort((left, right) =>
    compareCodeUnits(
      globalManagedReconciliationOrderKey(reconciliationOf(left)),
      globalManagedReconciliationOrderKey(reconciliationOf(right)),
    ),
  );
  const locks: AcquiredGlobalLock<T>[] = [];
  try {
    for (const target of ordered) {
      // Safe resolution rechecks the home anchor immediately before any lock
      // directory is created, preventing a symlink/junction escape.
      locks.push({ target, lock: await lockAcquirer(await resolveSafeGlobalPath(target.root, target.lockPath)) });
    }
    return locks;
  } catch (error) {
    await releaseGlobalLocks(locks.map(({ lock }) => lock));
    throw error;
  }
}

/** Releases in reverse acquisition order. */
export async function releaseGlobalLocks(locks: readonly GlobalLock[]): Promise<void> {
  await Promise.all([...locks].reverse().map(async (lock) => lock.release()));
}

/** Hands the owned lock record to a reconciliation so the root still counts as Harnix-only. */
export function withOwnedRootLock(
  target: GlobalTarget,
  reconciliation: ReconcileGlobalManagedFilesOptions,
  lock: GlobalLock,
): ReconcileGlobalManagedFilesOptions {
  if (!target.preserveUnownedRoot || lock.record === undefined || lock.recordPath === undefined) {
    return reconciliation;
  }
  return {
    ...reconciliation,
    ownedRootLockContent: `${JSON.stringify(lock.record)}\n`,
    ownedRootLockPath: target.lockPath,
    ownedRootLockRecordName: basename(lock.recordPath),
  };
}

function isUnownedRootCollision(target: GlobalTarget, outcome: GlobalManagedReconcileResult): boolean {
  return (
    target.preserveUnownedRoot &&
    outcome.manifest.entries.length === 0 &&
    outcome.created.length === 0 &&
    outcome.updated.length === 0 &&
    outcome.unchanged.length === 0 &&
    outcome.deleted.length === 0 &&
    outcome.warnings.length > 0 &&
    outcome.warnings.every((warning) => warning.code === "untracked-collision")
  );
}

/**
 * An Antigravity plugin root created by a crashed Harnix setup can contain
 * only a valid Harnix lock and no sidecar yet. That lock is evidence of an
 * interrupted owned operation, not a user plugin collision: acquire it so
 * the lock primitive can wait for a live owner or reclaim a dead one. All
 * other manifestless roots stay conservative untracked collisions.
 */
export async function targetsForLocking<T extends GlobalTarget>(
  targets: readonly T[],
  preflightOutcomes: readonly GlobalManagedReconcileResult[],
): Promise<T[]> {
  const selected: T[] = [];
  for (const [index, target] of targets.entries()) {
    const outcome = preflightOutcomes[index];
    if (outcome === undefined || !isUnownedRootCollision(target, outcome) || (await hasOnlyHarnixLock(target))) {
      selected.push(target);
    }
  }
  return selected;
}

async function hasOnlyHarnixLock(target: GlobalTarget): Promise<boolean> {
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
