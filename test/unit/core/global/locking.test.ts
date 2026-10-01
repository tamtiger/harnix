import { describe, expect, it } from "vitest";

import { acquireGlobalLocks, releaseGlobalLocks, type GlobalLock } from "src/core/global/locking.js";
import { globalTargets } from "src/core/global/targets.js";
import { resolveSelectedUserPlatformRoots } from "src/core/platform/user-paths.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-locking-");

async function targets() {
  const home = await temporaryUserHome();
  const roots = await resolveSelectedUserPlatformRoots(["kiro", "claude"], {
    environment: {},
    homeResolver: () => Promise.resolve(home),
  });
  return globalTargets(["kiro", "claude"], roots);
}

const reconciliation = (target: Awaited<ReturnType<typeof targets>>[number]) => ({
  root: target.root,
  manifestPath: target.manifestPath,
  platform: target.globalPlatform,
  desired: [],
  generatorVersion: "2.0.0",
});

describe("global locking", () => {
  it("acquires every lock in the stable reconciliation order and releases in reverse", async () => {
    const acquired: string[] = [];
    const released: string[] = [];
    const lockFor = (path: string): GlobalLock => ({
      path,
      release: () => {
        released.push(path);
        return Promise.resolve();
      },
    });

    const locks = await acquireGlobalLocks(await targets(), reconciliation, (path) => {
      acquired.push(path);
      return Promise.resolve(lockFor(path));
    });
    await releaseGlobalLocks(locks.map(({ lock }) => lock));

    expect(acquired).toHaveLength(2);
    expect(acquired[0]! < acquired[1]!).toBe(true);
    expect(released).toEqual([...acquired].reverse());
  });

  it("releases already acquired locks when a later acquisition fails", async () => {
    const released: string[] = [];
    let count = 0;

    await expect(
      acquireGlobalLocks(await targets(), reconciliation, (path) => {
        count += 1;
        if (count === 2) return Promise.reject(new Error("busy"));
        return Promise.resolve({
          path,
          release: () => {
            released.push(path);
            return Promise.resolve();
          },
        });
      }),
    ).rejects.toThrow("busy");

    expect(released).toHaveLength(1);
  });
});
