import { chmod, readFile, readdir, rm, stat } from "node:fs/promises";
import { atomicWriteFile } from "./atomic-write.js";
import { GlobalManagedManifestError } from "./global-managed-error.js";
import {
  canonicalJson,
  createJsonDocument,
  defaultJsonMemberMatcher,
  findExistingJsonArray,
  findOrCreateJsonArray,
  normalizeJsonValue,
  parseCanonicalJsonPointer,
  parseJsonDocument,
  serializeJsonDocument,
} from "./global-managed-json.js";
import {
  appendManagedBlock,
  canonicalManagedBlock,
  locateManagedBlock,
  markersOverlap,
  markerTokensOverlap,
  renderManagedBlock,
} from "./global-managed-markers.js";
import { sha256 } from "./hashing.js";
import { normalizeUserRelativePath, resolveSafeUserPath, type UserPathRoot } from "./user-paths.js";

export type GlobalPlatform = "kiro" | "antigravity-desktop" | "antigravity-cli" | "codex";
export type GlobalManagedKind = "file" | "managed-block" | "json-member";

export interface MarkerSelector {
  type: "markers";
  begin: string;
  end: string;
}

export interface JsonArrayMemberSelector {
  type: "json-array-member";
  pointer: string;
  memberId: string;
}

export type GlobalManagedSelector = MarkerSelector | JsonArrayMemberSelector;

export interface GlobalManagedEntry {
  path: string;
  sourceId: string;
  kind: GlobalManagedKind;
  selector?: GlobalManagedSelector;
  generatedHash: string;
  generatorVersion: string;
}

export interface GlobalManagedManifestV1 {
  generator: "harnix";
  schemaVersion: 1;
  platform: GlobalPlatform;
  entries: GlobalManagedEntry[];
}

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type GlobalJsonMemberMatcher = (candidate: JsonValue, selector: JsonArrayMemberSelector) => boolean;

export interface DesiredGlobalFile {
  path: string;
  sourceId: string;
  kind: "file";
  content: string;
}

export interface DesiredGlobalManagedBlock {
  path: string;
  sourceId: string;
  kind: "managed-block";
  selector: MarkerSelector;
  content: string;
}

export interface DesiredGlobalJsonMember {
  path: string;
  sourceId: string;
  kind: "json-member";
  selector: JsonArrayMemberSelector;
  member: JsonValue;
  memberMatcher?: GlobalJsonMemberMatcher;
  /**
   * When an owned fragment no longer matches but sibling handlers remain,
   * preserve rather than append a second fragment. This is for schemas that
   * have no supported on-disk member id after a user edits every signature.
   */
  preserveIfUnmatched?: boolean;
}

export type DesiredGlobalManagedFile = DesiredGlobalFile | DesiredGlobalManagedBlock | DesiredGlobalJsonMember;

export interface GlobalManagedWarning {
  code: "untracked-collision" | "modified" | "malformed-markers" | "invalid-json" | "invalid-json-pointer" | "duplicate-json-member" | "manifest-conflict" | "deleted";
  path: string;
  message: string;
}

export interface GlobalManagedReconcileResult {
  manifest: GlobalManagedManifestV1;
  created: string[];
  updated: string[];
  unchanged: string[];
  preserved: string[];
  deleted: string[];
  warnings: GlobalManagedWarning[];
}

export type GlobalManagedWriter = (path: string, content: string) => Promise<void>;
export type GlobalManagedRemover = (path: string) => Promise<void>;

export interface ReconcileGlobalManagedFilesOptions {
  /** A user-home-anchored platform root from resolveUserPlatformRoots. */
  root: UserPathRoot;
  manifestPath: string;
  platform: GlobalPlatform;
  generatorVersion: string;
  desired: readonly DesiredGlobalManagedFile[];
  /** Restores a missing, previously-owned fragment. Defaults to true for global setup reconciliation. */
  restoreDeleted?: boolean;
  /** Removes only unchanged entries no longer requested. Intended for scoped global uninstall. */
  removeObsolete?: boolean;
  /**
   * Treat an existing root without this integration's sidecar as user-owned.
   * This is used for namespaced plugin roots where creating even one file
   * beside an untracked plugin would falsely claim the plugin namespace.
   */
  preserveUnownedRoot?: boolean;
  /**
   * @internal Allows a root created by this operation's lock only when that
   * lock is the sole entry. Any concurrent user/plugin file remains a
   * collision and prevents Harnix from claiming the root.
   */
  ownedRootLockPath?: string;
  /** Exact bytes of the lock acquired by this operation; never infer ownership from a lock filename alone. */
  ownedRootLockContent?: string;
  /**
   * Treat an existing `skills/harnix-*` directory without a matching manifest
   * entry as a user-owned skill unit, even when its SKILL.md is missing.
   */
  preserveUnownedSkillDirectories?: boolean;
  /** Computes the exact reconciliation result without writing targets or the sidecar manifest. */
  dryRun?: boolean;
  /** Supplies platform-specific stable member matchers when removing obsolete JSON fragments. */
  memberMatchers?: ReadonlyMap<string, GlobalJsonMemberMatcher>;
  writer?: GlobalManagedWriter;
  remover?: GlobalManagedRemover;
}

