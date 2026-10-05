import type { GlobalPlatformId } from "src/core/platform/registry.js";
import { type UserPathRoot } from "src/core/platform/user-paths.js";

export type GlobalPlatform = GlobalPlatformId;

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
  /** Returns a reason when appending the block to this existing file would corrupt it; the file is then left alone. */
  conflictCheck?: (current: string) => string | undefined;
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
  code:
    | "untracked-collision"
    | "modified"
    | "malformed-markers"
    | "invalid-json"
    | "invalid-json-pointer"
    | "duplicate-json-member"
    | "manifest-conflict"
    | "deleted";
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
  /** Unique owner-token filename inside the lock directory. */
  ownedRootLockRecordName?: string;
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

export interface PreparedDesired {
  desired: DesiredGlobalManagedFile;
  entry: GlobalManagedEntry;
}

export interface TargetState {
  relativePath: string;
  absolutePath: string;
  original: string | undefined;
  current: string | undefined;
  unownedSkillUnit?: boolean;
}

export interface FileSnapshot {
  exists: boolean;
  content?: string;
  mode?: number;
}

export interface PlannedWrite {
  path: string;
  label: string;
  output: string | undefined;
  snapshot: FileSnapshot;
}

export interface PlannedGlobalReconciliation {
  options: ReconcileGlobalManagedFilesOptions;
  result: GlobalManagedReconcileResult;
  plans: PlannedWrite[];
}

export interface TransactionPlan {
  plan: PlannedWrite;
  writer: GlobalManagedWriter;
  remover: GlobalManagedRemover;
}

export interface LoadedGlobalManifest {
  manifest: GlobalManagedManifestV1;
  content: string | undefined;
}

export { GlobalManagedManifestError } from "src/core/global/managed-error.js";

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
