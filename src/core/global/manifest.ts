import { readFile } from "node:fs/promises";
import { atomicWriteFile } from "src/utils/atomic-write.js";
import { GlobalManagedManifestError } from "src/core/global/managed-error.js";
import { compareCodeUnits } from "src/utils/order.js";
import { parseCanonicalJsonPointer } from "src/core/global/managed-json.js";
import { markersOverlap, markerTokensOverlap } from "src/core/global/managed-markers.js";
import { normalizeUserRelativePath, resolveSafeUserPath, type UserPathRoot } from "src/core/platform/user-paths.js";
import { readOptionalText } from "src/core/global/discovery.js";
import {
  type GlobalManagedEntry,
  type GlobalManagedKind,
  type GlobalManagedManifestV1,
  type GlobalManagedSelector,
  type GlobalManagedWriter,
  type GlobalPlatform,
  type JsonArrayMemberSelector,
  type LoadedGlobalManifest,
  type MarkerSelector,
} from "src/core/global/types.js";
import { platformRecords } from "src/core/platform/registry.js";

/**
 * Validates the sidecar owned by one platform root. It deliberately has no
 * relationship to the project-local managed-files manifest.
 */
export function validateGlobalManagedManifest(value: unknown): GlobalManagedManifestV1 {
  if (
    !isRecord(value) ||
    value.generator !== "harnix" ||
    value.schemaVersion !== 1 ||
    !isGlobalPlatform(value.platform) ||
    !Array.isArray(value.entries)
  ) {
    throw new GlobalManagedManifestError("Invalid or unsupported global managed manifest.");
  }

  const entries = value.entries.map(validateGlobalManagedEntry);
  let previous = "";
  for (const entry of entries) {
    const key = entryKey(entry);
    if (key <= previous) {
      throw new GlobalManagedManifestError(
        "Global managed manifest entries must be unique and sorted by path and sourceId.",
      );
    }
    previous = key;
  }
  validateEntryGroups(entries);

  return {
    generator: "harnix",
    schemaVersion: 1,
    platform: value.platform,
    entries,
  };
}

export async function readGlobalManagedManifest(path: string): Promise<GlobalManagedManifestV1> {
  try {
    return validateGlobalManagedManifest(JSON.parse(await readFile(path, "utf8")) as unknown);
  } catch (error: unknown) {
    if (error instanceof GlobalManagedManifestError) {
      throw error;
    }
    if (isMissingPathError(error)) {
      throw error;
    }
    throw new GlobalManagedManifestError("Invalid or unreadable global managed manifest.");
  }
}

export async function writeGlobalManagedManifest(
  path: string,
  manifest: GlobalManagedManifestV1,
  writer: GlobalManagedWriter = atomicWriteFile,
): Promise<void> {
  await writer(path, serializeManifest(validateGlobalManagedManifest(manifest)));
}

/**
 * Resolves a path below an already verified, home-anchored platform root.
 * Raw strings are intentionally not accepted: callers must use UserPathRoot.
 */
export async function resolveSafeGlobalPath(root: UserPathRoot, globalPath: string): Promise<string> {
  return resolveSafeUserPath(root, normalizeGlobalPath(globalPath));
}

export function validateGlobalManagedEntry(value: unknown): GlobalManagedEntry {
  if (
    !isRecord(value) ||
    typeof value.path !== "string" ||
    typeof value.sourceId !== "string" ||
    typeof value.kind !== "string" ||
    typeof value.generatedHash !== "string" ||
    typeof value.generatorVersion !== "string"
  ) {
    throw new GlobalManagedManifestError("Invalid global managed manifest entry.");
  }
  const path = normalizeGlobalPath(value.path);
  if (
    path !== value.path ||
    !isNonEmptyText(value.sourceId) ||
    !isNonEmptyText(value.generatorVersion) ||
    !/^[a-f0-9]{64}$/u.test(value.generatedHash) ||
    !isGlobalManagedKind(value.kind)
  ) {
    throw new GlobalManagedManifestError("Global managed manifest entries must use safe canonical values.");
  }

  const selector = validateSelector(value.kind, value.selector);
  const entry = {
    path,
    sourceId: value.sourceId,
    kind: value.kind,
    generatedHash: value.generatedHash,
    generatorVersion: value.generatorVersion,
  } as GlobalManagedEntry;
  return selector === undefined ? entry : { ...entry, selector };
}

function validateSelector(kind: GlobalManagedKind, value: unknown): GlobalManagedSelector | undefined {
  if (kind === "file") {
    if (value !== undefined) {
      throw new GlobalManagedManifestError("Whole-file global entries must not use a selector.");
    }
    return undefined;
  }
  if (!isRecord(value) || typeof value.type !== "string") {
    throw new GlobalManagedManifestError("Fragment global entries require a selector.");
  }
  if (kind === "managed-block") {
    if (
      value.type !== "markers" ||
      typeof value.begin !== "string" ||
      typeof value.end !== "string" ||
      !isNonEmptyText(value.begin) ||
      !isNonEmptyText(value.end) ||
      markerTokensOverlap(value.begin, value.end)
    ) {
      throw new GlobalManagedManifestError(
        "Managed-block entries require distinct non-empty markers that do not overlap.",
      );
    }
    return { type: "markers", begin: value.begin, end: value.end };
  }
  if (
    value.type !== "json-array-member" ||
    typeof value.pointer !== "string" ||
    typeof value.memberId !== "string" ||
    !isNonEmptyText(value.memberId)
  ) {
    throw new GlobalManagedManifestError("JSON member entries require a JSON-array-member selector.");
  }
  try {
    parseCanonicalJsonPointer(value.pointer);
  } catch {
    throw new GlobalManagedManifestError("JSON member entries require a canonical JSON pointer.");
  }
  return { type: "json-array-member", pointer: value.pointer, memberId: value.memberId };
}

