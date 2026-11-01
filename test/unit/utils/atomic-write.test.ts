import { chmod, lstat, readFile, stat, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { atomicWriteFile, type AtomicFileSystem } from "src/utils/atomic-write.js";
import { fileSymlinksSupported } from "test/support/symlink-support.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

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
    expect(filesystem.rename).toHaveBeenCalledTimes(1);
    expect(filesystem.rm).toHaveBeenCalledWith(`${target}.fixed.tmp`, { force: true });
  });

  it("retries a bounded transient Windows replacement failure before cleaning the temporary file", async () => {
    const directory = await createTemporaryDirectory();
    const target = join(directory, "state.json");
    const transient = Object.assign(new Error("temporarily locked"), { code: "EPERM", syscall: "rename" });
    const filesystem: AtomicFileSystem = {
      mkdir: vi.fn(),
      rename: vi.fn().mockRejectedValueOnce(transient).mockResolvedValueOnce(undefined),
      rm: vi.fn(),
      writeFile: vi.fn(),
    };

    await atomicWriteFile(target, "new", {
      filesystem,
      randomSuffix: () => "fixed",
      renameRetryDelaysMs: [0],
    });

    expect(filesystem.rename).toHaveBeenCalledTimes(2);
    expect(filesystem.rm).not.toHaveBeenCalled();

    const exhaustedFilesystem: AtomicFileSystem = {
      mkdir: vi.fn(),
      rename: vi.fn().mockRejectedValue(transient),
      rm: vi.fn(),
      writeFile: vi.fn(),
    };
    await expect(
      atomicWriteFile(target, "new", {
        filesystem: exhaustedFilesystem,
        randomSuffix: () => "exhausted",
        renameRetryDelaysMs: [0, 0],
      }),
    ).rejects.toBe(transient);
    expect(exhaustedFilesystem.rename).toHaveBeenCalledTimes(3);
    expect(exhaustedFilesystem.rm).toHaveBeenCalledWith(`${target}.exhausted.tmp`, { force: true });
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

  it.runIf(process.platform !== "win32")(
    "preserves an existing file mode when atomically replacing its content",
    async () => {
      const directory = await createTemporaryDirectory();
      const target = join(directory, "private.json");
      await writeFile(target, "old");
      await chmod(target, 0o600);

      await atomicWriteFile(target, "new");

      expect((await stat(target)).mode & 0o777).toBe(0o600);
    },
  );

  describe.skipIf(!fileSymlinksSupported())("when the destination is a symlink", () => {
    it("writes through to the real target and keeps the symlink", async () => {
      const directory = await createTemporaryDirectory();
      const real = join(directory, "real.toml");
      const link = join(directory, "dotfile");
      await writeFile(real, "old");
      await symlink(real, link, "file");

      await atomicWriteFile(link, "new", { randomSuffix: () => "fixed" });

      expect((await lstat(link)).isSymbolicLink()).toBe(true);
      await expect(readFile(real, "utf8")).resolves.toBe("new");
    });

    it("refuses a dangling symlink without creating its target", async () => {
      const directory = await createTemporaryDirectory();
      const link = join(directory, "dotfile");
      await symlink(join(directory, "missing"), link, "file");

      await expect(atomicWriteFile(link, "new")).rejects.toThrow(/symlink/i);
      await expect(lstat(join(directory, "missing"))).rejects.toMatchObject({ code: "ENOENT" });
    });
  });
});

describe("atomicWriteFile symlink handling through an injected filesystem", () => {
  const base = (): AtomicFileSystem => ({
    mkdir: vi.fn(),
    rename: vi.fn().mockResolvedValue(undefined),
    rm: vi.fn(),
    writeFile: vi.fn(),
  });

  it("replaces the real target of a symlinked destination, not the link", async () => {
    const filesystem: AtomicFileSystem = {
      ...base(),
      lstat: vi.fn().mockResolvedValue({ isSymbolicLink: () => true }),
      realpath: vi.fn().mockResolvedValue("/real/dotfile"),
    };

    await atomicWriteFile("/home/link", "new", { filesystem, randomSuffix: () => "fixed" });

    expect(filesystem.writeFile).toHaveBeenCalledWith("/real/dotfile.fixed.tmp", "new");
    expect(filesystem.rename).toHaveBeenCalledWith("/real/dotfile.fixed.tmp", "/real/dotfile");
  });

  it("refuses a dangling symlink", async () => {
    const filesystem: AtomicFileSystem = {
      ...base(),
      lstat: vi.fn().mockResolvedValue({ isSymbolicLink: () => true }),
      realpath: vi.fn().mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" })),
    };

    await expect(atomicWriteFile("/home/link", "new", { filesystem })).rejects.toThrow(/symlink/i);
    expect(filesystem.writeFile).not.toHaveBeenCalled();
  });

  it("treats a missing destination as a plain new file", async () => {
    const filesystem: AtomicFileSystem = {
      ...base(),
      lstat: vi.fn().mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" })),
      realpath: vi.fn(),
    };

    await atomicWriteFile("/home/new", "x", { filesystem, randomSuffix: () => "fixed" });

    expect(filesystem.rename).toHaveBeenCalledWith("/home/new.fixed.tmp", "/home/new");
  });
});
