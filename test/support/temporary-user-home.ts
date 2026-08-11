import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach } from "vitest";

/** Creates isolated user-profile roots; production home resolution is never used by tests. */
export function useTemporaryUserHomes(prefix = "harnix-user-home-"): () => Promise<string> {
  const directories: string[] = [];

  afterEach(async () => {
    await Promise.all(directories.splice(0).map(async (directory) => {
      await rm(directory, { force: true, recursive: true });
    }));
  });

  return async () => {
    const directory = await mkdtemp(join(tmpdir(), prefix));
    directories.push(directory);
    return directory;
  };
}
