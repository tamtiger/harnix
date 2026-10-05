import { join } from "node:path";
import type {
  FileLockClock,
  FileLockFileSystem,
  FileLockOwnerState,
  FileLockProcessIdentity,
  FileLockProcessIdentityInspector,
  FileLockStats,
  HarnixFileLockRecord,
} from "./file-lock.js";
import { parseHarnixFileLockRecord } from "./file-lock.js";
import { formatInstant } from "./clock.js";

export interface ObservedLockToken {
  readonly name: string;
  readonly path: string;
  readonly source: string;
}

export type ExistingLockInspection =
  { action: "wait" } | { action: "invalid"; reason: string } | { action: "reclaim"; tokens: ObservedLockToken[] };

export const lockRecordNamePattern =
  /^owner-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.json$/u;

export const currentProcessIdentity: FileLockProcessIdentity = Object.freeze({
  pid: process.pid,
  startedAt: formatInstant(Date.now() - process.uptime() * 1_000),
});

export function defaultProcessIdentity(): FileLockProcessIdentity {
  return currentProcessIdentity;
}

// eslint-disable-next-line @typescript-eslint/require-await -- satisfies the async process-identity inspector signature
export async function defaultProcessIdentityInspector(pid: number): Promise<FileLockProcessIdentity | undefined> {
  return pid === currentProcessIdentity.pid ? currentProcessIdentity : undefined;
}

export function isLockRecordName(value: string): boolean {
  return lockRecordNamePattern.test(value);
}

export async function inspectOwner(
  record: HarnixFileLockRecord,
  processIdentityInspector: FileLockProcessIdentityInspector,
): Promise<FileLockOwnerState> {
  try {
    process.kill(record.ownerPid, 0);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ESRCH"
    ) {
      return "dead";
    }
    return "unknown";
  }
  try {
    const identity = await processIdentityInspector(record.ownerPid);
    if (identity === undefined || !isValidProcessIdentity(identity) || identity.pid !== record.ownerPid) {
      return "unknown";
    }
    return Date.parse(identity.startedAt) === Date.parse(record.processStartedAt) ? "alive" : "dead";
  } catch {
    return "unknown";
  }
}

export async function inspectExistingLock(
  path: string,
  filesystem: FileLockFileSystem,
  clock: FileLockClock,
  staleAfterMs: number,
  ownerInspector: (record: HarnixFileLockRecord) => Promise<FileLockOwnerState>,
): Promise<ExistingLockInspection> {
  let directoryMetadata: FileLockStats;
  try {
    directoryMetadata = await filesystem.lstat(path);
  } catch (error: unknown) {
    if (isMissing(error)) return { action: "wait" };
    throw error;
  }
  if (!directoryMetadata.isDirectory() || directoryMetadata.isSymbolicLink()) {
    return {
      action: "invalid",
      reason: "The existing Harnix lock uses an unsupported or unsafe non-directory format.",
    };
  }

  let entries: string[];
  try {
    entries = await filesystem.readdir(path);
  } catch (error: unknown) {
    if (isLockChanging(error)) return { action: "wait" };
    throw error;
  }
  if (entries.length === 0) {
    return clock.now() - directoryMetadata.mtimeMs >= staleAfterMs
      ? { action: "reclaim", tokens: [] }
      : { action: "wait" };
  }
  if (entries.some((name) => !isLockRecordName(name))) {
    return { action: "invalid", reason: "The existing Harnix lock directory contains an unrecognized entry." };
  }

  const tokens: ObservedLockToken[] = [];
  for (const name of [...entries].sort()) {
    const tokenPath = join(path, name);
    let tokenMetadata: FileLockStats;
    let source: string;
    try {
      tokenMetadata = await filesystem.lstat(tokenPath);
      if (!tokenMetadata.isFile() || tokenMetadata.isSymbolicLink()) {
        return { action: "invalid", reason: "The existing Harnix lock owner token is invalid." };
      }
      source = await filesystem.readFile(tokenPath, "utf8");
    } catch (error: unknown) {
      if (isLockChanging(error)) return { action: "wait" };
      throw error;
    }

    let existingRecord: HarnixFileLockRecord;
    try {
      existingRecord = parseHarnixFileLockRecord(JSON.parse(source));
    } catch {
      if (clock.now() - tokenMetadata.mtimeMs < staleAfterMs) return { action: "wait" };
      tokens.push({ name, path: tokenPath, source });
      continue;
    }
    if ((await ownerInspector(existingRecord)) !== "dead") return { action: "wait" };
    tokens.push({ name, path: tokenPath, source });
  }
  return { action: "reclaim", tokens };
}

