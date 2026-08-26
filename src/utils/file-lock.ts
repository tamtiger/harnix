import { randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, readdir, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve, win32 } from "node:path";

import { packageVersion } from "../version.js";

export interface HarnixFileLockRecord {
  generator: "harnix";
  schemaVersion: 1;
  generatorVersion: string;
  ownerPid: number;
  processStartedAt: string;
  acquiredAt: string;
  operationId: string;
}

export interface HarnixFileLockSnapshot {
  readonly record: HarnixFileLockRecord;
  readonly recordName: string;
  readonly source: string;
}

export type FileLockOwnerState = "alive" | "dead" | "unknown";

export interface FileLockProcessIdentity {
  readonly pid: number;
  readonly startedAt: string;
}

/**
 * Resolves a process start identity for a PID. Returning undefined means the
 * platform cannot prove whether that PID was reused, so the lock remains
 * conservatively owned rather than being reclaimed.
 */
export type FileLockProcessIdentityInspector = (pid: number) => Promise<FileLockProcessIdentity | undefined>;

export interface FileLockClock {
  now(): number;
  sleep(milliseconds: number): Promise<void>;
}

export interface FileLockStats {
  readonly mtimeMs: number;
  isDirectory(): boolean;
  isFile(): boolean;
  isSymbolicLink(): boolean;
}

export interface FileLockFileSystem {
  lstat(path: string): Promise<FileLockStats>;
  mkdir(directory: string, options: { recursive: boolean }): Promise<unknown>;
  readFile(path: string, encoding: "utf8"): Promise<string>;
  readdir(path: string): Promise<string[]>;
  rm(path: string, options: { force: true }): Promise<void>;
  rmdir(path: string): Promise<void>;
  writeFile(path: string, content: string, options: { encoding: "utf8"; flag: "wx" }): Promise<void>;
}

export interface FileLockOptions {
  clock?: FileLockClock | undefined;
  filesystem?: FileLockFileSystem | undefined;
  operationId?: string | undefined;
  ownerInspector?: ((record: HarnixFileLockRecord) => Promise<FileLockOwnerState>) | undefined;
  processIdentity?: (() => FileLockProcessIdentity) | undefined;
  processIdentityInspector?: FileLockProcessIdentityInspector | undefined;
  retryDelayMs?: number | undefined;
  staleAfterMs?: number | undefined;
  timeoutMs?: number | undefined;
}

export interface HarnixFileLock {
  readonly path: string;
  readonly recordPath: string;
  readonly record: HarnixFileLockRecord;
  release(): Promise<void>;
}

export class FileLockError extends Error {
  override name = "FileLockError";
}

export class FileLockTimeoutError extends FileLockError {
  override name = "FileLockTimeoutError";
}

export class InvalidHarnixFileLockError extends FileLockError {
  override name = "InvalidHarnixFileLockError";
}

interface ObservedLockToken {
  readonly name: string;
  readonly path: string;
  readonly source: string;
}

type ExistingLockInspection =
  | { action: "wait" }
  | { action: "invalid"; reason: string }
  | { action: "reclaim"; tokens: ObservedLockToken[] };

const lockRecordNamePattern = /^owner-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.json$/u;

const systemClock: FileLockClock = {
  now: () => Date.now(),
  sleep: async (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds)),
};

// Node has no portable API to query another process's creation time. Keep our
// own value stable so a same-PID re-entry can be verified; foreign PIDs remain
// `unknown` unless the host injects a platform-specific inspector.
const currentProcessIdentity: FileLockProcessIdentity = Object.freeze({
  pid: process.pid,
  startedAt: new Date(Date.now() - process.uptime() * 1_000).toISOString(),
});

const defaultFilesystem: FileLockFileSystem = {
  lstat: async (path) => lstat(path),
  mkdir: async (directory, options) => mkdir(directory, options),
  readFile: async (path, encoding) => readFile(path, encoding),
  readdir: async (path) => readdir(path),
  rm: async (path, options) => rm(path, options),
  rmdir: async (path) => rmdir(path),
  writeFile: async (path, content, options) => writeFile(path, content, options),
};

/**
 * Acquires an exclusive Harnix-owned lock directory. The canonical directory
 * is created with mkdir and contains one unique owner-token record. Ownership
 * is returned only after the token is verified as the directory's sole entry.
 */
