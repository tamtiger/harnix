export type RepoMapFileKind = "source" | "test" | "manifest" | "config" | "documentation" | "script" | "other";

export interface RepoMapRecordV1 {
  path: string;
  contentHash: string;
  byteLength: number;
  extension: string;
  packagePath: string;
  language?: string | undefined;
  kind: RepoMapFileKind;
  identifiers: string[];
  headings: string[];
  importTargets: string[];
  /** Names this file uses that are declared in one to four other files; filled in after every file is extracted. */
  references?: string[] | undefined;
}

export interface RepoMapV1 {
  generator: "harnix";
  schemaVersion: 1;
  extractorVersion: 2;
  inventoryFingerprint: string;
  records: RepoMapRecordV1[];
}

export interface RepoMapLimits {
  maxBytesPerFile: number;
  maxFiles: number;
  maxTotalBytes: number;
  concurrency: number;
}

export const defaultRepoMapLimits: RepoMapLimits = Object.freeze({
  concurrency: 16,
  maxBytesPerFile: 1_048_576,
  maxFiles: 10_000,
  maxTotalBytes: 52_428_800,
});

export interface RepoMapInventoryFile {
  path: string;
  absolutePath: string;
  byteLength: number;
  /** Modification time from the inventory stat; used only to judge freshness and never stored in the cache. */
  mtimeMs?: number;
}

export interface RepoMapInventory {
  files: RepoMapInventoryFile[];
  skipped: string[];
}

export interface RepoMapQuerySignals {
  taskTerms?: readonly string[] | undefined;
  relevantPaths?: readonly string[] | undefined;
  packagePath?: string | undefined;
  languages?: readonly string[] | undefined;
  technologies?: readonly string[] | undefined;
}

export interface RepoMapQueryResult {
  path: string;
  score: number;
  reasons: string[];
  outline: Pick<
    RepoMapRecordV1,
    "extension" | "packagePath" | "language" | "kind" | "identifiers" | "headings" | "importTargets"
  >;
}

export type ContainerKind = "class" | "interface" | "enum" | "struct" | "record" | "namespace";
export type RepoMapSymbolKind = ContainerKind | "function" | "method" | "type" | "const" | "variable" | "heading";

export interface RepoMapSymbolOutlineV1 {
  /** Source lines from `startLine` to `endLine`, secret-looking lines hidden; present with `--body`. */
  readonly body?: readonly string[];
  /** True when the shared line cap cut this body short. */
  readonly bodyTruncated?: boolean;
  readonly name: string;
  readonly kind: RepoMapSymbolKind;
  readonly exported: boolean;
  readonly startLine: number;
  readonly endLine: number;
  readonly signature: string;
  readonly container?: string;
}

export interface RepoMapOutlineOptions {
  readonly target: string;
  readonly symbol?: string;
  readonly limit: number;
  /** Add the source lines of each matched symbol (needs `symbol`). */
  readonly body?: boolean;
}

export interface RepoMapOutlineResultV1 {
  readonly hint?: string;
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly scope: "project";
  readonly status: "ready" | "not-found" | "skipped";
  readonly target: string;
  readonly language?: string;
  readonly symbolFilter?: string;
  readonly limit: number;
  readonly symbols: readonly RepoMapSymbolOutlineV1[];
  readonly truncated: boolean;
}

/** One place for the per-record name-list caps shared by extraction and cache validation. */
export const repoMapRecordLimits = Object.freeze({
  headings: Object.freeze({ count: 16, length: 120 }),
  identifiers: Object.freeze({ count: 128, length: 96 }),
  importTargets: Object.freeze({ count: 32, length: 160 }),
  references: Object.freeze({ count: 48, length: 96 }),
});

/** Shown with a missing or unreadable cache, so the caller knows the one command that fixes it. */
export const repoMapRefreshHint = "run harnix repo-map --refresh";
