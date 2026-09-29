import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GlobalManagedManifestError, reconcileGlobalManagedFiles } from "src/utils/global-managed-files.js";
import { createVerifiedUserRoot, type UserPathRoot } from "src/utils/user-paths.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRoot = useTemporaryRepositories("harnix-global-managed-");

const lockRecordName = "owner-00000000-0000-4000-8000-000000000001.json";

async function temporaryGlobalRoot(logicalPath = "~/test-global"): Promise<UserPathRoot> {
  return createVerifiedUserRoot(await temporaryRoot(), logicalPath);
}

describe("global managed files: sidecar and lock ownership", () => {
  it("permits only its own lock-created plugin root but preserves concurrent root content", async () => {
    const lockOnlyRoot = await temporaryGlobalRoot("~/lock-only-plugin");
    await mkdir(join(lockOnlyRoot.path, ".managed.lock"), { recursive: true });
    await writeFile(join(lockOnlyRoot.path, ".managed.lock", lockRecordName), "harnix-owned lock\n");

    await reconcileGlobalManagedFiles({
      root: lockOnlyRoot,
      manifestPath: ".managed.json",
      platform: "antigravity-desktop",
      generatorVersion: "0.6.0",
      preserveUnownedRoot: true,
      ownedRootLockContent: "harnix-owned lock\n",
      ownedRootLockPath: ".managed.lock",
      ownedRootLockRecordName: lockRecordName,
      desired: [{ path: "plugin.json", sourceId: "plugin", kind: "file", content: '{"name":"harnix"}\n' }],
    });
    await expect(access(join(lockOnlyRoot.path, "plugin.json"))).resolves.toBeUndefined();
    await expect(access(join(lockOnlyRoot.path, ".managed.json"))).resolves.toBeUndefined();

    const concurrentRoot = await temporaryGlobalRoot("~/concurrent-plugin");
    await mkdir(join(concurrentRoot.path, ".managed.lock"), { recursive: true });
    await writeFile(join(concurrentRoot.path, ".managed.lock", lockRecordName), "harnix-owned lock\n");
    await writeFile(join(concurrentRoot.path, "plugin.json"), "user plugin\n");
    const collision = await reconcileGlobalManagedFiles({
      root: concurrentRoot,
      manifestPath: ".managed.json",
      platform: "antigravity-desktop",
      generatorVersion: "0.6.0",
      preserveUnownedRoot: true,
      ownedRootLockContent: "harnix-owned lock\n",
      ownedRootLockPath: ".managed.lock",
      ownedRootLockRecordName: lockRecordName,
      desired: [{ path: "hooks.json", sourceId: "hook", kind: "file", content: "{}\n" }],
    });

    await expect(readFile(join(concurrentRoot.path, "plugin.json"), "utf8")).resolves.toBe("user plugin\n");
    await expect(access(join(concurrentRoot.path, "hooks.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(concurrentRoot.path, ".managed.json"))).rejects.toMatchObject({ code: "ENOENT" });
    expect(collision.warnings).toContainEqual(
      expect.objectContaining({ code: "untracked-collision", path: "hooks.json" }),
    );

    const unprovenLockRoot = await temporaryGlobalRoot("~/unproven-plugin-lock");
    await mkdir(join(unprovenLockRoot.path, ".managed.lock"), { recursive: true });
    await writeFile(join(unprovenLockRoot.path, ".managed.lock", lockRecordName), "harnix-owned lock\n");
    const unproven = await reconcileGlobalManagedFiles({
      root: unprovenLockRoot,
      manifestPath: ".managed.json",
      platform: "antigravity-desktop",
      generatorVersion: "0.6.0",
      preserveUnownedRoot: true,
      desired: [{ path: "hooks.json", sourceId: "hook", kind: "file", content: "{}\n" }],
    });
    await expect(access(join(unprovenLockRoot.path, "hooks.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(unprovenLockRoot.path, ".managed.json"))).rejects.toMatchObject({ code: "ENOENT" });
    expect(unproven.warnings).toContainEqual(
      expect.objectContaining({ code: "untracked-collision", path: "hooks.json" }),
    );
  });

  it("fails closed on a corrupt sidecar before attempting a global target write", async () => {
    const root = await temporaryGlobalRoot();
    const manifestPath = join(root.path, "harnix", "managed.json");
    await mkdir(join(root.path, "harnix"), { recursive: true });
    await writeFile(manifestPath, "not-json");
    let writes = 0;

    await expect(
      reconcileGlobalManagedFiles({
        root,
        manifestPath: "harnix/managed.json",
        platform: "kiro",
        generatorVersion: "0.6.0",
        desired: [{ path: "steering/harnix.md", sourceId: "steering", kind: "file", content: "generated\n" }],
        writer: async () => {
          writes += 1;
        },
      }),
    ).rejects.toBeInstanceOf(GlobalManagedManifestError);

    expect(writes).toBe(0);
    await expect(access(join(root.path, "steering", "harnix.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_reject_a_sidecar_when_it_claims_ownership_of_itself", async () => {
    const root = await temporaryGlobalRoot();
    const manifestPath = join(root.path, "harnix", "managed.json");
    await mkdir(join(root.path, "harnix"), { recursive: true });
    await writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          entries: [
            {
              generatedHash: "0".repeat(64),
              generatorVersion: "0.6.0",
              kind: "file",
              path: "harnix/managed.json",
              sourceId: "invalid-self-owner",
            },
          ],
          generator: "harnix",
          platform: "kiro",
          schemaVersion: 1,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    let writes = 0;

    await expect(
      reconcileGlobalManagedFiles({
        root,
        manifestPath: "harnix/managed.json",
        platform: "kiro",
        generatorVersion: "0.6.0",
        desired: [{ path: "steering/harnix.md", sourceId: "steering", kind: "file", content: "generated\n" }],
        writer: async () => {
          writes += 1;
        },
      }),
    ).rejects.toBeInstanceOf(GlobalManagedManifestError);

    expect(writes).toBe(0);
    await expect(access(join(root.path, "steering", "harnix.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
