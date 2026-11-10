import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { setupPlatforms } from "src/commands/setup.js";
import { releaseGlobalLocks } from "src/core/global/locking.js";
import { reconcileGlobalManagedFiles } from "src/core/global/managed-files.js";
import { type UserPathRoot } from "src/core/platform/user-paths.js";
import { atomicWriteFile } from "src/utils/atomic-write.js";
import { useTemporaryGlobalRoots } from "test/support/temporary-global-root.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const globalRoot = useTemporaryGlobalRoots("harnix-global-robust-");
const temporaryUserHome = useTemporaryUserHomes("harnix-global-robust-home-");

const base = (root: UserPathRoot) => ({
  root,
  manifestPath: "harnix/managed.json",
  platform: "kiro" as const,
  generatorVersion: "2.0.0",
});

describe("global transaction rollback", () => {
  it("removes the directories the failed transaction created, so no empty plugin root is left behind", async () => {
    const root = await globalRoot();
    const manifest = join(root.path, "harnix", "managed.json");

    await expect(
      reconcileGlobalManagedFiles({
        ...base(root),
        desired: [{ path: "skills/harnix-x/SKILL.md", sourceId: "skill", kind: "file", content: "skill\n" }],
        writer: async (path: string, content: string) => {
          if (path === manifest) throw new Error("manifest write failed");
          await atomicWriteFile(path, content);
        },
      }),
    ).rejects.toThrow("rolled back");

    await expect(access(join(root.path, "skills"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root.path, "harnix"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(root.path)).resolves.toBeUndefined();
  });

  it("keeps a directory that already existed before the transaction", async () => {
    const root = await globalRoot();
    await mkdir(join(root.path, "skills"), { recursive: true });
    const manifest = join(root.path, "harnix", "managed.json");

    await expect(
      reconcileGlobalManagedFiles({
        ...base(root),
        desired: [{ path: "skills/harnix-x/SKILL.md", sourceId: "skill", kind: "file", content: "skill\n" }],
        writer: async (path: string, content: string) => {
          if (path === manifest) throw new Error("manifest write failed");
          await atomicWriteFile(path, content);
        },
      }),
    ).rejects.toThrow();

    await expect(access(join(root.path, "skills"))).resolves.toBeUndefined();
    await expect(access(join(root.path, "skills", "harnix-x"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});

describe("global whole-file ownership", () => {
  it("never adopts a pre-existing file without a manifest entry, whatever its text", async () => {
    const root = await globalRoot();
    await mkdir(join(root.path, "steering"), { recursive: true });
    await writeFile(join(root.path, "steering", "harnix.md"), "the user's own text\n");

    const result = await reconcileGlobalManagedFiles({
      ...base(root),
      desired: [{ path: "steering/harnix.md", sourceId: "steering", kind: "file", content: "generated\n" }],
    });

    expect(result.preserved).toEqual(["steering/harnix.md"]);
    expect(await readFile(join(root.path, "steering", "harnix.md"), "utf8")).toBe("the user's own text\n");
  });
});

describe("global skill unit protection", () => {
  const desired = (extra: string[] = []) =>
    ["SKILL.md", ...extra].map((name) => ({
      path: `skills/harnix-x/${name}`,
      sourceId: `skill-${name}`,
      kind: "file" as const,
      content: `${name}\n`,
    }));

  it("writes nothing into a skill directory the user already owns, references included", async () => {
    const root = await globalRoot();
    await mkdir(join(root.path, "skills", "harnix-x"), { recursive: true });
    await writeFile(join(root.path, "skills", "harnix-x", "custom.md"), "user file\n");

    const result = await reconcileGlobalManagedFiles({
      ...base(root),
      desired: desired(["references/topic.md"]),
      preserveUnownedSkillDirectories: true,
    });

    expect(result.created).toEqual([]);
    await expect(access(join(root.path, "skills", "harnix-x", "references", "topic.md"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("still adds a new reference to a skill unit that Harnix already owns", async () => {
    const root = await globalRoot();
    await reconcileGlobalManagedFiles({ ...base(root), desired: desired(), preserveUnownedSkillDirectories: true });

    const result = await reconcileGlobalManagedFiles({
      ...base(root),
      desired: desired(["references/topic.md"]),
      preserveUnownedSkillDirectories: true,
    });

    expect(result.created).toEqual(["skills/harnix-x/references/topic.md"]);
  });
});

describe("global lock release", () => {
  it("releases every lock and still reports the first failure after all releases settled", async () => {
    let slowReleased = false;
    const locks = [
      {
        release: async () => {
          await new Promise((resolve) => setTimeout(resolve, 40));
          slowReleased = true;
        },
      },
      { release: () => Promise.reject(new Error("release failed")) },
    ];

    await expect(releaseGlobalLocks(locks as never)).rejects.toThrow("release failed");
    expect(slowReleased).toBe(true);
  });
});

describe("global entry points in test mode", () => {
  it("refuse a homeResolver without an injected environment, so a real CODEX_HOME can never relocate the root", async () => {
    const home = await temporaryUserHome();
    const attempt = setupPlatforms({
      platforms: ["codex"],
      homeResolver: async () => home,
      commandLookup: vi.fn(async () => true),
    });

    await expect(attempt).rejects.toThrow("requires an injected environment in test mode");
  });
});
