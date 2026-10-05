import { describe, expect, it } from "vitest";

import type { FileLockClock, FileLockFileSystem, FileLockStats } from "src/utils/file-lock.js";
import { inspectExistingLock, isReleasePending } from "src/utils/file-lock-inspect.js";

const TOKEN = "owner-a089e3f6-88a3-4931-9521-4da926714503.json";
const clock: FileLockClock = { now: () => 10_000, sleep: () => Promise.resolve() };
const stats = (kind: "directory" | "file"): FileLockStats => ({
  mtimeMs: 10_000,
  isDirectory: () => kind === "directory",
  isFile: () => kind === "file",
  isSymbolicLink: () => false,
});
const failure = (code: string) => Object.assign(new Error(code), { code });

function filesystem(overrides: Partial<FileLockFileSystem> = {}): FileLockFileSystem {
  return {
    lstat: (path) => Promise.resolve(path.endsWith(".json") ? stats("file") : stats("directory")),
    mkdir: () => Promise.resolve(undefined),
    readFile: () => Promise.resolve("{}"),
    readdir: () => Promise.resolve([TOKEN]),
    rm: () => Promise.resolve(),
    rmdir: () => Promise.resolve(),
    writeFile: () => Promise.resolve(),
    ...overrides,
  };
}

const inspect = (fs: FileLockFileSystem) =>
  inspectExistingLock("lock", fs, clock, 60_000, () => Promise.resolve("alive"));

describe("isReleasePending", () => {
  it("recognizes the codes Windows uses for a file that is being deleted or released", () => {
    expect(isReleasePending(failure("EPERM"))).toBe(true);
    expect(isReleasePending(failure("EBUSY"))).toBe(true);
    expect(isReleasePending(failure("ENOENT"))).toBe(false);
    expect(isReleasePending(new Error("plain"))).toBe(false);
  });
});

describe("inspectExistingLock while the holder is releasing", () => {
  it.each(["ENOENT", "ENOTDIR", "EPERM", "EBUSY"])("waits when reading the owner token fails with %s", async (code) => {
    const result = await inspect(
      filesystem({
        readFile: () => Promise.reject(failure(code)),
      }),
    );

    expect(result).toEqual({ action: "wait" });
  });

  it.each(["EPERM", "EBUSY"])("waits when listing the lock directory fails with %s", async (code) => {
    const result = await inspect(filesystem({ readdir: () => Promise.reject(failure(code)) }));

    expect(result).toEqual({ action: "wait" });
  });

  it("still surfaces an error that is not a release race", async () => {
    await expect(inspect(filesystem({ readFile: () => Promise.reject(failure("EIO")) }))).rejects.toMatchObject({
      code: "EIO",
    });
  });
});
