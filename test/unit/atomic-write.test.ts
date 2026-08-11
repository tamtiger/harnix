import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { atomicWriteFile, type AtomicFileSystem } from "../../src/utils/atomic-write.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const createTemporaryDirectory = useTemporaryRepositories("harnix-atomic-");

describe("atomicWriteFile", () => {
  it("replaces a file through a sibling temporary file", async () => {
    const directory = await createTemporaryDirectory();
    const target = join(directory, "state.json");
    await writeFile(target, "old");

    await atomicWriteFile(target, "new", { randomSuffix: () => "fixed" });

    await expect(readFile(target, "utf8")).resolves.toBe("new");
  });

  it("preserves the original file and cleans the temporary file if replacement fails", async () => {
    const directory = await createTemporaryDirectory();
    const target = join(directory, "state.json");
    await writeFile(target, "old");

    const filesystem: AtomicFileSystem = {
      mkdir: vi.fn(),
      rename: vi.fn().mockRejectedValue(new Error("interrupted replacement")),
      rm: vi.fn(),
      writeFile: vi.fn(),
    };

    await expect(atomicWriteFile(target, "new", { filesystem, randomSuffix: () => "fixed" })).rejects.toThrow(
      "interrupted replacement",
    );
    await expect(readFile(target, "utf8")).resolves.toBe("old");
    expect(filesystem.rm).toHaveBeenCalledWith(`${target}.fixed.tmp`, { force: true });
  });
});
