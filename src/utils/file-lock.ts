import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, isAbsolute, resolve, win32 } from "node:path";

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

export interface FileLockFileSystem {
  mkdir(directory: string, options: { recursive: true }): Promise<unknown>;
  readFile(path: string, encoding: "utf8"): Promise<string>;
  rm(path: string, options: { force: true }): Promise<void>;
  stat(path: string): Promise<{ mtimeMs: number }>;
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

// Node has no portable API to query another process's creation time. Keep our
// own value stable so a same-PID re-entry can be verified; foreign PIDs remain
// `unknown` unless the host injects a platform-specific inspector.
const currentProcessIdentity: FileLockProcessIdentity = Object.freeze({
  pid: process.pid,
  startedAt: new Date(Date.now() - process.uptime() * 1_000).toISOString(),
});

const defaultFilesystem: FileLockFileSystem = {
  mkdir: async (directory, options) => mkdir(directory, options),
  readFile: async (path, encoding) => readFile(path, encoding),
  rm: async (path, options) => rm(path, options),
  stat: async (path) => stat(path),
  writeFile: async (path, content, options) => writeFile(path, content, options),
};

/**
 * Acquires an exclusive Harnix-owned lock. A dead owner or an old partial write
 * can be reclaimed; a live or identity-unknown owner is never removed by this
 * process. Foreign PID start times are unavailable by default, so callers that
 * need PID-reuse detection can inject a platform-specific inspector.
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
    ?? ((record: HarnixFileLockRecord) => inspectOwner(record, options.processIdentityInspector ?? defaultProcessIdentityInspector));
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
    try {
      await filesystem.writeFile(path, serialized, { encoding: "utf8", flag: "wx" });
      return { path, record, release: async () => releaseOwnedLock(filesystem, path, serialized) };
    } catch (error: unknown) {
      if (!isAlreadyExists(error)) throw error;
    }

    const state = await inspectExistingLock(path, filesystem, clock, staleAfterMs, ownerInspector);
    if (state === "reclaim") {
      await filesystem.rm(path, { force: true });
      continue;
    }
    if (state === "invalid") throw new InvalidHarnixFileLockError("The existing Harnix lock is invalid and not stale.");
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

async function inspectExistingLock(
  path: string,
  filesystem: FileLockFileSystem,
  clock: FileLockClock,
  staleAfterMs: number,
  ownerInspector: (record: HarnixFileLockRecord) => Promise<FileLockOwnerState>,
): Promise<"wait" | "reclaim" | "invalid"> {
  let source: string;
  try {
    source = await filesystem.readFile(path, "utf8");
  } catch (error: unknown) {
    if (isMissing(error)) return "wait";
    throw error;
  }

  let record: HarnixFileLockRecord;
  try {
    record = parseHarnixFileLockRecord(JSON.parse(source));
  } catch {
    const metadata = await filesystem.stat(path);
    return clock.now() - metadata.mtimeMs >= staleAfterMs ? "reclaim" : "invalid";
  }

  return (await ownerInspector(record)) === "dead" ? "reclaim" : "wait";
}

async function releaseOwnedLock(filesystem: FileLockFileSystem, path: string, serializedRecord: string): Promise<void> {
  try {
    if (await filesystem.readFile(path, "utf8") !== serializedRecord) return;
    await filesystem.rm(path, { force: true });
  } catch (error: unknown) {
    if (!isMissing(error)) throw error;
  }
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
  return typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST";
}

function isMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
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
