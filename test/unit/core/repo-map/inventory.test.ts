import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { assertRepoMapLimits, inventoryRepository } from "src/core/repo-map/inventory.js";
import { defaultRepoMapLimits } from "src/core/repo-map/types.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-inventory-");

async function put(root: string, path: string, content: string | Buffer): Promise<void> {
  await mkdir(join(root, path, ".."), { recursive: true });
  await writeFile(join(root, path), content);
}

describe("repo-map inventory", () => {
  it("lists contained files in code-unit order and skips ignored directories, secrets and binaries", async () => {
    const root = await temporaryRepository();
    await put(root, "src/b.ts", "export const b = 1;\n");
    await put(root, "src/A.ts", "export const a = 1;\n");
    await put(root, "node_modules/dep/index.js", "module.exports = 1;\n");
    await put(root, ".git/config", "[core]\n");
    await put(root, ".env", "TOKEN=abcdefghijk\n");
    await put(root, "keys/server.pem", "-----BEGIN-----\n");
    await put(root, "assets/logo.png", Buffer.from([0x89, 0x50, 0x00, 0x01]));

    const inventory = await inventoryRepository(root);

    expect(inventory.files.map((file) => file.path)).toEqual(["src/A.ts", "src/b.ts"]);
    expect(inventory.skipped).toEqual(expect.arrayContaining([".env", "assets/logo.png", "keys/server.pem"]));
    expect(inventory.skipped.some((path) => path.includes("node_modules"))).toBe(false);
    expect(inventory.files.every((file) => file.byteLength > 0)).toBe(true);
  });

  it("skips files above the per-file limit and stops at the file-count limit", async () => {
    const root = await temporaryRepository();
    await put(root, "big.ts", "x".repeat(200));
    await put(root, "one.ts", "1\n");
    await put(root, "two.ts", "2\n");
    await put(root, "three.ts", "3\n");

    const limited = await inventoryRepository(root, { ...defaultRepoMapLimits, maxBytesPerFile: 100, maxFiles: 2 });

    expect(limited.files.map((file) => file.path)).toEqual(["one.ts", "three.ts"]);
    expect(limited.skipped).toEqual(expect.arrayContaining(["big.ts", "limit"]));
  });

  it("rejects non-positive or non-integer limits", () => {
    expect(() => assertRepoMapLimits(defaultRepoMapLimits)).not.toThrow();
    expect(() => assertRepoMapLimits({ ...defaultRepoMapLimits, maxFiles: 0 })).toThrow(/maxFiles/u);
    expect(() => assertRepoMapLimits({ ...defaultRepoMapLimits, concurrency: 1.5 })).toThrow(/concurrency/u);
  });
});
