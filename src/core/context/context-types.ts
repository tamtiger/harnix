import type { ContextSelectionChangeKind } from "./selection-freshness.js";

export interface ContextEntry {
  path: string;
  reason: string;
  priority: number;
  pinned: boolean;
  states: string[];
  contentHash?: string;
}

export interface ContextManifest {
  generator: "harnix";
  schemaVersion: 1;
  taskId: string;
  maxCharacters: number;
  entries: ContextEntry[];
  omitted: Array<{ path: string; reason: "budget" | "duplicate" | "missing" | "unsafe" }>;
}

export interface ContextSignals {
  taskId?: string;
  references?: string[];
  activePaths?: string[];
  languages?: string[];
  technologies?: string[];
  guides?: string[];
}

/** Entries under `prefixes`, and any file of at least `minCharacters`, are listed as a pointer instead of pasted. */
export interface ContextPointerOptions {
  prefixes: readonly string[];
  minCharacters: number;
}

export const GUIDE_POINTER_PREFIX = ".harnix/spec/guides/";
export const POINTER_MIN_CHARACTERS = 1500;
export const MAX_POINTER_READ_BYTES = 1_048_576;

export const pointerLine = (characters: number): string =>
  `(pointer, ${characters} characters; read it when it matches the files you change)`;

export type ContextState = "not-recorded" | "current" | "stale";
export type ContextChangeKind = "changed" | "missing" | "unreadable" | "unverified";

export interface ContextChange {
  path: string;
  kind: ContextChangeKind;
}

export interface ContextDrift {
  state: ContextState;
  changes: ContextChange[];
  selectionChanges: ContextSelectionChangeKind[];
}

export interface ContextDriftDependencies {
  readFile?: (path: string) => Promise<string>;
  resolvePath?: (projectRoot: string, repositoryPath: string) => Promise<string>;
}
