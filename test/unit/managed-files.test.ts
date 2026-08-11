import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { AtomicFileSystem } from "../../src/utils/atomic-write.js";
import { sha256 } from "../../src/utils/hashing.js";
import { ownershipState, obsoleteState, reconcileManagedFiles, validateManifest, writeManifest } from "../../src/utils/managed-files.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

const entry = { path: "README.md", sourceId: "readme", scope: "project" as const, generatedHash: sha256("hello\n"), generatorVersion: "0.1.0" };

describe("managed files", () => {
  it("validates sorted manifest and tracks ownership", async () => {
    const root = await temporaryRepository(); await writeFile(join(root, "README.md"), "hello\r\n");
    expect(validateManifest({ generator: "harnix", schemaVersion: 1, entries: [entry] }).entries).toHaveLength(1);
    expect(await ownershipState(root, entry)).toBe("modified");
    expect(await ownershipState(root, entry, entry)).toBe("unchanged");
    expect(await obsoleteState(root, entry)).toBe("obsolete-unchanged");
  });

  it("rejects corrupt and future managed manifests", () => {
    expect(() => validateManifest({ generator: "harnix", schemaVersion: 2, entries: [] })).toThrow("unsupported");
    expect(() => validateManifest({ generator: "harnix", schemaVersion: 1, entries: [{ ...entry, generatedHash: "bad" }] })).toThrow("entry");
  });

  it("keeps the previous manifest when atomic replacement fails", async () => {
    const root = await temporaryRepository(); const path = join(root, "manifest.json"); await writeFile(path, "old");
    const filesystem: AtomicFileSystem = { mkdir: async () => undefined, writeFile: async () => undefined, rename: async () => { throw new Error("fail"); }, rm: async () => undefined };
    await expect(writeManifest(path, { generator: "harnix", schemaVersion: 1, entries: [] }, { filesystem, randomSuffix: () => "fixed" })).rejects.toThrow("fail");
    expect(await readFile(path, "utf8")).toBe("old");
  });

  it("reconciles managed files while preserving user modifications", async () => {
    const root = await temporaryRepository(); await writeFile(join(root, "README.md"), "user\n");
    const old = validateManifest({ generator: "harnix", schemaVersion: 1, entries: [entry] });
    const result = await reconcileManagedFiles(root, old, [{ entry, content: "hello\n" }], { generatorVersion: "0.1.0" });
    expect(result.result.preserved).toEqual(["README.md"]); expect(await readFile(join(root, "README.md"), "utf8")).toBe("user\n");
  });
});