export async function isSoleOwnedToken(
  filesystem: FileLockFileSystem,
  path: string,
  recordName: string,
  serializedRecord: string,
): Promise<boolean> {
  try {
    const entries = await filesystem.readdir(path);
    return (
      entries.length === 1 &&
      entries[0] === recordName &&
      (await filesystem.readFile(join(path, recordName), "utf8")) === serializedRecord
    );
  } catch (error: unknown) {
    if (isMissing(error) || isNotDirectory(error)) return false;
    throw error;
  }
}

export async function removeObservedLock(
  filesystem: FileLockFileSystem,
  path: string,
  tokens: readonly ObservedLockToken[],
): Promise<boolean> {
  for (const token of tokens) {
    try {
      if ((await filesystem.readFile(token.path, "utf8")) !== token.source) return false;
      await filesystem.rm(token.path, { force: true });
    } catch (error: unknown) {
      if (!isMissing(error) && !isNotDirectory(error)) throw error;
    }
  }
  return removeEmptyLockDirectory(filesystem, path);
}

export async function removeOwnedToken(
  filesystem: FileLockFileSystem,
  path: string,
  token: ObservedLockToken,
): Promise<boolean> {
  try {
    const source = await filesystem.readFile(token.path, "utf8");
    if (source !== token.source) return false;
    await filesystem.rm(token.path, { force: true });
  } catch (error: unknown) {
    if (!isMissing(error) && !isNotDirectory(error)) throw error;
  }
  return removeEmptyLockDirectory(filesystem, path);
}

export async function removeEmptyLockDirectory(filesystem: FileLockFileSystem, path: string): Promise<boolean> {
  try {
    await filesystem.rmdir(path);
    return true;
  } catch (error: unknown) {
    if (isMissing(error)) return true;
    if (isNotDirectory(error) || isDirectoryNotEmpty(error)) return false;
    throw error;
  }
}

export function isAlreadyExists(error: unknown): boolean {
  return hasErrorCode(error, "EEXIST");
}

export function isCandidateLost(error: unknown): boolean {
  return isMissing(error) || isNotDirectory(error) || isAlreadyExists(error);
}

export function isMissing(error: unknown): boolean {
  return hasErrorCode(error, "ENOENT");
}

/**
 * Windows reports EPERM or EBUSY, not ENOENT, for a file whose deletion is pending or that another process is
 * releasing right now. The holder is mid-release, so the lock is changing: wait and look again (the acquire timeout
 * still bounds the wait, so a genuine permission problem ends as a lock timeout rather than being retried forever).
 */
export function isReleasePending(error: unknown): boolean {
  return hasErrorCode(error, "EPERM") || hasErrorCode(error, "EBUSY");
}

/** The lock vanished or its holder is releasing it right now, so the caller should wait and look again. */
function isLockChanging(error: unknown): boolean {
  return isMissing(error) || isNotDirectory(error) || isReleasePending(error);
}

export function isNotDirectory(error: unknown): boolean {
  return hasErrorCode(error, "ENOTDIR");
}

export function isDirectoryNotEmpty(error: unknown): boolean {
  return hasErrorCode(error, "ENOTEMPTY") || hasErrorCode(error, "EEXIST");
}

export function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === code;
}

export function isValidProcessIdentity(value: FileLockProcessIdentity): boolean {
  return Number.isInteger(value.pid) && value.pid > 0 && isIsoDate(value.startedAt);
}

export function isIsoDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}