function validateEntryGroups(entries: readonly GlobalManagedEntry[]): void {
  const byPath = new Map<string, GlobalManagedEntry[]>();
  for (const entry of entries) {
    const group = byPath.get(entry.path) ?? [];
    group.push(entry);
    byPath.set(entry.path, group);
  }

  for (const group of byPath.values()) {
    const sourceIds = new Set<string>();
    for (const entry of group) {
      if (sourceIds.has(entry.sourceId)) {
        throw new GlobalManagedManifestError(
          "Global managed entries with the same path must have unique sourceId values.",
        );
      }
      sourceIds.add(entry.sourceId);
    }
    if (group.some((entry) => entry.kind === "file") && group.length > 1) {
      throw new GlobalManagedManifestError("Whole-file global entries overlap every other entry on the same path.");
    }
    if (group.length < 2) {
      continue;
    }
    const kinds = new Set(group.map((entry) => entry.kind));
    if (kinds.size > 1) {
      throw new GlobalManagedManifestError("Global managed fragments of different kinds cannot share one path.");
    }
    if (group[0]?.kind === "managed-block") {
      const selectors = group.map((entry) => entry.selector as MarkerSelector);
      for (let index = 0; index < selectors.length; index += 1) {
        for (let other = index + 1; other < selectors.length; other += 1) {
          if (markersOverlap(selectors[index]!, selectors[other]!)) {
            throw new GlobalManagedManifestError("Managed-block selectors overlap on the same path.");
          }
        }
      }
    }
    if (group[0]?.kind === "json-member") {
      const selectors = group.map((entry) => entry.selector as JsonArrayMemberSelector);
      const selectorKeys = new Set<string>();
      for (const selector of selectors) {
        const key = `${selector.pointer}\u0000${selector.memberId}`;
        if (selectorKeys.has(key)) {
          throw new GlobalManagedManifestError("JSON member selectors overlap on the same path.");
        }
        selectorKeys.add(key);
      }
    }
  }
}

export async function loadManifestOrEmpty(path: string, platform: GlobalPlatform): Promise<LoadedGlobalManifest> {
  const content = await readOptionalText(path);
  if (content === undefined) {
    return { manifest: { generator: "harnix", schemaVersion: 1, platform, entries: [] }, content: undefined };
  }
  let manifest: GlobalManagedManifestV1;
  try {
    manifest = validateGlobalManagedManifest(JSON.parse(content) as unknown);
  } catch (error: unknown) {
    if (error instanceof GlobalManagedManifestError) {
      throw error;
    }
    throw new GlobalManagedManifestError("Invalid or unreadable global managed manifest.");
  }
  if (manifest.platform !== platform) {
    throw new GlobalManagedManifestError("The global managed manifest belongs to a different platform root.");
  }
  return { manifest, content };
}

export function entryLabel(entry: GlobalManagedEntry): string {
  return entry.kind === "file" ? entry.path : `${entry.path}#${entry.sourceId}`;
}

export function entryKey(entry: Pick<GlobalManagedEntry, "path" | "sourceId">): string {
  return `${entry.path}\u0000${entry.sourceId}`;
}

export function compareEntries(left: GlobalManagedEntry, right: GlobalManagedEntry): number {
  return compareCodeUnits(entryKey(left), entryKey(right));
}

export function sameEntryShape(left: GlobalManagedEntry, right: GlobalManagedEntry): boolean {
  return (
    left.path === right.path &&
    left.sourceId === right.sourceId &&
    left.kind === right.kind &&
    selectorKey(left.selector) === selectorKey(right.selector)
  );
}

function selectorKey(selector: GlobalManagedSelector | undefined): string {
  if (selector === undefined) {
    return "";
  }
  if (selector.type === "markers") {
    return `markers\u0000${selector.begin}\u0000${selector.end}`;
  }
  return `json-array-member\u0000${selector.pointer}\u0000${selector.memberId}`;
}

export function serializeManifest(manifest: GlobalManagedManifestV1): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function normalizeGlobalPath(value: string): string {
  try {
    const normalized = normalizeUserRelativePath(value);
    if (normalized !== value) {
      throw new Error("not canonical");
    }
    return normalized;
  } catch {
    throw new GlobalManagedManifestError("Global managed paths must be safe canonical relative paths.");
  }
}

export function isMissingPathError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

const GLOBAL_PLATFORM_IDS: readonly GlobalPlatform[] = platformRecords().flatMap((record) =>
  record.targets.map((target) => target.globalPlatform),
);

function isGlobalPlatform(value: unknown): value is GlobalPlatform {
  return typeof value === "string" && (GLOBAL_PLATFORM_IDS as readonly string[]).includes(value);
}

function isGlobalManagedKind(value: string): value is GlobalManagedKind {
  return value === "file" || value === "managed-block" || value === "json-member";
}

export function isNonEmptyText(value: string): boolean {
  return value.trim().length > 0 && !/[\0\r\n]/u.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
