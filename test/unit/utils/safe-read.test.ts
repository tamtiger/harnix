import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { detectEcosystemVerify } from "src/core/stack/verify-detection.js";
import { readTextInside, resolvesInside } from "src/utils/safe-read.js";
import { fileSymlinksSupported, linkDirectory } from "test/support/symlink-support.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryDirectory = useTemporaryRepositories("harnix-safe-read-");
const symlinksSupported = fileSymlinksSupported();

describe("readTextInside", () => {
  it("reads a regular file and returns undefined when it is missing or too large", async () => {
    const root = await temporaryDirectory();
    await writeFile(join(root, "a.txt"), "hello");
    await writeFile(join(root, "big.txt"), "x".repeat(256 * 1024 + 1));

    await expect(readTextInside(root, join(root, "a.txt"))).resolves.toBe("hello");
    await expect(readTextInside(root, join(root, "missing.txt"))).resolves.toBeUndefined();
    await expect(readTextInside(root, join(root, "big.txt"))).resolves.toBeUndefined();
  });

  it.skipIf(!symlinksSupported)("refuses a symlink that resolves outside the boundary", async () => {
    const root = await temporaryDirectory();
    const outside = await temporaryDirectory();
    await writeFile(join(outside, "secret.txt"), "secret");
    await symlink(join(outside, "secret.txt"), join(root, "link.txt"), "file");
    await writeFile(join(root, "real.txt"), "real");
    await symlink(join(root, "real.txt"), join(root, "inner.txt"), "file");

    await expect(readTextInside(root, join(root, "link.txt"))).resolves.toBeUndefined();
    await expect(readTextInside(root, join(root, "inner.txt"))).resolves.toBe("real");
  });

  it.skipIf(!symlinksSupported)("makes verify detection ignore a package.json symlinked outside the root", async () => {
    const root = await temporaryDirectory();
    const outside = await temporaryDirectory();
    await writeFile(join(outside, "package.json"), JSON.stringify({ scripts: { test: "evil" } }));
    await symlink(join(outside, "package.json"), join(root, "package.json"), "file");

    const result = await detectEcosystemVerify(root);

    expect(result?.commands.test).toBeUndefined();
  });

  it("refuses a file reached through a directory link that leaves the project root", async () => {
    const root = await temporaryDirectory();
    const outside = await temporaryDirectory();
    await writeFile(join(outside, "package.json"), JSON.stringify({ scripts: { test: "evil" } }));
    await linkDirectory(outside, join(root, "pkg"));

    await expect(readTextInside(root, join(root, "pkg", "package.json"))).resolves.toBeUndefined();
    const result = await detectEcosystemVerify(root, "pkg");
    expect(result?.commands.test).toBeUndefined();
  });

  it("reads a file reached through a directory link to a sibling directory inside the root", async () => {
    const root = await temporaryDirectory();
    await mkdir(join(root, "shared"));
    await writeFile(join(root, "shared", "package.json"), JSON.stringify({ scripts: { test: "vitest" } }));
    await linkDirectory(join(root, "shared"), join(root, "pkg"));

    const result = await detectEcosystemVerify(root, "pkg");

    expect(result?.commands.test).toContain("test");
  });

  it.skipIf(!symlinksSupported)("reads a package.json file link that points into a sibling directory", async () => {
    const root = await temporaryDirectory();
    await mkdir(join(root, "shared"));
    await mkdir(join(root, "pkg"));
    await writeFile(join(root, "shared", "package.json"), JSON.stringify({ scripts: { test: "vitest" } }));
    await symlink(join(root, "shared", "package.json"), join(root, "pkg", "package.json"), "file");

    const result = await detectEcosystemVerify(root, "pkg");

    expect(result?.commands.test).toContain("test");
  });
});

describe("resolvesInside", () => {
  it("does not treat a sibling that shares a name prefix as inside", async () => {
    const parent = await temporaryDirectory();
    await mkdir(join(parent, "a"));
    await mkdir(join(parent, "ab"));
    await writeFile(join(parent, "ab", "f.txt"), "x");
    await writeFile(join(parent, "a", "f.txt"), "x");

    await expect(resolvesInside(join(parent, "a"), join(parent, "ab", "f.txt"))).resolves.toBe(false);
    await expect(resolvesInside(join(parent, "a"), join(parent, "a", "f.txt"))).resolves.toBe(true);
    await expect(resolvesInside(join(parent, "a"), join(parent, "a"))).resolves.toBe(true);
  });

  it("compares real paths when the root itself is a link", async () => {
    const parent = await temporaryDirectory();
    await mkdir(join(parent, "real"));
    await writeFile(join(parent, "real", "f.txt"), "x");
    await linkDirectory(join(parent, "real"), join(parent, "alias"));

    await expect(resolvesInside(join(parent, "alias"), join(parent, "real", "f.txt"))).resolves.toBe(true);
    await expect(resolvesInside(join(parent, "real"), join(parent, "alias", "f.txt"))).resolves.toBe(true);
  });

  it("is false when the path is missing", async () => {
    const root = await temporaryDirectory();
    await expect(resolvesInside(root, join(root, "nope"))).resolves.toBe(false);
  });
});
