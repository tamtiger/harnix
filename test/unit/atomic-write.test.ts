import { chmod, readFile, stat, writeFile } from "node:fs/promises";
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

  it("copies an existing permission mode to the sibling replacement before rename", async () => {
    const directory = await createTemporaryDirectory();
    const target = join(directory, "state.json");
    const filesystem: AtomicFileSystem = {
      chmod: vi.fn(),
      mkdir: vi.fn(),
      rename: vi.fn(),
      rm: vi.fn(),
      stat: vi.fn().mockResolvedValue({ mode: 0o100640 }),
      writeFile: vi.fn(),
    };

    await atomicWriteFile(target, "new", { filesystem, randomSuffix: () => "fixed" });

    expect(filesystem.chmod).toHaveBeenCalledWith(`${target}.fixed.tmp`, 0o640);
    expect(filesystem.rename).toHaveBeenCalledWith(`${target}.fixed.tmp`, target);
  });

  it.runIf(process.platform !== "win32")("preserves an existing file mode when atomically replacing its content", async () => {
    const directory = await createTemporaryDirectory();
    const target = join(directory, "private.json");
    await writeFile(target, "old");
    await chmod(target, 0o600);

    await atomicWriteFile(target, "new");

    expect((await stat(target)).mode & 0o777).toBe(0o600);
  });
});