export async function acquireHarnixFileLock(lockPath: string, options: FileLockOptions = {}): Promise<HarnixFileLock> {
  if (!isAbsolutePath(lockPath)) throw new FileLockError("A lock path must be absolute.");
  assertDuration("timeoutMs", options.timeoutMs ?? 5_000, 0);
  assertDuration("retryDelayMs", options.retryDelayMs ?? 50, 1);
  assertDuration("staleAfterMs", options.staleAfterMs ?? 300_000, 1);

  const path = resolve(lockPath);
  const clock = options.clock ?? systemClock;
  const filesystem = options.filesystem ?? defaultFilesystem;
  const timeoutMs = options.timeoutMs ?? 5_000;
  const retryDelayMs = options.retryDelayMs ?? 50;
  const staleAfterMs = options.staleAfterMs ?? 300_000;
  const processIdentity = options.processIdentity ?? defaultProcessIdentity;
  const ownerInspector = options.ownerInspector
    ?? ((existingRecord: HarnixFileLockRecord) => inspectOwner(existingRecord, options.processIdentityInspector ?? defaultProcessIdentityInspector));
  const operationId = options.operationId ?? randomUUID();
  if (operationId.trim().length === 0 || operationId.includes("\0")) throw new FileLockError("operationId must be non-empty and safe.");

  const identity = processIdentity();
  if (!isValidProcessIdentity(identity)) {
    throw new FileLockError("The current process identity is invalid.");
  }
  const record: HarnixFileLockRecord = {
    acquiredAt: new Date(clock.now()).toISOString(),
    generator: "harnix",
    generatorVersion: packageVersion,
    operationId,
    ownerPid: identity.pid,
    processStartedAt: identity.startedAt,
    schemaVersion: 1,
  };
  const serialized = `${JSON.stringify(record)}\n`;
  const deadline = clock.now() + timeoutMs;
  await filesystem.mkdir(dirname(path), { recursive: true });

  while (true) {
    let candidateCreated = false;
    try {
      await filesystem.mkdir(path, { recursive: false });
      candidateCreated = true;
    } catch (error: unknown) {
      if (!isAlreadyExists(error)) throw error;
    }

    if (candidateCreated) {
      const recordName = createLockRecordName();
      const recordPath = join(path, recordName);
      let candidateFailed = false;
      let candidateError: unknown;
      try {
        await filesystem.writeFile(recordPath, serialized, { encoding: "utf8", flag: "wx" });
        if (await isSoleOwnedToken(filesystem, path, recordName, serialized)) {
          return {
            path,
            recordPath,
            record,
            release: async () => { await removeOwnedToken(filesystem, path, { name: recordName, path: recordPath, source: serialized }); },
          };
        }
      } catch (error: unknown) {
        candidateFailed = true;
        candidateError = error;
      }
      await removeOwnedToken(filesystem, path, { name: recordName, path: recordPath, source: serialized });
      if (candidateFailed && !isCandidateLost(candidateError)) throw candidateError;
    } else {
      const inspection = await inspectExistingLock(path, filesystem, clock, staleAfterMs, ownerInspector);
      if (inspection.action === "reclaim") {
        if (await removeObservedLock(filesystem, path, inspection.tokens)) continue;
      }
      if (inspection.action === "invalid") throw new InvalidHarnixFileLockError(inspection.reason);
    }

    const remaining = deadline - clock.now();
    if (remaining <= 0) throw new FileLockTimeoutError(`Timed out waiting for Harnix lock: ${path}`);
    await clock.sleep(Math.min(retryDelayMs, remaining));
  }
}

export function parseHarnixFileLockRecord(value: unknown): HarnixFileLockRecord {
  if (!isRecord(value)
    || value.generator !== "harnix"
    || value.schemaVersion !== 1
    || typeof value.generatorVersion !== "string" || value.generatorVersion.length === 0
    || typeof value.ownerPid !== "number" || !Number.isInteger(value.ownerPid) || value.ownerPid <= 0
    || typeof value.processStartedAt !== "string" || !isIsoDate(value.processStartedAt)
    || typeof value.acquiredAt !== "string" || !isIsoDate(value.acquiredAt)
    || typeof value.operationId !== "string" || value.operationId.length === 0) {
    throw new InvalidHarnixFileLockError("Harnix lock record is invalid.");
  }
  return value as unknown as HarnixFileLockRecord;
}

