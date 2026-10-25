import {
  appendManagedBlock,
  canonicalManagedBlock,
  locateManagedBlock,
  renderManagedBlock,
} from "src/core/global/managed-markers.js";
import { detectEol, withEol } from "src/core/global/toml-guard.js";
import { decideWholeFile } from "src/core/managed/decision.js";
import { sha256 } from "src/utils/hashing.js";
import { entryLabel, sameEntryShape } from "src/core/global/manifest.js";
import { reconcileJsonMember } from "src/core/global/obsolete.js";
import {
  type DesiredGlobalFile,
  type DesiredGlobalManagedBlock,
  type GlobalManagedEntry,
  type GlobalManagedManifestV1,
  type GlobalManagedReconcileResult,
  type GlobalManagedWarning,
  type PreparedDesired,
  type TargetState,
} from "src/core/global/types.js";

export function reconcileDesired(
  target: TargetState,
  item: PreparedDesired,
  previous: GlobalManagedEntry | undefined,
  restoreDeleted: boolean,
  result: GlobalManagedReconcileResult,
): GlobalManagedEntry | undefined {
  const label = entryLabel(item.entry);
  if (previous !== undefined && !sameEntryShape(previous, item.entry)) {
    preserve(result, label, "manifest-conflict", "The desired entry no longer matches the owned fragment selector.");
    return previous;
  }
  if (item.desired.kind === "file") {
    return reconcileWholeFile(target, item, previous, restoreDeleted, result);
  }
  if (item.desired.kind === "managed-block") {
    return reconcileManagedBlock(target, item, previous, restoreDeleted, result);
  }
  return reconcileJsonMember(target, item, previous, restoreDeleted, result);
}

function reconcileWholeFile(
  target: TargetState,
  item: PreparedDesired,
  previous: GlobalManagedEntry | undefined,
  restoreDeleted: boolean,
  result: GlobalManagedReconcileResult,
): GlobalManagedEntry | undefined {
  const label = entryLabel(item.entry);
  const desired = item.desired as DesiredGlobalFile;
  if (previous === undefined && target.unownedSkillUnit) {
    preserve(
      result,
      label,
      "untracked-collision",
      "A pre-existing Harnix-namespaced skill unit is not owned by Harnix.",
    );
    return undefined;
  }
  switch (
    decideWholeFile({
      current: target.current,
      previousHash: previous?.generatedHash,
      desiredHash: item.entry.generatedHash,
      restoreDeleted,
    })
  ) {
    case "create":
      target.current = desired.content;
      pushUnique(result.created, label);
      return item.entry;
    case "keep-deleted":
      preserve(result, label, "deleted", "The previously-owned whole file is missing and was not restored.");
      return previous;
    case "collision":
      preserve(result, label, "untracked-collision", "A pre-existing whole file is not owned by Harnix.");
      return undefined;
    case "keep-modified":
      preserve(result, label, "modified", "The Harnix-owned whole file was modified by the user.");
      return previous;
    case "unchanged":
      pushUnique(result.unchanged, label);
      return item.entry;
    case "update":
      target.current = desired.content;
      pushUnique(result.updated, label);
      return item.entry;
  }
}

function reconcileManagedBlock(
  target: TargetState,
  item: PreparedDesired,
  previous: GlobalManagedEntry | undefined,
  restoreDeleted: boolean,
  result: GlobalManagedReconcileResult,
): GlobalManagedEntry | undefined {
  const label = entryLabel(item.entry);
  const desired = item.desired as DesiredGlobalManagedBlock;
  const fragment = renderManagedBlock(desired.selector, desired.content);
  if (target.current === undefined) {
    if (previous === undefined || restoreDeleted) {
      target.current = `${fragment}\n`;
      pushUnique(result.created, label);
      return item.entry;
    }
    preserve(result, label, "deleted", "The previously-owned managed block is missing and was not restored.");
    return previous;
  }
  const located = locateManagedBlock(target.current, desired.selector);
  if (located.kind === "malformed") {
    preserve(result, label, "malformed-markers", "Harnix markers are unbalanced, duplicated, or out of order.");
    return previous;
  }
  if (located.kind === "missing") {
    if (previous === undefined || restoreDeleted) {
      const reason = desired.conflictCheck?.(target.current);
      if (reason !== undefined) {
        preserve(result, label, "untracked-collision", reason);
        return previous;
      }
      target.current = appendManagedBlock(target.current, fragment);
      pushUnique(result.created, label);
      return item.entry;
    }
    preserve(result, label, "deleted", "The previously-owned managed block is missing and was not restored.");
    return previous;
  }
  if (previous === undefined) {
    preserve(result, label, "untracked-collision", "A pre-existing Harnix marker block is not owned by Harnix.");
    return undefined;
  }
  if (sha256(canonicalManagedBlock(located.value)) !== previous.generatedHash) {
    preserve(result, label, "modified", "The Harnix-owned marker block was modified by the user.");
    return previous;
  }
  if (item.entry.generatedHash === previous.generatedHash) {
    pushUnique(result.unchanged, label);
    return item.entry;
  }
  target.current = `${target.current.slice(0, located.start)}${withEol(fragment, detectEol(target.current))}${target.current.slice(located.end)}`;
  pushUnique(result.updated, label);
  return item.entry;
}

export function emptyResult(manifest: GlobalManagedManifestV1): GlobalManagedReconcileResult {
  return { manifest, created: [], updated: [], unchanged: [], preserved: [], deleted: [], warnings: [] };
}

export function preserve(
  result: GlobalManagedReconcileResult,
  path: string,
  code: GlobalManagedWarning["code"],
  message: string,
): void {
  pushUnique(result.preserved, path);
  result.warnings.push({ code, path, message });
}

export function matchesExpectedOutput(current: string | undefined, output: string | undefined): boolean {
  return current === output;
}

export function pushUnique(values: string[], value: string): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}
