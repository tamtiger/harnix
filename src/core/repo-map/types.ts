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
}

export interface RepoMapV1 {
  generator: "harnix";
  schemaVersion: 1;
  extractorVersion: 1;
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
  outline: Pick<RepoMapRecordV1, "extension" | "packagePath" | "language" | "kind" | "identifiers" | "headings" | "importTargets">;
}

export type RepoMapRankerVersion = 1 | 2;
export interface RepoMapRankingOptions { rankerVersion?: RepoMapRankerVersion | undefined; }