/** Reads a stable lock-directory snapshot for setup ownership preflight. */
export async function readHarnixFileLockSnapshot(
  lockPath: string,
  filesystem: FileLockFileSystem = defaultFilesystem,
): Promise<HarnixFileLockSnapshot> {
  if (!isAbsolutePath(lockPath)) throw new FileLockError("A lock path must be absolute.");
  const path = resolve(lockPath);
  const metadata = await filesystem.lstat(path);
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new InvalidHarnixFileLockError("The Harnix lock path is not an owned lock directory.");
  }
  const entries = await filesystem.readdir(path);
  if (entries.length !== 1 || !isLockRecordName(entries[0]!)) {
    throw new InvalidHarnixFileLockError("The Harnix lock directory must contain exactly one owner token.");
  }
  const recordName = entries[0]!;
  const recordPath = join(path, recordName);
  const recordMetadata = await filesystem.lstat(recordPath);
  if (!recordMetadata.isFile() || recordMetadata.isSymbolicLink()) {
    throw new InvalidHarnixFileLockError("The Harnix lock owner token is invalid.");
  }
  const source = await filesystem.readFile(recordPath, "utf8");
  return { record: parseHarnixFileLockRecord(JSON.parse(source)), recordName, source };
}

async function inspectExistingLock(
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
    return { action: "invalid", reason: "The existing Harnix lock uses an unsupported or unsafe non-directory format." };
  }

  let entries: string[];
  try {
    entries = await filesystem.readdir(path);
  } catch (error: unknown) {
    if (isMissing(error) || isNotDirectory(error)) return { action: "wait" };
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
      if (isMissing(error) || isNotDirectory(error)) return { action: "wait" };
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
    if (await ownerInspector(existingRecord) !== "dead") return { action: "wait" };
    tokens.push({ name, path: tokenPath, source });
  }
  return { action: "reclaim", tokens };
}

async function isSoleOwnedToken(
  filesystem: FileLockFileSystem,
  path: string,
  recordName: string,
  serializedRecord: string,
): Promise<boolean> {
  try {
    const entries = await filesystem.readdir(path);
    return entries.length === 1
      && entries[0] === recordName
      && await filesystem.readFile(join(path, recordName), "utf8") === serializedRecord;
  } catch (error: unknown) {
    if (isMissing(error) || isNotDirectory(error)) return false;
    throw error;
  }
}

async function removeObservedLock(
  filesystem: FileLockFileSystem,
  path: string,
  tokens: readonly ObservedLockToken[],
): Promise<boolean> {
  for (const token of tokens) {
    try {
      if (await filesystem.readFile(token.path, "utf8") !== token.source) return false;
      await filesystem.rm(token.path, { force: true });
    } catch (error: unknown) {
      if (!isMissing(error) && !isNotDirectory(error)) throw error;
    }
  }
  return removeEmptyLockDirectory(filesystem, path);
}

async function removeOwnedToken(
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

async function removeEmptyLockDirectory(filesystem: FileLockFileSystem, path: string): Promise<boolean> {
  try {
    await filesystem.rmdir(path);
    return true;
  } catch (error: unknown) {
    if (isMissing(error)) return true;
    if (isNotDirectory(error) || isDirectoryNotEmpty(error)) return false;
    throw error;
  }
}

function createLockRecordName(): string {
  return `owner-${randomUUID()}.json`;
}

function isLockRecordName(value: string): boolean {
  return lockRecordNamePattern.test(value);
}

function defaultProcessIdentity(): FileLockProcessIdentity {
  return currentProcessIdentity;
}

async function defaultProcessIdentityInspector(pid: number): Promise<FileLockProcessIdentity | undefined> {
  return pid === currentProcessIdentity.pid ? currentProcessIdentity : undefined;
}

async function inspectOwner(record: HarnixFileLockRecord, processIdentityInspector: FileLockProcessIdentityInspector): Promise<FileLockOwnerState> {
  try {
    process.kill(record.ownerPid, 0);
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ESRCH") return "dead";
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

function assertDuration(name: string, value: number, minimum: number): void {
  if (!Number.isFinite(value) || value < minimum) throw new FileLockError(`${name} must be at least ${minimum}.`);
}

function isAbsolutePath(path: string): boolean {
  return isAbsolute(path) || win32.isAbsolute(path);
}

function isAlreadyExists(error: unknown): boolean {
  return hasErrorCode(error, "EEXIST");
}

function isCandidateLost(error: unknown): boolean {
  return isMissing(error) || isNotDirectory(error) || isAlreadyExists(error);
}

function isMissing(error: unknown): boolean {
  return hasErrorCode(error, "ENOENT");
}

function isNotDirectory(error: unknown): boolean {
  return hasErrorCode(error, "ENOTDIR");
}

function isDirectoryNotEmpty(error: unknown): boolean {
  return hasErrorCode(error, "ENOTEMPTY") || hasErrorCode(error, "EEXIST");
}

function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function isIsoDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function isValidProcessIdentity(value: FileLockProcessIdentity): boolean {
  return Number.isInteger(value.pid) && value.pid > 0 && isIsoDate(value.startedAt);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
