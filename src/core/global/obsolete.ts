import {
  canonicalJson,
  createJsonDocument,
  defaultJsonMemberMatcher,
  findExistingJsonArray,
  findOrCreateJsonArray,
  normalizeJsonValue,
  parseJsonDocument,
  serializeJsonDocument,
} from "src/core/global/managed-json.js";
import {
  JsonTextError,
  insertArrayMember,
  isEmptyJsonRoot,
  removeArrayMember,
  replaceArrayMember,
} from "src/core/global/json-text.js";
import { canonicalManagedBlock, locateManagedBlock } from "src/core/global/managed-markers.js";
import { decideObsoleteFile } from "src/core/managed/decision.js";
import { sha256 } from "src/utils/hashing.js";
import { entryLabel } from "src/core/global/manifest.js";
import { preserve, pushUnique } from "src/core/global/reconcile.js";
import {
  type DesiredGlobalJsonMember,
  type GlobalJsonMemberMatcher,
  type GlobalManagedEntry,
  type GlobalManagedReconcileResult,
  type JsonArrayMemberSelector,
  type JsonValue,
  type MarkerSelector,
  type PreparedDesired,
  type TargetState,
} from "src/core/global/types.js";

/** Runs an in-place text edit; a document that cannot be edited safely yields undefined so the caller preserves it. */
function editJsonText(edit: () => string): string | undefined {
  try {
    return edit();
  } catch (error: unknown) {
    if (error instanceof JsonTextError) return undefined;
    throw error;
  }
}

export function reconcileJsonMember(
  target: TargetState,
  item: PreparedDesired,
  previous: GlobalManagedEntry | undefined,
  restoreDeleted: boolean,
  result: GlobalManagedReconcileResult,
): GlobalManagedEntry | undefined {
  const label = entryLabel(item.entry);
  const desired = item.desired as DesiredGlobalJsonMember;
  const matcher = desired.memberMatcher ?? defaultJsonMemberMatcher;
  const member = normalizeJsonValue(desired.member);
  let document: JsonValue;
  if (target.current === undefined) {
    document = createJsonDocument(desired.selector);
  } else {
    try {
      document = parseJsonDocument(target.current);
    } catch {
      preserve(result, label, "invalid-json", "The shared JSON file cannot be parsed safely.");
      return previous;
    }
  }
  const array = findOrCreateJsonArray(document, desired.selector);
  if (array === undefined) {
    preserve(result, label, "invalid-json-pointer", "The configured JSON pointer does not safely resolve to an array.");
    return previous;
  }
  const matches = array
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => matcher(candidate, desired.selector));
  if (matches.length > 1) {
    preserve(result, label, "duplicate-json-member", "Multiple JSON array members match the stable Harnix memberId.");
    return previous;
  }
  if (matches.length === 0) {
    if (previous !== undefined && desired.preserveIfUnmatched && array.length > 0) {
      preserve(
        result,
        label,
        "modified",
        "The previously-owned JSON member cannot be distinguished safely from edited or unrelated handlers.",
      );
      return previous;
    }
    if (previous === undefined || restoreDeleted) {
      array.push(member);
      const text =
        target.current === undefined
          ? serializeJsonDocument(document)
          : editJsonText(() => insertArrayMember(target.current!, desired.selector.pointer, member));
      if (text === undefined) {
        preserve(result, label, "invalid-json-pointer", "The shared JSON file cannot be edited in place safely.");
        return previous;
      }
      target.current = text;
      pushUnique(result.created, label);
      return item.entry;
    }
    preserve(result, label, "deleted", "The previously-owned JSON array member is missing and was not restored.");
    return previous;
  }
  const match = matches[0]!;
  if (previous === undefined) {
    preserve(
      result,
      label,
      "untracked-collision",
      "A pre-existing JSON array member matches the Harnix memberId but is not owned by Harnix.",
    );
    return undefined;
  }
  if (sha256(canonicalJson(match.candidate)) !== previous.generatedHash) {
    preserve(result, label, "modified", "The Harnix-owned JSON array member was modified by the user.");
    return previous;
  }
  if (item.entry.generatedHash === previous.generatedHash) {
    pushUnique(result.unchanged, label);
    return item.entry;
  }
  const replaced = editJsonText(() =>
    replaceArrayMember(target.current!, desired.selector.pointer, match.index, member),
  );
  if (replaced === undefined) {
    preserve(result, label, "invalid-json-pointer", "The shared JSON file cannot be edited in place safely.");
    return previous;
  }
  target.current = replaced;
  pushUnique(result.updated, label);
  return item.entry;
}

export function removeObsoleteEntry(
  target: TargetState,
  entry: GlobalManagedEntry,
  result: GlobalManagedReconcileResult,
  jsonMemberMatcher: GlobalJsonMemberMatcher,
): boolean {
  const label = entryLabel(entry);
  if (entry.kind === "file") {
    if (decideObsoleteFile(target.current, entry.generatedHash) === "keep-modified") {
      preserve(result, label, "modified", "The obsolete Harnix-owned whole file was modified by the user.");
      return false;
    }
    target.current = undefined;
    pushUnique(result.deleted, label);
    return true;
  }
  if (entry.kind === "managed-block") {
    const selector = entry.selector as MarkerSelector;
    if (target.current === undefined) {
      pushUnique(result.deleted, label);
      return true;
    }
    const located = locateManagedBlock(target.current, selector);
    if (located.kind !== "found") {
      preserve(
        result,
        label,
        located.kind === "malformed" ? "malformed-markers" : "modified",
        "The obsolete Harnix marker block cannot be removed safely.",
      );
      return false;
    }
    if (sha256(canonicalManagedBlock(located.value)) !== entry.generatedHash) {
      preserve(result, label, "modified", "The obsolete Harnix marker block was modified by the user.");
      return false;
    }
    const remaining = `${target.current.slice(0, located.start)}${target.current.slice(located.end)}`;
    target.current = remaining.trim().length === 0 ? undefined : remaining;
    pushUnique(result.deleted, label);
    return true;
  }
  if (target.current === undefined) {
    pushUnique(result.deleted, label);
    return true;
  }
  let document: JsonValue;
  try {
    document = parseJsonDocument(target.current);
  } catch {
    preserve(result, label, "invalid-json", "The obsolete JSON array member cannot be removed from invalid JSON.");
    return false;
  }
  const selector = entry.selector as JsonArrayMemberSelector;
  const array = findExistingJsonArray(document, selector);
  if (array === undefined) {
    preserve(
      result,
      label,
      "invalid-json-pointer",
      "The obsolete JSON array member pointer no longer resolves safely.",
    );
    return false;
  }
  const matches = array
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => jsonMemberMatcher(candidate, selector));
  const match = matches[0];
  if (matches.length !== 1 || match === undefined || sha256(canonicalJson(match.candidate)) !== entry.generatedHash) {
    preserve(
      result,
      label,
      matches.length > 1 ? "duplicate-json-member" : "modified",
      "The obsolete Harnix JSON array member was modified or cannot be identified safely.",
    );
    return false;
  }
  const text = editJsonText(() => removeArrayMember(target.current!, selector.pointer, match.index));
  if (text === undefined) {
    preserve(
      result,
      label,
      "invalid-json-pointer",
      "The obsolete JSON array member cannot be removed in place safely.",
    );
    return false;
  }
  target.current = isEmptyJsonRoot(text) ? undefined : text;
  pushUnique(result.deleted, label);
  return true;
}
