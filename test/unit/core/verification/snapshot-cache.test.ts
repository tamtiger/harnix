import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { loadInputDigestSnapshot, saveInputDigestSnapshot } from "src/core/verification/snapshot-cache.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-snapshot-cache-");

async function cacheFile(root: string, text: string): Promise<string> {
  const harnixRoot = join(root, ".harnix");
  await mkdir(join(harnixRoot, "cache", "snapshots", "task-1"), { recursive: true });
  await writeFile(join(harnixRoot, "cache", "snapshots", "task-1", "check-1.json"), text);
  return harnixRoot;
}

describe("input digest snapshot cache", () => {
  it("returns a saved snapshot unchanged", async () => {
    const root = await temporaryRepository();
    const harnixRoot = join(root, ".harnix");
    await mkdir(harnixRoot, { recursive: true });
    const snapshot = {
      schemaVersion: 3,
      taskId: "task-1",
      checkId: "check-1",
      entries: [{ path: "src/a.ts", sha256: "a".repeat(64) }],
    };
    await saveInputDigestSnapshot(harnixRoot, snapshot as never);

    expect(await loadInputDigestSnapshot(harnixRoot, "task-1", "check-1")).toEqual(snapshot);
  });

  it.each([
    ["not JSON", "{ nope"],
    ["a JSON array", "[]"],
    ["entries that are not an array", JSON.stringify({ entries: 5 })],
    ["an entry that is not a path and hash", JSON.stringify({ entries: [{ path: 1 }] })],
  ])("treats %s as no cache instead of failing later", async (_name, text) => {
    const root = await temporaryRepository();
    const harnixRoot = await cacheFile(root, text);

    expect(await loadInputDigestSnapshot(harnixRoot, "task-1", "check-1")).toBeUndefined();
  });
});
