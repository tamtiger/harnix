import { chmod, readFile, rm, stat } from "node:fs/promises";
import { GlobalManagedManifestError } from "src/core/global/managed-error.js";
import { compareCodeUnits } from "src/utils/order.js";
import { readOptionalText } from "src/core/global/discovery.js";
import { isMissingPathError } from "src/core/global/manifest.js";
import { matchesExpectedOutput, pushUnique } from "src/core/global/reconcile.js";
import {
  type FileSnapshot,
  type GlobalManagedRemover,
  GlobalManagedTransactionError,
  type GlobalManagedWriter,
  type PlannedWrite,
  type TargetState,
  type TransactionPlan,
} from "src/core/global/types.js";

export async function buildPlans(
  states: ReadonlyMap<string, TargetState>,
  manifestPath: string,
  manifestContent: string | undefined,
  manifestLabel: string,
  manifestOriginal: string | undefined,
): Promise<PlannedWrite[]> {
  const plans: PlannedWrite[] = [];
  for (const state of [...states.values()].sort((left, right) =>
    compareCodeUnits(left.relativePath, right.relativePath),
  )) {
    if (state.current === state.original) {
      continue;
    }
    const snapshot = await captureSnapshot(state.absolutePath);
    if (!matchesSnapshot(state.original, snapshot)) {
      throw new GlobalManagedManifestError("A global managed target changed during reconciliation preflight.");
    }
    plans.push({ path: state.absolutePath, label: state.relativePath, output: state.current, snapshot });
  }
  const manifestSnapshot = await captureSnapshot(manifestPath);
  if (!matchesSnapshot(manifestOriginal, manifestSnapshot)) {
    throw new GlobalManagedManifestError("The global managed manifest changed during reconciliation preflight.");
  }
  if (manifestSnapshot.content !== manifestContent) {
    // Keep this final even when a lexical target path would otherwise sort after it.
    plans.push({ path: manifestPath, label: manifestLabel, output: manifestContent, snapshot: manifestSnapshot });
  }
  return plans;
}

export async function applyPlans(
  plans: readonly PlannedWrite[],
  writer: GlobalManagedWriter,
  remover: GlobalManagedRemover,
): Promise<void> {
  await applyTransaction(plans.map((plan) => ({ plan, writer, remover })));
}

export async function applyTransaction(plans: readonly TransactionPlan[]): Promise<void> {
  const attempted: TransactionPlan[] = [];
  try {
    for (const transactionPlan of plans) {
      const { plan, writer, remover } = transactionPlan;
      await assertSnapshotUnchangedImmediatelyBeforeApply(plan);
      attempted.push(transactionPlan);
      if (plan.output === undefined) {
        await remover(plan.path);
      } else {
        await writer(plan.path, plan.output);
        if (plan.snapshot.mode !== undefined) {
          await chmod(plan.path, plan.snapshot.mode);
        }
      }
    }
  } catch (error: unknown) {
    const rollback = await rollbackPlans(attempted);
    throw new GlobalManagedTransactionError(
      "Global managed reconciliation failed; attempted writes were rolled back conservatively.",
      rollback,
      error,
    );
  }
}

async function assertSnapshotUnchangedImmediatelyBeforeApply(plan: PlannedWrite): Promise<void> {
  const current = await captureSnapshot(plan.path);
  if (!sameFileSnapshot(current, plan.snapshot)) {
    throw new GlobalManagedManifestError("A global managed target changed immediately before apply.");
  }
}

async function rollbackPlans(
  attempted: readonly TransactionPlan[],
): Promise<{ restored: string[]; partial: string[] }> {
  const restored: string[] = [];
  const partial: string[] = [];
  for (const { plan, writer, remover } of [...attempted].reverse()) {
    const current = await readOptionalText(plan.path);
    if (!matchesExpectedOutput(current, plan.output)) {
      if (!matchesSnapshot(current, plan.snapshot)) {
        pushUnique(partial, plan.label);
      }
      continue;
    }
    try {
      if (plan.snapshot.exists) {
        await writer(plan.path, plan.snapshot.content!);
        if (plan.snapshot.mode !== undefined) {
          await chmod(plan.path, plan.snapshot.mode);
        }
      } else {
        await remover(plan.path);
      }
      pushUnique(restored, plan.label);
    } catch {
      pushUnique(partial, plan.label);
    }
  }
  return { restored, partial };
}

export async function captureSnapshot(path: string): Promise<FileSnapshot> {
  try {
    const metadata = await stat(path);
    if (!metadata.isFile()) {
      throw new GlobalManagedManifestError("A global managed target must be a regular file.");
    }
    return { exists: true, content: await readFile(path, "utf8"), mode: metadata.mode & 0o777 };
  } catch (error: unknown) {
    if (isMissingPathError(error)) {
      return { exists: false };
    }
    throw error;
  }
}

export async function removeManagedFile(path: string): Promise<void> {
  await rm(path, { force: true });
}

function matchesSnapshot(current: string | undefined, snapshot: FileSnapshot): boolean {
  return snapshot.exists ? current === snapshot.content : current === undefined;
}

function sameFileSnapshot(left: FileSnapshot, right: FileSnapshot): boolean {
  return left.exists === right.exists && (!left.exists || (left.content === right.content && left.mode === right.mode));
}
