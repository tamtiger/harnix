import { atomicWriteFile } from "src/utils/atomic-write.js";
import { GlobalManagedManifestError } from "src/core/global/managed-error.js";
import { compareCodeUnits } from "src/utils/order.js";
import { defaultJsonMemberMatcher } from "src/core/global/managed-json.js";
import { prepareDesired } from "src/core/global/desired.js";
import {
  getTargetState,
  loadTargetStates,
  markUnownedSkillUnitCollisions,
  pathExists,
  rootContainsOnlyOwnedLock,
} from "src/core/global/discovery.js";
import {
  compareEntries,
  entryKey,
  entryLabel,
  isNonEmptyText,
  loadManifestOrEmpty,
  normalizeGlobalPath,
  resolveSafeGlobalPath,
  serializeManifest,
  validateGlobalManagedManifest,
} from "src/core/global/manifest.js";
import { removeObsoleteEntry } from "src/core/global/obsolete.js";
import { emptyResult, preserve, reconcileDesired } from "src/core/global/reconcile.js";
import { applyPlans, applyTransaction, buildPlans, removeManagedFile } from "src/core/global/transaction.js";
import {
  type GlobalManagedEntry,
  type GlobalManagedReconcileResult,
  type LoadedGlobalManifest,
  type PlannedGlobalReconciliation,
  type PreparedDesired,
  type ReconcileGlobalManagedFilesOptions,
  type ReconcileGlobalManagedRootsOptions,
  type TargetState,
} from "src/core/global/types.js";

export type {
  DesiredGlobalFile,
  DesiredGlobalJsonMember,
  DesiredGlobalManagedBlock,
  DesiredGlobalManagedFile,
  GlobalJsonMemberMatcher,
  GlobalManagedEntry,
  GlobalManagedKind,
  GlobalManagedManifestV1,
  GlobalManagedReconcileResult,
  GlobalManagedRemover,
  GlobalManagedSelector,
  GlobalManagedWarning,
  GlobalManagedWriter,
  GlobalPlatform,
  JsonArrayMemberSelector,
  JsonValue,
  MarkerSelector,
  ReconcileGlobalManagedFilesOptions,
  ReconcileGlobalManagedRootsOptions,
} from "src/core/global/types.js";

export { GlobalManagedManifestError, GlobalManagedTransactionError } from "src/core/global/types.js";

export {
  readGlobalManagedManifest,
  resolveSafeGlobalPath,
  validateGlobalManagedManifest,
  writeGlobalManagedManifest,
} from "src/core/global/manifest.js";

/**
 * Reconciles a single platform root in memory first, then atomically applies
 * target writes followed by its sidecar manifest. A failed apply restores only
 * paths whose bytes are still exactly the Harnix output written by this call.
 */
export async function reconcileGlobalManagedFiles(
  options: ReconcileGlobalManagedFilesOptions,
): Promise<GlobalManagedReconcileResult> {
  const prepared = await preflightGlobalManagedFiles(options);
  if (!options.dryRun && prepared.plans.length > 0) {
    await applyPlans(prepared.plans, options.writer ?? atomicWriteFile, options.remover ?? removeManagedFile);
  }
  return prepared.result;
}

/**
 * Preflights every root before writing any of them, then applies in stable
 * logical-root order. It is intentionally lock-agnostic so G7 can acquire the
 * platform locks in the same order before entering this transaction.
 */
export async function reconcileGlobalManagedRoots(
  options: ReconcileGlobalManagedRootsOptions,
): Promise<GlobalManagedReconcileResult[]> {
  const ordered = options.reconciliations
    .map((reconciliation, index) => ({ reconciliation, index }))
    .sort((left, right) =>
      compareCodeUnits(
        globalManagedReconciliationOrderKey(left.reconciliation),
        globalManagedReconciliationOrderKey(right.reconciliation),
      ),
    );
  assertUniqueReconciliationRoots(ordered.map(({ reconciliation }) => reconciliation));
  const prepared: Array<PlannedGlobalReconciliation & { index: number }> = [];
  for (const item of ordered) {
    prepared.push({ ...(await preflightGlobalManagedFiles(item.reconciliation)), index: item.index });
  }
  const transactionPlans = prepared.flatMap(({ options: reconciliation, plans }) =>
    reconciliation.dryRun
      ? []
      : plans.map((plan) => ({
          plan: { ...plan, label: reconciliation.root.display(plan.label) },
          writer: reconciliation.writer ?? atomicWriteFile,
          remover: reconciliation.remover ?? removeManagedFile,
        })),
  );
  if (transactionPlans.length > 0) {
    await applyTransaction(transactionPlans);
  }
  return prepared.sort((left, right) => left.index - right.index).map(({ result }) => result);
}

