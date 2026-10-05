import { randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, readdir, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve, win32 } from "node:path";

import { formatInstant } from "./clock.js";
import {
  defaultProcessIdentity,
  defaultProcessIdentityInspector,
  inspectExistingLock,
  inspectOwner,
  isCandidateLost,
  isLockRecordName,
  isSoleOwnedToken,
  isValidProcessIdentity,
  removeObservedLock,
  removeOwnedToken,
} from "./file-lock-inspect.js";
import { packageVersion } from "src/version.js";

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

const systemClock: FileLockClock = {
  now: () => Date.now(),
  sleep: async (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds)),
};

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
interface LockContext {
  path: string;
  clock: FileLockClock;
  filesystem: FileLockFileSystem;
  retryDelayMs: number;
  staleAfterMs: number;
  ownerInspector: (existingRecord: HarnixFileLockRecord) => Promise<FileLockOwnerState>;
  record: HarnixFileLockRecord;
  serialized: string;
  deadline: number;
  timeoutMs: number;
}

function buildLockContext(lockPath: string, options: FileLockOptions): LockContext {
  if (!isAbsolutePath(lockPath)) throw new FileLockError("A lock path must be absolute.");
  assertDuration("timeoutMs", options.timeoutMs ?? 30_000, 0);
  assertDuration("retryDelayMs", options.retryDelayMs ?? 50, 1);
  assertDuration("staleAfterMs", options.staleAfterMs ?? 300_000, 1);

  const path = resolve(lockPath);
  const clock = options.clock ?? systemClock;
  const filesystem = options.filesystem ?? defaultFilesystem;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const retryDelayMs = options.retryDelayMs ?? 50;
  const staleAfterMs = options.staleAfterMs ?? 300_000;
  const processIdentity = options.processIdentity ?? defaultProcessIdentity;
  const ownerInspector =
    options.ownerInspector ??
    ((existingRecord: HarnixFileLockRecord) =>
      inspectOwner(existingRecord, options.processIdentityInspector ?? defaultProcessIdentityInspector));
  const operationId = options.operationId ?? randomUUID();
  if (operationId.trim().length === 0 || operationId.includes("\0"))
    throw new FileLockError("operationId must be non-empty and safe.");

  const identity = processIdentity();
  if (!isValidProcessIdentity(identity)) {
    throw new FileLockError("The current process identity is invalid.");
  }
  const record: HarnixFileLockRecord = {
    acquiredAt: formatInstant(clock.now()),
    generator: "harnix",
    generatorVersion: packageVersion,
    operationId,
    ownerPid: identity.pid,
    processStartedAt: identity.startedAt,
    schemaVersion: 1,
  };
  const serialized = `${JSON.stringify(record)}\n`;
  const deadline = clock.now() + timeoutMs;
  return {
    path,
    clock,
    filesystem,
    retryDelayMs,
    staleAfterMs,
    ownerInspector,
    record,
    serialized,
    deadline,
    timeoutMs,
  };
}

export async function acquireHarnixFileLock(lockPath: string, options: FileLockOptions = {}): Promise<HarnixFileLock> {
  const ctx = buildLockContext(lockPath, options);
  await ctx.filesystem.mkdir(dirname(ctx.path), { recursive: true });

  while (true) {
    if (await tryCreateLockDirectory(ctx.filesystem, ctx.path)) {
      const lock = await tryInstallLockToken(ctx.filesystem, ctx.path, ctx.record, ctx.serialized);
      if (lock !== undefined) return lock;
    } else {
      if (await handleExistingLock(ctx.path, ctx.filesystem, ctx.clock, ctx.staleAfterMs, ctx.ownerInspector)) continue;
    }

    const remaining = ctx.deadline - ctx.clock.now();
    if (remaining <= 0) throw new FileLockTimeoutError(`Timed out waiting for Harnix lock: ${ctx.path}`);
    const jitter = Math.floor(Math.random() * 20);
    await ctx.clock.sleep(Math.min(ctx.retryDelayMs + jitter, remaining));
  }
}

async function tryCreateLockDirectory(filesystem: FileLockFileSystem, path: string): Promise<boolean> {
  try {
    await filesystem.mkdir(path, { recursive: false });
    return true;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "EEXIST"
    ) {
      return false;
    }
    throw error;
  }
}

async function tryInstallLockToken(
  filesystem: FileLockFileSystem,
  path: string,
  record: HarnixFileLockRecord,
  serialized: string,
): Promise<HarnixFileLock | undefined> {
  const recordName = `owner-${randomUUID()}.json`;
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
        release: async () => {
          await removeOwnedToken(filesystem, path, { name: recordName, path: recordPath, source: serialized });
        },
      };
    }
  } catch (error: unknown) {
    candidateFailed = true;
    candidateError = error;
  }
  await removeOwnedToken(filesystem, path, { name: recordName, path: recordPath, source: serialized });
  if (candidateFailed && !isCandidateLost(candidateError)) throw candidateError;
  return undefined;
}

async function handleExistingLock(
  path: string,
  filesystem: FileLockFileSystem,
  clock: FileLockClock,
  staleAfterMs: number,
  ownerInspector: (record: HarnixFileLockRecord) => Promise<FileLockOwnerState>,
): Promise<boolean> {
  const inspection = await inspectExistingLock(path, filesystem, clock, staleAfterMs, ownerInspector);
  if (inspection.action === "reclaim") {
    return removeObservedLock(filesystem, path, inspection.tokens);
  }
  if (inspection.action === "invalid") throw new InvalidHarnixFileLockError(inspection.reason);
  return false;
}

export function parseHarnixFileLockRecord(value: unknown): HarnixFileLockRecord {
  if (
    !isRecord(value) ||
    value.generator !== "harnix" ||
    value.schemaVersion !== 1 ||
    typeof value.generatorVersion !== "string" ||
    value.generatorVersion.length === 0 ||
    typeof value.ownerPid !== "number" ||
    !Number.isInteger(value.ownerPid) ||
    value.ownerPid <= 0 ||
    typeof value.processStartedAt !== "string" ||
    !isIsoDate(value.processStartedAt) ||
    typeof value.acquiredAt !== "string" ||
    !isIsoDate(value.acquiredAt) ||
    typeof value.operationId !== "string" ||
    value.operationId.length === 0
  ) {
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

function assertDuration(name: string, value: number, minimum: number): void {
  if (!Number.isFinite(value) || value < minimum) throw new FileLockError(`${name} must be at least ${minimum}.`);
}

function isAbsolutePath(path: string): boolean {
  return isAbsolute(path) || win32.isAbsolute(path);
}

function isIsoDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
