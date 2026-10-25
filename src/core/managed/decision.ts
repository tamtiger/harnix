import { sha256 } from "src/utils/hashing.js";

/**
 * The single ownership decision table for a whole Harnix-managed file. The project reconciler and
 * the global (user-home) reconciler differ only in how they read, write and report; both ask this
 * module what to do so the two never drift apart.
 */
export type WholeFileDecision = "create" | "keep-deleted" | "collision" | "keep-modified" | "unchanged" | "update";

export interface WholeFileInput {
  /** Current file text, or undefined when the file does not exist. */
  readonly current: string | undefined;
  /** Hash recorded when Harnix last wrote the file, or undefined when Harnix never owned it. */
  readonly previousHash: string | undefined;
  readonly desiredHash: string;
  readonly restoreDeleted: boolean;
}

export function decideWholeFile(input: WholeFileInput): WholeFileDecision {
  if (input.current === undefined) {
    return input.previousHash === undefined || input.restoreDeleted ? "create" : "keep-deleted";
  }
  if (input.previousHash === undefined) return "collision";
  if (sha256(input.current) !== input.previousHash) return "keep-modified";
  return input.desiredHash === input.previousHash ? "unchanged" : "update";
}

export type ObsoleteFileDecision = "remove" | "keep-modified" | "missing";

/** An owned file that is no longer desired: only content still matching the owned hash may be removed. */
export function decideObsoleteFile(current: string | undefined, previousHash: string): ObsoleteFileDecision {
  if (current === undefined) return "missing";
  return sha256(current) === previousHash ? "remove" : "keep-modified";
}
