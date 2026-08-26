import { access, lstat, mkdir, readFile, readdir, rm, rmdir, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  FileLockTimeoutError,
  InvalidHarnixFileLockError,
  acquireHarnixFileLock,
  type FileLockClock,
  type FileLockFileSystem,
  type HarnixFileLockRecord,
} from "../../src/utils/file-lock.js";
import { packageVersion } from "../../src/version.js";
import { useTemporaryUserHomes } from "../support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-lock-home-");
const firstTokenName = "owner-00000000-0000-4000-8000-000000000001.json";
const secondTokenName = "owner-00000000-0000-4000-8000-000000000002.json";

function clockAt(initial: number): FileLockClock & { nowValue: () => number } {
  let now = initial;
  return {
    now: () => now,
    nowValue: () => now,
    sleep: async (milliseconds) => { now += milliseconds; },
  };
}

function record(overrides: Partial<HarnixFileLockRecord> = {}): HarnixFileLockRecord {
  return {
    acquiredAt: new Date(1_000).toISOString(),
    generator: "harnix",
    generatorVersion: "0.5.0",
    operationId: "stale-operation",
    ownerPid: 101,
    processStartedAt: new Date(500).toISOString(),
    schemaVersion: 1,
    ...overrides,
  };
}

async function writeLockDirectory(
  path: string,
  value: HarnixFileLockRecord | string,
  tokenName = firstTokenName,
): Promise<{ source: string; tokenPath: string }> {
  await mkdir(path, { recursive: true });
  const source = typeof value === "string" ? value : `${JSON.stringify(value)}\n`;
  const tokenPath = join(path, tokenName);
  await writeFile(tokenPath, source, "utf8");
  return { source, tokenPath };
}

async function readLockDirectory(path: string): Promise<{ record: HarnixFileLockRecord; source: string; tokenPath: string }> {
  const entries = await readdir(path);
  expect(entries).toHaveLength(1);
  const tokenPath = join(path, entries[0]!);
  const source = await readFile(tokenPath, "utf8");
  return { record: JSON.parse(source) as HarnixFileLockRecord, source, tokenPath };
}

function nativeFilesystem(overrides: Partial<FileLockFileSystem> = {}): FileLockFileSystem {
  return {
    lstat: async (path) => lstat(path),
    mkdir: async (directory, options) => mkdir(directory, options),
    readFile: async (path, encoding) => readFile(path, encoding),
    readdir: async (path) => readdir(path),
    rm: async (path, options) => rm(path, options),
    rmdir: async (path) => rmdir(path),
    writeFile: async (path, content, options) => writeFile(path, content, options),
    ...overrides,
  };
}

