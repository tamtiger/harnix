import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  UnsafeProjectPathError,
  normalizeRepositoryPath,
  resolveProjectRoot,
  resolveSafeProjectPath,
} from "../../src/utils/paths.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-path-");
async function createTemporaryDirectory(prefix: string): Promise<string> { void prefix; return temporaryRepository(); }

describe("normalizeRepositoryPath", () => {
  it("normalizes repository-relative Windows paths to POSIX", () => {
    expect(normalizeRepositoryPath("src\\core\\config.ts")).toBe("src/core/config.ts");
    expect(normalizeRepositoryPath(".", { allowRoot: true })).toBe(".");
  });

  it.each(["", ".", "../secret", "src/../../secret", "/tmp/secret", "C:\\secret"]) (
    "rejects unsafe persisted path %j",
    (unsafePath) => {
      expect(() => normalizeRepositoryPath(unsafePath)).toThrow(UnsafeProjectPathError);
    },
  );
});

describe("resolveProjectRoot", () => {
  it("uses an injected Git root for a nested directory with Unicode and spaces", async () => {
    const root = await createTemporaryDirectory("harnix root ");
    const nested = join(root, "đặc tả", "nested folder");
    await mkdir(nested, { recursive: true });

    await expect(resolveProjectRoot(nested, async () => root)).resolves.toBe(resolve(root));
  });

  it("uses the Git worktree root when provided", async () => {
    const root = await createTemporaryDirectory("harnix-worktree-");
    const nested = join(root, "feature", "child");
    await mkdir(nested, { recursive: true });

    await expect(resolveProjectRoot(nested, async () => root)).resolves.toBe(resolve(root));
  });

  it("falls back to the resolved starting directory outside Git", async () => {
    const root = await createTemporaryDirectory("harnix-no-git-");
    const nested = join(root, "nested");
    await mkdir(nested);

    await expect(resolveProjectRoot(nested, async () => undefined)).resolves.toBe(resolve(nested));
  });
});

describe("resolveSafeProjectPath", () => {
  it("resolves a contained path", async () => {
    const root = await createTemporaryDirectory("harnix-safe-path-");

    await expect(resolveSafeProjectPath(root, "src/config.yaml")).resolves.toBe(join(root, "src", "config.yaml"));
  });

  it("rejects traversal before resolving a filesystem path", async () => {
    const root = await createTemporaryDirectory("harnix-traversal-");

    await expect(resolveSafeProjectPath(root, "../outside.txt")).rejects.toBeInstanceOf(UnsafeProjectPathError);
  });

  it("rejects a symlinked directory that escapes the project root", async () => {
    const root = await createTemporaryDirectory("harnix-symlink-root-");
    const external = await createTemporaryDirectory("harnix-symlink-external-");
    await writeFile(join(external, "secret.txt"), "secret");
    await symlink(external, join(root, "linked"), "junction");

    await expect(resolveSafeProjectPath(root, "linked/secret.txt")).rejects.toBeInstanceOf(UnsafeProjectPathError);
  });
});