export interface ReconcileGlobalManagedRootsOptions {
  /** Callers acquire cross-process locks before invoking this multi-root transaction. */
  reconciliations: readonly ReconcileGlobalManagedFilesOptions[];
}

interface PreparedDesired {
  desired: DesiredGlobalManagedFile;
  entry: GlobalManagedEntry;
}

interface TargetState {
  relativePath: string;
  absolutePath: string;
  original: string | undefined;
  current: string | undefined;
  unownedSkillUnit?: boolean;
}

interface FileSnapshot {
  exists: boolean;
  content?: string;
  mode?: number;
}

interface PlannedWrite {
  path: string;
  label: string;
  output: string | undefined;
  snapshot: FileSnapshot;
}

interface PlannedGlobalReconciliation {
  options: ReconcileGlobalManagedFilesOptions;
  result: GlobalManagedReconcileResult;
  plans: PlannedWrite[];
}

interface TransactionPlan {
  plan: PlannedWrite;
  writer: GlobalManagedWriter;
  remover: GlobalManagedRemover;
}

interface LoadedGlobalManifest {
  manifest: GlobalManagedManifestV1;
  content: string | undefined;
}

export { GlobalManagedManifestError } from "./global-managed-error.js";

export class GlobalManagedTransactionError extends Error {
  override name = "GlobalManagedTransactionError";

  constructor(
    message: string,
    readonly rollback: { restored: string[]; partial: string[] },
    readonly originalError: unknown,
  ) {
    super(message);
  }
}

/**
 * Validates the sidecar owned by one platform root. It deliberately has no
 * relationship to the project-local managed-files manifest.
 */