describe("Harnix file lock", () => {
  it("creates a versioned exclusive lock directory and releases only its own token", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "harnix.lock");
    const lock = await acquireHarnixFileLock(path, {
      clock: clockAt(10_000),
      operationId: "operation-a",
      processIdentity: () => ({ pid: 42, startedAt: new Date(8_000).toISOString() }),
    });

    expect((await lstat(path)).isDirectory()).toBe(true);
    expect(lock.recordPath.startsWith(`${path}\\`) || lock.recordPath.startsWith(`${path}/`)).toBe(true);
    expect((await readLockDirectory(path)).record).toMatchObject({
      generator: "harnix",
      generatorVersion: packageVersion,
      operationId: "operation-a",
      ownerPid: 42,
      schemaVersion: 1,
    });
    await lock.release();
    await expect(access(path)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("reclaims a stale lock only after the injected owner inspector reports the owner dead", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "harnix.lock");
    await writeLockDirectory(path, record());
    const lock = await acquireHarnixFileLock(path, {
      clock: clockAt(10_000),
      operationId: "replacement",
      ownerInspector: async () => "dead",
      processIdentity: () => ({ pid: 77, startedAt: new Date(9_000).toISOString() }),
    });

    expect((await readLockDirectory(path)).record).toMatchObject({ operationId: "replacement", ownerPid: 77 });
    await lock.release();
  });

  it("never removes a replacement lock created after stale-owner inspection", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "harnix.lock");
    const stale = record();
    const replacement = record({
      operationId: "replacement-operation",
      ownerPid: 202,
      processStartedAt: new Date(9_000).toISOString(),
    });
    await writeLockDirectory(path, stale);

    await expect(acquireHarnixFileLock(path, {
      clock: clockAt(10_000),
      operationId: "contender-operation",
      ownerInspector: async (existing) => {
        if (existing.operationId === stale.operationId) {
          await rm(path, { force: true, recursive: true });
          await writeLockDirectory(path, replacement, secondTokenName);
          return "dead";
        }
        return "alive";
      },
      processIdentity: () => ({ pid: 303, startedAt: new Date(9_500).toISOString() }),
      timeoutMs: 0,
    })).rejects.toBeInstanceOf(FileLockTimeoutError);

    expect((await readLockDirectory(path)).record).toEqual(replacement);
  });

  it("never removes a replacement installed after the final stale-token identity read", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "harnix.lock");
    const stale = await writeLockDirectory(path, record());
    const replacement = record({
      operationId: "replacement-after-final-read",
      ownerPid: 202,
      processStartedAt: new Date(9_000).toISOString(),
    });
    let replacementInstalled = false;
    const filesystem = nativeFilesystem({
      rm: async (target, options) => {
        if (!replacementInstalled && target === stale.tokenPath) {
          replacementInstalled = true;
          await rm(path, { force: true, recursive: true });
          await writeLockDirectory(path, replacement, secondTokenName);
        }
        await rm(target, options);
      },
    });

    await expect(acquireHarnixFileLock(path, {
      clock: clockAt(10_000),
      filesystem,
      operationId: "contender-operation",
      ownerInspector: async () => "dead",
      processIdentity: () => ({ pid: 303, startedAt: new Date(9_500).toISOString() }),
      timeoutMs: 0,
    })).rejects.toBeInstanceOf(FileLockTimeoutError);

    expect(replacementInstalled).toBe(true);
    expect((await readLockDirectory(path)).record).toEqual(replacement);
  });

  it("does not claim a replacement directory installed before sole-token verification", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "harnix.lock");
    const replacement = record({ operationId: "replacement-before-verification", ownerPid: 202 });
    let replacementInstalled = false;
    const filesystem = nativeFilesystem({
      readdir: async (target) => {
        if (!replacementInstalled && target === path) {
          replacementInstalled = true;
          await rm(path, { force: true, recursive: true });
          await writeLockDirectory(path, replacement, secondTokenName);
        }
        return readdir(target);
      },
    });

    await expect(acquireHarnixFileLock(path, {
      clock: clockAt(10_000),
      filesystem,
      operationId: "candidate-operation",
      processIdentity: () => ({ pid: 303, startedAt: new Date(9_500).toISOString() }),
      timeoutMs: 0,
    })).rejects.toBeInstanceOf(FileLockTimeoutError);

    expect((await readLockDirectory(path)).record).toEqual(replacement);
  });

  it("does not reclaim a live owner merely because the bounded wait expires", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "harnix.lock");
    await writeLockDirectory(path, record());
    const clock = clockAt(10_000);

    await expect(acquireHarnixFileLock(path, {
      clock,
      ownerInspector: async () => "alive",
      retryDelayMs: 5,
      timeoutMs: 10,
    })).rejects.toBeInstanceOf(FileLockTimeoutError);
    expect(clock.nowValue()).toBe(10_010);
    expect((await readLockDirectory(path)).record).toMatchObject({ operationId: "stale-operation" });
  });

  it("reclaims a PID-reused lock only when an identity inspector proves a different process start", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "harnix.lock");
    await writeLockDirectory(path, record({ ownerPid: process.pid, processStartedAt: new Date(500).toISOString() }));

    const replacement = await acquireHarnixFileLock(path, {
      clock: clockAt(10_000),
      operationId: "pid-reuse-replacement",
      processIdentity: () => ({ pid: 77, startedAt: new Date(9_000).toISOString() }),
      processIdentityInspector: async (pid) => ({ pid, startedAt: new Date(9_000).toISOString() }),
    });

    expect((await readLockDirectory(path)).record).toMatchObject({ operationId: "pid-reuse-replacement", ownerPid: 77 });
    await replacement.release();
  });

  it("treats a live PID with unavailable start identity as unknown and never reclaims it", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "harnix.lock");
    const original = record({ ownerPid: process.pid, processStartedAt: new Date(500).toISOString() });
    await writeLockDirectory(path, original);

    let inspections = 0;
    await expect(acquireHarnixFileLock(path, {
      clock: clockAt(10_000),
      processIdentityInspector: async () => {
        inspections += 1;
        return undefined;
      },
      timeoutMs: 0,
    })).rejects.toBeInstanceOf(FileLockTimeoutError);
    expect(inspections).toBe(1);
    expect((await readLockDirectory(path)).record).toEqual(original);
  });

  it("reclaims an old malformed token, waits on a fresh one, and preserves a legacy file lock", async () => {
    const home = await temporaryUserHome();
    const stalePath = join(home, "stale.lock");
    const stale = await writeLockDirectory(stalePath, "partial-json");
    await utimes(stale.tokenPath, new Date(0), new Date(0));

    const reclaimed = await acquireHarnixFileLock(stalePath, {
      clock: clockAt(10_000),
      operationId: "recovered",
      staleAfterMs: 1_000,
    });
    await reclaimed.release();

    const freshPath = join(home, "fresh.lock");
    await writeLockDirectory(freshPath, "partial-json");
    await expect(acquireHarnixFileLock(freshPath, { clock: clockAt(10_000), timeoutMs: 0 })).rejects.toBeInstanceOf(FileLockTimeoutError);

    const legacyPath = join(home, "legacy.lock");
    const legacySource = `${JSON.stringify(record())}\n`;
    await writeFile(legacyPath, legacySource, "utf8");
    await expect(acquireHarnixFileLock(legacyPath, {
      clock: clockAt(10_000),
      ownerInspector: async () => "dead",
      timeoutMs: 0,
    })).rejects.toBeInstanceOf(InvalidHarnixFileLockError);
    expect(await readFile(legacyPath, "utf8")).toBe(legacySource);
  });

  it("reclaims a stale empty candidate directory but waits on a fresh one", async () => {
    const home = await temporaryUserHome();
    const stalePath = join(home, "stale-empty.lock");
    await mkdir(stalePath);
    await utimes(stalePath, new Date(0), new Date(0));

    const reclaimed = await acquireHarnixFileLock(stalePath, {
      clock: clockAt(10_000),
      operationId: "recovered-empty-candidate",
      staleAfterMs: 1_000,
    });
    expect((await readLockDirectory(stalePath)).record.operationId).toBe("recovered-empty-candidate");
    await reclaimed.release();

    const freshPath = join(home, "fresh-empty.lock");
    await mkdir(freshPath);
    await expect(acquireHarnixFileLock(freshPath, {
      clock: clockAt(Date.now()),
      timeoutMs: 0,
    })).rejects.toBeInstanceOf(FileLockTimeoutError);
    expect(await readdir(freshPath)).toEqual([]);
  });

  it("never removes a lock directory that was replaced by another operation before release", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "harnix.lock");
    const lock = await acquireHarnixFileLock(path, { operationId: "operation-a" });
    const replacement = record({ operationId: "operation-b" });
    await rm(path, { force: true, recursive: true });
    await writeLockDirectory(path, replacement, secondTokenName);

    await lock.release();
    expect((await readLockDirectory(path)).record).toEqual(replacement);
  });
});
