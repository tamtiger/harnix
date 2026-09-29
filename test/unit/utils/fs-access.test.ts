import * as nodeFs from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import * as fsAccess from "src/utils/fs-access.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-fs-access-");

describe("fs-access", () => {
  it("exposes exactly the one-call read and delete primitives commands are allowed to use", () => {
    expect(Object.keys(fsAccess).sort()).toEqual(["access", "lstat", "readFile", "readdir", "rm"]);
  });

  it("re-exports the node primitives unchanged", () => {
    expect(fsAccess.access).toBe(nodeFs.access);
    expect(fsAccess.lstat).toBe(nodeFs.lstat);
    expect(fsAccess.readFile).toBe(nodeFs.readFile);
    expect(fsAccess.readdir).toBe(nodeFs.readdir);
    expect(fsAccess.rm).toBe(nodeFs.rm);
  });

  it("reads, lists, inspects and removes files through the shared primitives", async () => {
    const root = await temporaryRepository();
    const file = join(root, "note.txt");
    await nodeFs.writeFile(file, "hello");

    await expect(fsAccess.access(file)).resolves.toBeUndefined();
    await expect(fsAccess.readFile(file, "utf8")).resolves.toBe("hello");
    await expect(fsAccess.readdir(root)).resolves.toEqual(["note.txt"]);
    expect((await fsAccess.lstat(file)).isFile()).toBe(true);
    await fsAccess.rm(file);
    await expect(fsAccess.access(file)).rejects.toMatchObject({ code: "ENOENT" });
  });
});