async function preflightGlobalManagedFiles(
  options: ReconcileGlobalManagedFilesOptions,
): Promise<PlannedGlobalReconciliation> {
  if (!isNonEmptyText(options.generatorVersion)) {
    throw new GlobalManagedManifestError("A global managed generatorVersion is required.");
  }

  const manifestRelativePath = normalizeGlobalPath(options.manifestPath);
  const manifestPath = await resolveSafeGlobalPath(options.root, manifestRelativePath);
  const prepared = prepareDesired(options.desired, options.platform, options.generatorVersion);
  if (prepared.some((item) => item.entry.path === manifestRelativePath)) {
    throw new GlobalManagedManifestError("A global managed entry must not overwrite its sidecar manifest.");
  }
  const loadedManifest = await loadManifestOrEmpty(manifestPath, options.platform);
  if (loadedManifest.manifest.entries.some((entry) => entry.path === manifestRelativePath)) {
    throw new GlobalManagedManifestError("A global managed manifest must not claim its own sidecar path.");
  }
  const unownedRootResult = await preserveUnownedRoot(options, prepared, loadedManifest);
  if (unownedRootResult !== undefined) return { options, result: unownedRootResult, plans: [] };
  const targetRelativePaths = [
    ...new Set([
      ...prepared.map((item) => item.entry.path),
      ...loadedManifest.manifest.entries.map((entry) => entry.path),
    ]),
  ];
  const targetPaths = await Promise.all(
    targetRelativePaths.map(async (path) => [path, await resolveSafeGlobalPath(options.root, path)] as const),
  );
  const absoluteByRelativePath = new Map(targetPaths);
  const previousByKey = new Map(loadedManifest.manifest.entries.map((entry) => [entryKey(entry), entry]));
  const targetStates = await loadTargetStates(targetRelativePaths, absoluteByRelativePath);
  if (options.preserveUnownedSkillDirectories) {
    await markUnownedSkillUnitCollisions(targetStates, prepared, previousByKey, options.root);
  }
  const result = emptyResult(loadedManifest.manifest);
  const nextEntries: GlobalManagedEntry[] = [];
  const seenPrevious = new Set<string>();
  const restoreDeleted = options.restoreDeleted ?? true;

  for (const item of prepared) {
    const previous = previousByKey.get(entryKey(item.entry));
    if (previous !== undefined) {
      seenPrevious.add(entryKey(previous));
    }
    const target = getTargetState(targetStates, item.entry.path);
    const disposition = reconcileDesired(target, item, previous, restoreDeleted, result);
    if (disposition !== undefined) {
      nextEntries.push(disposition);
    }
  }

  nextEntries.push(
    ...reconcileObsoleteEntries(
      loadedManifest.manifest.entries,
      seenPrevious,
      new Set(prepared.map((item) => item.entry.sourceId)),
      targetStates,
      result,
      options,
    ),
  );

  const manifest = validateGlobalManagedManifest({
    generator: "harnix",
    schemaVersion: 1,
    platform: options.platform,
    entries: nextEntries.sort(compareEntries),
  });
  result.manifest = manifest;

  const manifestOutput = manifest.entries.length === 0 ? undefined : serializeManifest(manifest);
  const plans = await buildPlans(
    targetStates,
    manifestPath,
    manifestOutput,
    manifestRelativePath,
    loadedManifest.content,
  );
  return { options, result, plans };
}

/** Safe, deterministic lock/reconciliation order key; it contains no physical home path. */
export function globalManagedReconciliationOrderKey(options: ReconcileGlobalManagedFilesOptions): string {
  return `${options.root.logicalPath}\u0000${normalizeGlobalPath(options.manifestPath)}`;
}

function assertUniqueReconciliationRoots(reconciliations: readonly ReconcileGlobalManagedFilesOptions[]): void {
  const targets = new Set<string>();
  for (const reconciliation of reconciliations) {
    const target = `${reconciliation.root.path}\u0000${normalizeGlobalPath(reconciliation.manifestPath)}`;
    if (targets.has(target)) {
      throw new GlobalManagedManifestError(
        "A global managed multi-root transaction must not reconcile one sidecar twice.",
      );
    }
    targets.add(target);
  }
}

/** An existing namespaced root without a Harnix sidecar is preserved untouched, never adopted. */
async function preserveUnownedRoot(
  options: ReconcileGlobalManagedFilesOptions,
  prepared: readonly PreparedDesired[],
  loadedManifest: LoadedGlobalManifest,
): Promise<GlobalManagedReconcileResult | undefined> {
  if (
    !options.preserveUnownedRoot ||
    loadedManifest.content !== undefined ||
    !(await pathExists(options.root.path)) ||
    (await rootContainsOnlyOwnedLock(
      options.root,
      options.ownedRootLockPath,
      options.ownedRootLockRecordName,
      options.ownedRootLockContent,
    ))
  ) {
    return undefined;
  }
  const result = emptyResult(loadedManifest.manifest);
  for (const item of prepared) {
    preserve(
      result,
      entryLabel(item.entry),
      "untracked-collision",
      "The pre-existing namespaced integration root has no Harnix ownership sidecar.",
    );
  }
  return result;
}

/** Previously owned entries that are no longer desired: removed when allowed, otherwise kept in the manifest. */
function reconcileObsoleteEntries(
  previousEntries: readonly GlobalManagedEntry[],
  seenPrevious: ReadonlySet<string>,
  desiredSourceIds: ReadonlySet<string>,
  targetStates: ReadonlyMap<string, TargetState>,
  result: GlobalManagedReconcileResult,
  options: ReconcileGlobalManagedFilesOptions,
): GlobalManagedEntry[] {
  const kept: GlobalManagedEntry[] = [];
  for (const previous of previousEntries) {
    if (seenPrevious.has(entryKey(previous))) continue;
    const target = getTargetState(targetStates, previous.path);
    const matcher = options.memberMatchers?.get(previous.sourceId) ?? defaultJsonMemberMatcher;
    // A fragment whose replacement is being installed now (same sourceId, new shape) must not keep running beside it.
    const superseded = desiredSourceIds.has(previous.sourceId);
    if (!(options.removeObsolete || superseded) || !removeObsoleteEntry(target, previous, result, matcher)) {
      kept.push(previous);
    }
  }
  return kept;
}
