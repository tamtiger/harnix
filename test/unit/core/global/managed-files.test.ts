import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GlobalManagedManifestError,
  reconcileGlobalManagedFiles,
  validateGlobalManagedManifest,
} from "src/core/global/managed-files.js";
import { sha256 } from "src/utils/hashing.js";
import { createVerifiedUserRoot, type UserPathRoot } from "src/core/platform/user-paths.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRoot = useTemporaryRepositories("harnix-global-managed-");

const markerSelector = { type: "markers" as const, begin: "<!-- harnix:begin -->", end: "<!-- harnix:end -->" };
const jsonSelector = {
  type: "json-array-member" as const,
  pointer: "/hooks/UserPromptSubmit",
  memberId: "harnix-context",
};
const codexContextCommand = "harnix context --platform codex";

async function temporaryGlobalRoot(logicalPath = "~/test-global"): Promise<UserPathRoot> {
  return createVerifiedUserRoot(await temporaryRoot(), logicalPath);
}

describe("global managed files", () => {
  it("validates canonical per-root manifests and rejects unsafe or overlapping fragments", () => {
    const manifest = {
      generator: "harnix" as const,
      schemaVersion: 1 as const,
      platform: "codex" as const,
      entries: [
        {
          path: "AGENTS.md",
          sourceId: "agents",
          kind: "managed-block" as const,
          selector: markerSelector,
          generatedHash: sha256("block"),
          generatorVersion: "0.5.0",
        },
        {
          path: "hooks.json",
          sourceId: "hook",
          kind: "json-member" as const,
          selector: jsonSelector,
          generatedHash: sha256("member"),
          generatorVersion: "0.5.0",
        },
      ],
    };

    expect(validateGlobalManagedManifest(manifest)).toEqual(manifest);
    expect(() =>
      validateGlobalManagedManifest({ ...manifest, entries: [{ ...manifest.entries[0], selector: undefined }] }),
    ).toThrow(GlobalManagedManifestError);
    expect(() =>
      validateGlobalManagedManifest({
        ...manifest,
        entries: [{ ...manifest.entries[0], kind: "file", selector: markerSelector }],
      }),
    ).toThrow("must not use a selector");
    expect(() =>
      validateGlobalManagedManifest({
        ...manifest,
        entries: [
          {
            ...manifest.entries[0],
            selector: { type: "markers", begin: "<!-- harnix:begin -->", end: "harnix:begin" },
          },
        ],
      }),
    ).toThrow("overlap");
    expect(() =>
      validateGlobalManagedManifest({ ...manifest, entries: [{ ...manifest.entries[0], path: "../AGENTS.md" }] }),
    ).toThrow("safe");
    expect(() =>
      validateGlobalManagedManifest({ ...manifest, entries: [{ ...manifest.entries[0], path: "skills/\0invalid" }] }),
    ).toThrow("safe");
    expect(() =>
      validateGlobalManagedManifest({
        ...manifest,
        entries: [{ ...manifest.entries[0], sourceId: "agents\0invalid" }],
      }),
    ).toThrow("safe canonical values");
    expect(() =>
      validateGlobalManagedManifest({
        ...manifest,
        entries: [{ ...manifest.entries[1], selector: { ...jsonSelector, pointer: "hooks/UserPromptSubmit" } }],
      }),
    ).toThrow("canonical JSON pointer");
    expect(() =>
      validateGlobalManagedManifest({
        ...manifest,
        entries: [manifest.entries[0], { ...manifest.entries[0], sourceId: "another-source" }],
      }),
    ).toThrow("overlap");
    expect(() =>
      validateGlobalManagedManifest({
        ...manifest,
        entries: [
          {
            ...manifest.entries[0],
            sourceId: "agents-a",
            selector: { type: "markers", begin: "<!-- harnix:a -->", end: "<!-- harnix:shared -->" },
          },
          {
            ...manifest.entries[0],
            sourceId: "agents-b",
            selector: { type: "markers", begin: "<!-- harnix:shared -->", end: "<!-- harnix:b -->" },
          },
        ],
      }),
    ).toThrow("overlap");
    expect(() =>
      validateGlobalManagedManifest({
        ...manifest,
        entries: [
          {
            ...manifest.entries[0],
            sourceId: "agents-a",
            selector: { type: "markers", begin: "<!-- harnix:a -->", end: "<!-- harnix:shared boundary -->" },
          },
          {
            ...manifest.entries[0],
            sourceId: "agents-b",
            selector: { type: "markers", begin: "harnix:shared", end: "<!-- harnix:b -->" },
          },
        ],
      }),
    ).toThrow("overlap");
  });

  it("rejects desired marker content that would make the next reconciliation malformed", async () => {
    const root = await temporaryGlobalRoot();

    await expect(
      reconcileGlobalManagedFiles({
        root,
        manifestPath: "harnix/managed.json",
        platform: "codex",
        generatorVersion: "0.6.0",
        desired: [
          {
            path: "AGENTS.md",
            sourceId: "agents",
            kind: "managed-block",
            selector: markerSelector,
            content: "Safe text followed by <!-- harnix:begin --> a nested marker.",
          },
        ],
      }),
    ).rejects.toThrow(/marker content/i);

    await expect(access(join(root.path, "AGENTS.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects a desired JSON member that does not match its own stable selector", async () => {
    const root = await temporaryGlobalRoot();

    await expect(
      reconcileGlobalManagedFiles({
        root,
        manifestPath: "harnix/managed.json",
        platform: "codex",
        generatorVersion: "0.6.0",
        desired: [
          {
            path: "hooks.json",
            sourceId: "hook",
            kind: "json-member",
            selector: jsonSelector,
            member: { id: "different-id", command: codexContextCommand },
          },
        ],
      }),
    ).rejects.toThrow(/does not match/i);

    await expect(access(join(root.path, "hooks.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("treats prototype-named JSON pointer tokens as own data without mutating prototypes", async () => {
    const root = await temporaryGlobalRoot();
    const selector = { type: "json-array-member" as const, pointer: "/__proto__/hooks", memberId: "harnix-context" };

    try {
      await reconcileGlobalManagedFiles({
        root,
        manifestPath: "harnix/managed.json",
        platform: "codex",
        generatorVersion: "0.6.0",
        desired: [
          {
            path: "hooks.json",
            sourceId: "hook",
            kind: "json-member",
            selector,
            member: { id: "harnix-context", command: codexContextCommand },
          },
        ],
      });

      const document = JSON.parse(await readFile(join(root.path, "hooks.json"), "utf8")) as Record<string, unknown>;
      expect(Object.hasOwn(document, "__proto__")).toBe(true);
      expect((document.__proto__ as { hooks: unknown[] }).hooks).toHaveLength(1);
      expect(Object.hasOwn(Object.prototype, "hooks")).toBe(false);
    } finally {
      delete (Object.prototype as { hooks?: unknown }).hooks;
    }
  });

  it("preserves a pre-existing whole target as an untracked collision and never claims it", async () => {
    const root = await temporaryGlobalRoot();
    await writeFile(join(root.path, "skills.md"), "owned by user\n");

    const result = await reconcileGlobalManagedFiles({
      root,
      manifestPath: "harnix/managed.json",
      platform: "kiro",
      generatorVersion: "0.6.0",
      desired: [{ path: "skills.md", sourceId: "skill", kind: "file", content: "owned by harnix\n" }],
    });

    expect(await readFile(join(root.path, "skills.md"), "utf8")).toBe("owned by user\n");
    expect(result.preserved).toEqual(["skills.md"]);
    expect(result.manifest.entries).toEqual([]);
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "untracked-collision", path: "skills.md" }));
    await expect(access(join(root.path, "harnix", "managed.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("preserves a pre-existing Harnix skill unit before creating a missing skill file", async () => {
    const root = await temporaryGlobalRoot();
    const unit = join(root.path, "skills", "harnix-check");
    await mkdir(unit, { recursive: true });
    await writeFile(join(unit, "USER-NOTES.md"), "user-owned skill unit\n");

    const result = await reconcileGlobalManagedFiles({
      root,
      manifestPath: "harnix/managed.json",
      platform: "kiro",
      generatorVersion: "0.6.0",
      preserveUnownedSkillDirectories: true,
      desired: [{ path: "skills/harnix-check/SKILL.md", sourceId: "check", kind: "file", content: "generated\n" }],
    });

    await expect(readFile(join(unit, "USER-NOTES.md"), "utf8")).resolves.toBe("user-owned skill unit\n");
    await expect(access(join(unit, "SKILL.md"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root.path, "harnix", "managed.json"))).rejects.toMatchObject({ code: "ENOENT" });
    expect(result.manifest.entries).toEqual([]);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: "untracked-collision", path: "skills/harnix-check/SKILL.md" }),
    );
  });
});
