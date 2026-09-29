import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { atomicWriteFile } from "src/utils/atomic-write.js";
import {
  GlobalManagedManifestError,
  GlobalManagedTransactionError,
  reconcileGlobalManagedFiles,
  reconcileGlobalManagedRoots,
} from "src/utils/global-managed-files.js";
import { createVerifiedUserRoot, type UserPathRoot } from "src/utils/user-paths.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRoot = useTemporaryRepositories("harnix-global-managed-");

async function temporaryGlobalRoot(logicalPath = "~/test-global"): Promise<UserPathRoot> {
  return createVerifiedUserRoot(await temporaryRoot(), logicalPath);
}

describe("global managed files: preflight, dry-run and rollback", () => {
  it("returns exact planned status without writing targets or a sidecar during dry-run", async () => {
    const root = await temporaryGlobalRoot();
    let writes = 0;

    const planned = await reconcileGlobalManagedFiles({
      root,
      manifestPath: "harnix/managed.json",
      platform: "kiro",
      generatorVersion: "0.6.0",
      desired: [{ path: "steering/harnix.md", sourceId: "steering", kind: "file", content: "generated\n" }],
      dryRun: true,
      writer: async () => {
        writes += 1;
      },
    });

    expect(planned.created).toEqual(["steering/harnix.md"]);
    expect(planned.manifest.entries).toHaveLength(1);
    expect(writes).toBe(0);
    await expect(access(join(root.path, "steering", "harnix.md"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root.path, "harnix", "managed.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("preflights all roots before writes and rolls back earlier roots when a later root fails", async () => {
    const first = await temporaryGlobalRoot("~/first-platform");
    const second = await temporaryGlobalRoot("~/second-platform");
    const firstTarget = join(first.path, "steering", "harnix.md");
    const secondManifest = join(second.path, "harnix", "managed.json");
    const firstRequest = {
      root: first,
      manifestPath: "harnix/managed.json",
      platform: "kiro" as const,
      generatorVersion: "0.6.0",
      desired: [{ path: "steering/harnix.md", sourceId: "steering", kind: "file" as const, content: "first\n" }],
    };
    const secondRequest = {
      root: second,
      manifestPath: "harnix/managed.json",
      platform: "codex" as const,
      generatorVersion: "0.6.0",
      desired: [{ path: "AGENTS.md", sourceId: "agents", kind: "file" as const, content: "second\n" }],
      writer: async (path: string, content: string): Promise<void> => {
        if (path === secondManifest) throw new Error("later manifest failed");
        await atomicWriteFile(path, content);
      },
    };

    await expect(reconcileGlobalManagedRoots({ reconciliations: [secondRequest, firstRequest] })).rejects.toMatchObject(
      {
        rollback: expect.objectContaining({
          restored: expect.arrayContaining(["~/first-platform/steering/harnix.md"]),
        }),
      },
    );
    await expect(access(firstTarget)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(first.path, "harnix", "managed.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("does not begin the first root when a later root has an invalid sidecar during multi-root preflight", async () => {
    const first = await temporaryGlobalRoot("~/first-preflight");
    const second = await temporaryGlobalRoot("~/second-preflight");
    await mkdir(join(second.path, "harnix"), { recursive: true });
    await writeFile(join(second.path, "harnix", "managed.json"), "invalid");

    await expect(
      reconcileGlobalManagedRoots({
        reconciliations: [
          {
            root: first,
            manifestPath: "harnix/managed.json",
            platform: "kiro",
            generatorVersion: "0.6.0",
            desired: [{ path: "steering/harnix.md", sourceId: "steering", kind: "file", content: "first\n" }],
          },
          {
            root: second,
            manifestPath: "harnix/managed.json",
            platform: "codex",
            generatorVersion: "0.6.0",
            desired: [{ path: "AGENTS.md", sourceId: "agents", kind: "file", content: "second\n" }],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(GlobalManagedManifestError);

    await expect(access(join(first.path, "steering", "harnix.md"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(first.path, "harnix", "managed.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("restores a prior snapshot when manifest-last write fails without a concurrent editor", async () => {
    const root = await temporaryGlobalRoot();
    const target = join(root.path, "steering", "harnix.md");
    const manifest = join(root.path, "harnix", "managed.json");
    const writer = async (path: string, content: string): Promise<void> => {
      if (path === manifest) throw new Error("manifest write failed");
      await atomicWriteFile(path, content);
    };

    await expect(
      reconcileGlobalManagedFiles({
        root,
        manifestPath: "harnix/managed.json",
        platform: "kiro",
        generatorVersion: "0.6.0",
        desired: [{ path: "steering/harnix.md", sourceId: "steering", kind: "file", content: "generated\n" }],
        writer,
      }),
    ).rejects.toMatchObject({ rollback: { restored: ["steering/harnix.md"], partial: [] } });

    await expect(access(target)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("writes the manifest last and rolls back only outputs that still exactly match Harnix output", async () => {
    const root = await temporaryGlobalRoot();
    const target = join(root.path, "steering", "harnix.md");
    const manifest = join(root.path, "harnix", "managed.json");
    const writes: string[] = [];
    const writer = async (path: string, content: string): Promise<void> => {
      writes.push(path);
      if (path === manifest) {
        await writeFile(target, "editor won the race\n");
        throw new Error("manifest write failed");
      }
      await atomicWriteFile(path, content);
    };

    let failure: GlobalManagedTransactionError | undefined;
    try {
      await reconcileGlobalManagedFiles({
        root,
        manifestPath: "harnix/managed.json",
        platform: "kiro",
        generatorVersion: "0.6.0",
        desired: [{ path: "steering/harnix.md", sourceId: "steering", kind: "file", content: "generated\n" }],
        writer,
      });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(GlobalManagedTransactionError);
      failure = error as GlobalManagedTransactionError;
    }

    expect(writes.at(-1)).toBe(manifest);
    expect(await readFile(target, "utf8")).toBe("editor won the race\n");
    expect(failure?.rollback.partial).toEqual(["steering/harnix.md"]);
    await expect(access(manifest)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rechecks each target snapshot immediately before apply and preserves a concurrent editor write", async () => {
    const root = await temporaryGlobalRoot();
    const firstTarget = join(root.path, "a-first.md");
    const concurrentTarget = join(root.path, "b-concurrent.md");
    const manifest = join(root.path, "harnix", "managed.json");
    const writer = async (path: string, content: string): Promise<void> => {
      await atomicWriteFile(path, content);
      if (path === firstTarget) {
        await writeFile(concurrentTarget, "editor-owned content\n");
      }
    };

    await expect(
      reconcileGlobalManagedFiles({
        root,
        manifestPath: "harnix/managed.json",
        platform: "kiro",
        generatorVersion: "0.6.0",
        desired: [
          { path: "a-first.md", sourceId: "first", kind: "file", content: "first generated\n" },
          { path: "b-concurrent.md", sourceId: "second", kind: "file", content: "second generated\n" },
        ],
        writer,
      }),
    ).rejects.toMatchObject({
      rollback: { restored: ["a-first.md"], partial: [] },
    });

    await expect(access(firstTarget)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(concurrentTarget, "utf8")).resolves.toBe("editor-owned content\n");
    await expect(access(manifest)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rechecks a removal snapshot immediately before deleting an obsolete owned file", async () => {
    const root = await temporaryGlobalRoot();
    const firstTarget = join(root.path, "a-first.md");
    const obsoleteTarget = join(root.path, "b-obsolete.md");
    const manifest = join(root.path, "harnix", "managed.json");
    const base = {
      root,
      manifestPath: "harnix/managed.json",
      platform: "kiro" as const,
      generatorVersion: "0.6.0",
    };
    await reconcileGlobalManagedFiles({
      ...base,
      desired: [
        { path: "a-first.md", sourceId: "first", kind: "file", content: "old first\n" },
        { path: "b-obsolete.md", sourceId: "obsolete", kind: "file", content: "old obsolete\n" },
      ],
    });
    const manifestBefore = await readFile(manifest, "utf8");
    const writer = async (path: string, content: string): Promise<void> => {
      await atomicWriteFile(path, content);
      if (path === firstTarget) {
        await writeFile(obsoleteTarget, "editor-owned obsolete file\n");
      }
    };

    await expect(
      reconcileGlobalManagedFiles({
        ...base,
        generatorVersion: "0.7.0",
        desired: [{ path: "a-first.md", sourceId: "first", kind: "file", content: "new first\n" }],
        removeObsolete: true,
        writer,
      }),
    ).rejects.toMatchObject({
      rollback: { restored: ["a-first.md"], partial: [] },
    });

    await expect(readFile(firstTarget, "utf8")).resolves.toBe("old first\n");
    await expect(readFile(obsoleteTarget, "utf8")).resolves.toBe("editor-owned obsolete file\n");
    await expect(readFile(manifest, "utf8")).resolves.toBe(manifestBefore);
  });
});
