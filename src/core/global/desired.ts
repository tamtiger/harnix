import { GlobalManagedManifestError } from "src/core/global/managed-error.js";
import { canonicalJson, defaultJsonMemberMatcher, normalizeJsonValue } from "src/core/global/managed-json.js";
import { canonicalManagedBlock, renderManagedBlock } from "src/core/global/managed-markers.js";
import { sha256 } from "src/utils/hashing.js";
import {
  compareEntries,
  isNonEmptyText,
  validateGlobalManagedEntry,
  validateGlobalManagedManifest,
} from "src/core/global/manifest.js";
import {
  type DesiredGlobalManagedFile,
  type GlobalManagedEntry,
  type GlobalPlatform,
  type PreparedDesired,
} from "src/core/global/types.js";

export function prepareDesired(
  desired: readonly DesiredGlobalManagedFile[],
  platform: GlobalPlatform,
  generatorVersion: string,
): PreparedDesired[] {
  const prepared = desired.map((item) => {
    const entry = entryFromDesired(item, generatorVersion);
    return { desired: item, entry };
  });
  validateGlobalManagedManifest({
    generator: "harnix",
    schemaVersion: 1,
    platform,
    entries: prepared.map((item) => item.entry).sort(compareEntries),
  });
  return prepared.sort((left, right) => compareEntries(left.entry, right.entry));
}

function entryFromDesired(desired: DesiredGlobalManagedFile, generatorVersion: string): GlobalManagedEntry {
  if (!isNonEmptyText(desired.path) || !isNonEmptyText(desired.sourceId)) {
    throw new GlobalManagedManifestError("Desired global managed entries require a path and sourceId.");
  }
  if (desired.kind === "file") {
    if (typeof desired.content !== "string") {
      throw new GlobalManagedManifestError("Whole-file global content must be text.");
    }
    return validateGlobalManagedEntry({
      path: desired.path,
      sourceId: desired.sourceId,
      kind: desired.kind,
      generatedHash: sha256(desired.content),
      generatorVersion,
    });
  }
  if (desired.kind === "managed-block") {
    if (typeof desired.content !== "string") {
      throw new GlobalManagedManifestError("Managed-block global content must be text.");
    }
    if (desired.content.includes(desired.selector.begin) || desired.content.includes(desired.selector.end)) {
      throw new GlobalManagedManifestError("Managed-block marker content must not contain its own boundary markers.");
    }
    const fragment = renderManagedBlock(desired.selector, desired.content);
    return validateGlobalManagedEntry({
      path: desired.path,
      sourceId: desired.sourceId,
      kind: desired.kind,
      selector: desired.selector,
      generatedHash: sha256(canonicalManagedBlock(fragment)),
      generatorVersion,
    });
  }
  const member = normalizeJsonValue(desired.member);
  const matcher = desired.memberMatcher ?? defaultJsonMemberMatcher;
  if (!matcher(member, desired.selector)) {
    throw new GlobalManagedManifestError("A desired JSON member does not match its own stable selector.");
  }
  return validateGlobalManagedEntry({
    path: desired.path,
    sourceId: desired.sourceId,
    kind: desired.kind,
    selector: desired.selector,
    generatedHash: sha256(canonicalJson(member)),
    generatorVersion,
  });
}
