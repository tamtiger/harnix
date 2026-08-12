import { access, readFile, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  FileLockTimeoutError,
  acquireHarnixFileLock,
  type FileLockClock,
  type HarnixFileLockRecord,
} from "../../src/utils/file-lock.js";
import { packageVersion } from "../../src/version.js";
import { useTemporaryUserHomes } from "../support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-lock-home-");

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

describe("Harnix file lock", () => {
  it("creates a versioned exclusive lock and releases only its own operation", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "harnix.lock");
    const lock = await acquireHarnixFileLock(path, {
      clock: clockAt(10_000),
      operationId: "operation-a",
      processIdentity: () => ({ pid: 42, startedAt: new Date(8_000).toISOString() }),
    });

    expect(JSON.parse(await readFile(path, "utf8"))).toMatchObject({
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
    await writeFile(path, `${JSON.stringify(record())}\n`);
    const lock = await acquireHarnixFileLock(path, {
      clock: clockAt(10_000),
      operationId: "replacement",
      ownerInspector: async () => "dead",
      processIdentity: () => ({ pid: 77, startedAt: new Date(9_000).toISOString() }),
    });

    expect(JSON.parse(await readFile(path, "utf8"))).toMatchObject({ operationId: "replacement", ownerPid: 77 });
    await lock.release();
  });

  it("does not reclaim a live owner merely because the bounded wait expires", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "harnix.lock");
    await writeFile(path, `${JSON.stringify(record())}\n`);
    const clock = clockAt(10_000);

    await expect(acquireHarnixFileLock(path, {
      clock,
      ownerInspector: async () => "alive",
      retryDelayMs: 5,
      timeoutMs: 10,
    })).rejects.toBeInstanceOf(FileLockTimeoutError);
    expect(clock.nowValue()).toBe(10_010);
    expect(JSON.parse(await readFile(path, "utf8"))).toMatchObject({ operationId: "stale-operation" });
  });

  it("reclaims a PID-reused lock only when an identity inspector proves a different process start", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "harnix.lock");
    await writeFile(path, `${JSON.stringify(record({ ownerPid: process.pid, processStartedAt: new Date(500).toISOString() }))}\n`);

    const replacement = await acquireHarnixFileLock(path, {
      clock: clockAt(10_000),
      operationId: "pid-reuse-replacement",
      processIdentity: () => ({ pid: 77, startedAt: new Date(9_000).toISOString() }),
      processIdentityInspector: async (pid) => ({ pid, startedAt: new Date(9_000).toISOString() }),
    });

    expect(JSON.parse(await readFile(path, "utf8"))).toMatchObject({ operationId: "pid-reuse-replacement", ownerPid: 77 });
    await replacement.release();
  });

  it("treats a live PID with unavailable start identity as unknown and never reclaims it", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "harnix.lock");
    const original = record({ ownerPid: process.pid, processStartedAt: new Date(500).toISOString() });
    await writeFile(path, `${JSON.stringify(original)}\n`);

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
    expect(JSON.parse(await readFile(path, "utf8"))).toEqual(original);
  });

  it("reclaims an old malformed crash remnant but preserves a fresh malformed lock", async () => {
    const home = await temporaryUserHome();
    const stalePath = join(home, "stale.lock");
    await writeFile(stalePath, "partial-json");
    await utimes(stalePath, new Date(0), new Date(0));

    const reclaimed = await acquireHarnixFileLock(stalePath, {
      clock: clockAt(10_000),
      operationId: "recovered",
      staleAfterMs: 1_000,
    });
    await reclaimed.release();

    const freshPath = join(home, "fresh.lock");
    await writeFile(freshPath, "partial-json");
    await expect(acquireHarnixFileLock(freshPath, { clock: clockAt(10_000), timeoutMs: 0 })).rejects.toThrow("invalid");
  });

  it("never removes a lock that was replaced by another operation before release", async () => {
    const home = await temporaryUserHome();
    const path = join(home, "harnix.lock");
    const lock = await acquireHarnixFileLock(path, { operationId: "operation-a" });
    await writeFile(path, `${JSON.stringify(record({ operationId: "operation-b" }))}\n`);

    await lock.release();
    expect(JSON.parse(await readFile(path, "utf8"))).toMatchObject({ operationId: "operation-b" });
  });
});