export function validateGlobalManagedManifest(value: unknown): GlobalManagedManifestV1 {
  if (!isRecord(value) || value.generator !== "harnix" || value.schemaVersion !== 1 || !isGlobalPlatform(value.platform) || !Array.isArray(value.entries)) {
    throw new GlobalManagedManifestError("Invalid or unsupported global managed manifest.");
  }

  const entries = value.entries.map(validateGlobalManagedEntry);
  let previous = "";
  for (const entry of entries) {
    const key = entryKey(entry);
    if (key <= previous) {
      throw new GlobalManagedManifestError("Global managed manifest entries must be unique and sorted by path and sourceId.");
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

export async function writeGlobalManagedManifest(path: string, manifest: GlobalManagedManifestV1, writer: GlobalManagedWriter = atomicWriteFile): Promise<void> {
  await writer(path, serializeManifest(validateGlobalManagedManifest(manifest)));
}

/**
 * Resolves a path below an already verified, home-anchored platform root.
 * Raw strings are intentionally not accepted: callers must use UserPathRoot.
 */
export async function resolveSafeGlobalPath(root: UserPathRoot, globalPath: string): Promise<string> {
  return resolveSafeUserPath(root, normalizeGlobalPath(globalPath));
}

/**
 * Reconciles a single platform root in memory first, then atomically applies
 * target writes followed by its sidecar manifest. A failed apply restores only
 * paths whose bytes are still exactly the Harnix output written by this call.
 */
export async function reconcileGlobalManagedFiles(options: ReconcileGlobalManagedFilesOptions): Promise<GlobalManagedReconcileResult> {
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
export async function reconcileGlobalManagedRoots(options: ReconcileGlobalManagedRootsOptions): Promise<GlobalManagedReconcileResult[]> {
  const ordered = options.reconciliations.map((reconciliation, index) => ({ reconciliation, index })).sort((left, right) => globalManagedReconciliationOrderKey(left.reconciliation).localeCompare(globalManagedReconciliationOrderKey(right.reconciliation)));
  assertUniqueReconciliationRoots(ordered.map(({ reconciliation }) => reconciliation));
  const prepared: Array<PlannedGlobalReconciliation & { index: number }> = [];
  for (const item of ordered) {
    prepared.push({ ...await preflightGlobalManagedFiles(item.reconciliation), index: item.index });
  }
  const transactionPlans = prepared.flatMap(({ options: reconciliation, plans }) => reconciliation.dryRun ? [] : plans.map((plan) => ({
    plan: { ...plan, label: reconciliation.root.display(plan.label) },
    writer: reconciliation.writer ?? atomicWriteFile,
    remover: reconciliation.remover ?? removeManagedFile,
  })));
  if (transactionPlans.length > 0) {
    await applyTransaction(transactionPlans);
  }
  return prepared.sort((left, right) => left.index - right.index).map(({ result }) => result);
}

async function preflightGlobalManagedFiles(options: ReconcileGlobalManagedFilesOptions): Promise<PlannedGlobalReconciliation> {
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
  if (options.preserveUnownedRoot
    && loadedManifest.content === undefined
    && await pathExists(options.root.path)
    && !await rootContainsOnlyOwnedLock(options.root, options.ownedRootLockPath, options.ownedRootLockContent)) {
    const result = emptyResult(loadedManifest.manifest);
    for (const item of prepared) {
      preserve(result, entryLabel(item.entry), "untracked-collision", "The pre-existing namespaced integration root has no Harnix ownership sidecar.");
    }
    return { options, result, plans: [] };
  }
  const targetRelativePaths = [...new Set([...prepared.map((item) => item.entry.path), ...loadedManifest.manifest.entries.map((entry) => entry.path)])];
  const targetPaths = await Promise.all(targetRelativePaths.map(async (path) => [path, await resolveSafeGlobalPath(options.root, path)] as const));
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

  for (const previous of loadedManifest.manifest.entries) {
    if (seenPrevious.has(entryKey(previous))) {
      continue;
    }
    const target = getTargetState(targetStates, previous.path);
    if (options.removeObsolete) {
      const removed = removeObsoleteEntry(target, previous, result, options.memberMatchers?.get(previous.sourceId) ?? defaultJsonMemberMatcher);
      if (!removed) {
        nextEntries.push(previous);
      }
    } else {
      nextEntries.push(previous);
    }
  }

  const manifest = validateGlobalManagedManifest({
    generator: "harnix",
    schemaVersion: 1,
    platform: options.platform,
    entries: nextEntries.sort(compareEntries),
  });
  result.manifest = manifest;

  const manifestOutput = manifest.entries.length === 0 ? undefined : serializeManifest(manifest);
  const plans = await buildPlans(targetStates, manifestPath, manifestOutput, manifestRelativePath, loadedManifest.content);
  return { options, result, plans };
}

function validateGlobalManagedEntry(value: unknown): GlobalManagedEntry {
  if (!isRecord(value) || typeof value.path !== "string" || typeof value.sourceId !== "string" || typeof value.kind !== "string" || typeof value.generatedHash !== "string" || typeof value.generatorVersion !== "string") {
    throw new GlobalManagedManifestError("Invalid global managed manifest entry.");
  }
  const path = normalizeGlobalPath(value.path);
  if (path !== value.path || !isNonEmptyText(value.sourceId) || !isNonEmptyText(value.generatorVersion) || !/^[a-f0-9]{64}$/u.test(value.generatedHash) || !isGlobalManagedKind(value.kind)) {
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
    if (value.type !== "markers" || typeof value.begin !== "string" || typeof value.end !== "string" || !isNonEmptyText(value.begin) || !isNonEmptyText(value.end) || markerTokensOverlap(value.begin, value.end)) {
      throw new GlobalManagedManifestError("Managed-block entries require distinct non-empty markers that do not overlap.");
    }
    return { type: "markers", begin: value.begin, end: value.end };
  }
  if (value.type !== "json-array-member" || typeof value.pointer !== "string" || typeof value.memberId !== "string" || !isNonEmptyText(value.memberId)) {
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
        throw new GlobalManagedManifestError("Global managed entries with the same path must have unique sourceId values.");
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

function prepareDesired(desired: readonly DesiredGlobalManagedFile[], platform: GlobalPlatform, generatorVersion: string): PreparedDesired[] {
  const prepared = desired.map((item) => {
    const entry = entryFromDesired(item, generatorVersion);
    return { desired: item, entry };
  });
  validateGlobalManagedManifest({ generator: "harnix", schemaVersion: 1, platform, entries: prepared.map((item) => item.entry).sort(compareEntries) });
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
    return validateGlobalManagedEntry({ path: desired.path, sourceId: desired.sourceId, kind: desired.kind, generatedHash: sha256(desired.content), generatorVersion });
  }
  if (desired.kind === "managed-block") {
    if (typeof desired.content !== "string") {
      throw new GlobalManagedManifestError("Managed-block global content must be text.");
    }
    if (desired.content.includes(desired.selector.begin) || desired.content.includes(desired.selector.end)) {
      throw new GlobalManagedManifestError("Managed-block marker content must not contain its own boundary markers.");
    }
    const fragment = renderManagedBlock(desired.selector, desired.content);
    return validateGlobalManagedEntry({ path: desired.path, sourceId: desired.sourceId, kind: desired.kind, selector: desired.selector, generatedHash: sha256(canonicalManagedBlock(fragment)), generatorVersion });
  }
  const member = normalizeJsonValue(desired.member);
  const matcher = desired.memberMatcher ?? defaultJsonMemberMatcher;
  if (!matcher(member, desired.selector)) {
    throw new GlobalManagedManifestError("A desired JSON member does not match its own stable selector.");
  }
  return validateGlobalManagedEntry({ path: desired.path, sourceId: desired.sourceId, kind: desired.kind, selector: desired.selector, generatedHash: sha256(canonicalJson(member)), generatorVersion });
}

async function loadManifestOrEmpty(path: string, platform: GlobalPlatform): Promise<LoadedGlobalManifest> {
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

async function loadTargetStates(relativePaths: readonly string[], paths: ReadonlyMap<string, string>): Promise<Map<string, TargetState>> {
  const states = await Promise.all(relativePaths.map(async (relativePath) => {
    const absolutePath = paths.get(relativePath);
    if (absolutePath === undefined) {
      throw new GlobalManagedManifestError("Missing resolved global managed path.");
    }
    const content = await readOptionalText(absolutePath);
    return [relativePath, { relativePath, absolutePath, original: content, current: content }] as const;
  }));
  return new Map(states);
}

async function markUnownedSkillUnitCollisions(
  targetStates: ReadonlyMap<string, TargetState>,
  prepared: readonly PreparedDesired[],
  previousByKey: ReadonlyMap<string, GlobalManagedEntry>,
  root: UserPathRoot,
): Promise<void> {
  for (const item of prepared) {
    if (item.entry.kind !== "file" || previousByKey.has(entryKey(item.entry))) {
      continue;
    }
    const unitPath = harnixSkillUnitPath(item.entry.path);
    if (unitPath === undefined) {
      continue;
    }
    const target = getTargetState(targetStates, item.entry.path);
    if (target.current !== undefined) {
      continue;
    }
    if (await pathExists(await resolveSafeGlobalPath(root, unitPath))) {
      target.unownedSkillUnit = true;
    }
  }
}

function harnixSkillUnitPath(path: string): string | undefined {
  const segments = path.split("/");
  if (segments.length !== 3 || segments[0] !== "skills" || !segments[1]?.startsWith("harnix-") || segments[2] !== "SKILL.md") {
    return undefined;
  }
  return `${segments[0]}/${segments[1]}`;
}

function getTargetState(states: ReadonlyMap<string, TargetState>, path: string): TargetState {
  const state = states.get(path);
  if (state === undefined) {
    throw new GlobalManagedManifestError("Missing global managed target state.");
  }
  return state;
}

function reconcileDesired(
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

function reconcileWholeFile(target: TargetState, item: PreparedDesired, previous: GlobalManagedEntry | undefined, restoreDeleted: boolean, result: GlobalManagedReconcileResult): GlobalManagedEntry | undefined {
  const label = entryLabel(item.entry);
  const desired = item.desired as DesiredGlobalFile;
  if (previous === undefined && target.unownedSkillUnit) {
    preserve(result, label, "untracked-collision", "A pre-existing Harnix-namespaced skill unit is not owned by Harnix.");
    return undefined;
  }
  if (target.current === undefined) {
    if (previous === undefined || restoreDeleted) {
      target.current = desired.content;
      pushUnique(result.created, label);
      return item.entry;
    }
    preserve(result, label, "deleted", "The previously-owned whole file is missing and was not restored.");
    return previous;
  }
  if (previous === undefined) {
    preserve(result, label, "untracked-collision", "A pre-existing whole file is not owned by Harnix.");
    return undefined;
  }
  if (sha256(target.current) !== previous.generatedHash) {
    preserve(result, label, "modified", "The Harnix-owned whole file was modified by the user.");
    return previous;
  }
  if (item.entry.generatedHash === previous.generatedHash) {
    pushUnique(result.unchanged, label);
    return item.entry;
  }
  target.current = desired.content;
  pushUnique(result.updated, label);
  return item.entry;
}

function reconcileManagedBlock(target: TargetState, item: PreparedDesired, previous: GlobalManagedEntry | undefined, restoreDeleted: boolean, result: GlobalManagedReconcileResult): GlobalManagedEntry | undefined {
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
  target.current = `${target.current.slice(0, located.start)}${fragment}${target.current.slice(located.end)}`;
  pushUnique(result.updated, label);
  return item.entry;
}

function reconcileJsonMember(target: TargetState, item: PreparedDesired, previous: GlobalManagedEntry | undefined, restoreDeleted: boolean, result: GlobalManagedReconcileResult): GlobalManagedEntry | undefined {
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
  const matches = array.map((candidate, index) => ({ candidate, index })).filter(({ candidate }) => matcher(candidate, desired.selector));
  if (matches.length > 1) {
    preserve(result, label, "duplicate-json-member", "Multiple JSON array members match the stable Harnix memberId.");
    return previous;
  }
  if (matches.length === 0) {
    if (previous !== undefined && desired.preserveIfUnmatched && array.length > 0) {
      preserve(result, label, "modified", "The previously-owned JSON member cannot be distinguished safely from edited or unrelated handlers.");
      return previous;
    }
    if (previous === undefined || restoreDeleted) {
      array.push(member);
      target.current = serializeJsonDocument(document);
      pushUnique(result.created, label);
      return item.entry;
    }
    preserve(result, label, "deleted", "The previously-owned JSON array member is missing and was not restored.");
    return previous;
  }
  const match = matches[0]!;
  if (previous === undefined) {
    preserve(result, label, "untracked-collision", "A pre-existing JSON array member matches the Harnix memberId but is not owned by Harnix.");
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
  array[match.index] = member;
  target.current = serializeJsonDocument(document);
  pushUnique(result.updated, label);
  return item.entry;
}

function removeObsoleteEntry(target: TargetState, entry: GlobalManagedEntry, result: GlobalManagedReconcileResult, jsonMemberMatcher: GlobalJsonMemberMatcher): boolean {
  const label = entryLabel(entry);
  if (entry.kind === "file") {
    if (target.current === undefined || sha256(target.current) === entry.generatedHash) {
      target.current = undefined;
      pushUnique(result.deleted, label);
      return true;
    }
    preserve(result, label, "modified", "The obsolete Harnix-owned whole file was modified by the user.");
    return false;
  }
  if (entry.kind === "managed-block") {
    const selector = entry.selector as MarkerSelector;
    if (target.current === undefined) {
      pushUnique(result.deleted, label);
      return true;
    }
    const located = locateManagedBlock(target.current, selector);
    if (located.kind !== "found") {
      preserve(result, label, located.kind === "malformed" ? "malformed-markers" : "modified", "The obsolete Harnix marker block cannot be removed safely.");
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
    preserve(result, label, "invalid-json-pointer", "The obsolete JSON array member pointer no longer resolves safely.");
    return false;
  }
  const matches = array.map((candidate, index) => ({ candidate, index })).filter(({ candidate }) => jsonMemberMatcher(candidate, selector));
  const match = matches[0];
  if (matches.length !== 1 || match === undefined || sha256(canonicalJson(match.candidate)) !== entry.generatedHash) {
    preserve(result, label, matches.length > 1 ? "duplicate-json-member" : "modified", "The obsolete Harnix JSON array member was modified or cannot be identified safely.");
    return false;
  }
  array.splice(match.index, 1);
  target.current = serializeJsonDocument(document);
  pushUnique(result.deleted, label);
  return true;
}

async function buildPlans(
  states: ReadonlyMap<string, TargetState>,
  manifestPath: string,
  manifestContent: string | undefined,
  manifestLabel: string,
  manifestOriginal: string | undefined,
): Promise<PlannedWrite[]> {
  const plans: PlannedWrite[] = [];
  for (const state of [...states.values()].sort((left, right) => left.relativePath.localeCompare(right.relativePath))) {
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

async function applyPlans(plans: readonly PlannedWrite[], writer: GlobalManagedWriter, remover: GlobalManagedRemover): Promise<void> {
  await applyTransaction(plans.map((plan) => ({ plan, writer, remover })));
}

async function applyTransaction(plans: readonly TransactionPlan[]): Promise<void> {
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
    throw new GlobalManagedTransactionError("Global managed reconciliation failed; attempted writes were rolled back conservatively.", rollback, error);
  }
}

async function assertSnapshotUnchangedImmediatelyBeforeApply(plan: PlannedWrite): Promise<void> {
  const current = await captureSnapshot(plan.path);
  if (!sameFileSnapshot(current, plan.snapshot)) {
    throw new GlobalManagedManifestError("A global managed target changed immediately before apply.");
  }
}

async function rollbackPlans(attempted: readonly TransactionPlan[]): Promise<{ restored: string[]; partial: string[] }> {
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

async function captureSnapshot(path: string): Promise<FileSnapshot> {
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

async function removeManagedFile(path: string): Promise<void> {
  await rm(path, { force: true });
}

function emptyResult(manifest: GlobalManagedManifestV1): GlobalManagedReconcileResult {
  return { manifest, created: [], updated: [], unchanged: [], preserved: [], deleted: [], warnings: [] };
}

function preserve(result: GlobalManagedReconcileResult, path: string, code: GlobalManagedWarning["code"], message: string): void {
  pushUnique(result.preserved, path);
  result.warnings.push({ code, path, message });
}

function entryLabel(entry: GlobalManagedEntry): string {
  return entry.kind === "file" ? entry.path : `${entry.path}#${entry.sourceId}`;
}

function entryKey(entry: Pick<GlobalManagedEntry, "path" | "sourceId">): string {
  return `${entry.path}\u0000${entry.sourceId}`;
}

function compareEntries(left: GlobalManagedEntry, right: GlobalManagedEntry): number {
  return entryKey(left).localeCompare(entryKey(right));
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
      throw new GlobalManagedManifestError("A global managed multi-root transaction must not reconcile one sidecar twice.");
    }
    targets.add(target);
  }
}

function sameEntryShape(left: GlobalManagedEntry, right: GlobalManagedEntry): boolean {
  return left.path === right.path && left.sourceId === right.sourceId && left.kind === right.kind && selectorKey(left.selector) === selectorKey(right.selector);
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

function serializeManifest(manifest: GlobalManagedManifestV1): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

async function readOptionalText(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error: unknown) {
    if (isMissingPathError(error)) {
      return undefined;
    }
    throw error;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error: unknown) {
    if (isMissingPathError(error)) {
      return false;
    }
    throw error;
  }
}

async function rootContainsOnlyOwnedLock(root: UserPathRoot, lockPath: string | undefined, lockContent: string | undefined): Promise<boolean> {
  if (lockPath === undefined || lockContent === undefined || lockPath.includes("/")) {
    return false;
  }
  const normalizedLockPath = normalizeGlobalPath(lockPath);
  const absoluteLockPath = await resolveSafeGlobalPath(root, normalizedLockPath);
  try {
    const entries = await readdir(root.path);
    return entries.length === 1 && entries[0] === normalizedLockPath && await readFile(absoluteLockPath, "utf8") === lockContent;
  } catch (error: unknown) {
    if (isMissingPathError(error)) {
      return false;
    }
    throw error;
  }
}

function matchesExpectedOutput(current: string | undefined, output: string | undefined): boolean {
  return current === output;
}

function matchesSnapshot(current: string | undefined, snapshot: FileSnapshot): boolean {
  return snapshot.exists ? current === snapshot.content : current === undefined;
}

function sameFileSnapshot(left: FileSnapshot, right: FileSnapshot): boolean {
  return left.exists === right.exists
    && (!left.exists || (left.content === right.content && left.mode === right.mode));
}

function normalizeGlobalPath(value: string): string {
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

function isMissingPathError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isGlobalPlatform(value: unknown): value is GlobalPlatform {
  return value === "kiro" || value === "antigravity-desktop" || value === "antigravity-cli" || value === "codex";
}

function isGlobalManagedKind(value: string): value is GlobalManagedKind {
  return value === "file" || value === "managed-block" || value === "json-member";
}

function isNonEmptyText(value: string): boolean {
  return value.trim().length > 0 && !/[\0\r\n]/u.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pushUnique(values: string[], value: string): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}
