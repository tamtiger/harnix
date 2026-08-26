import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { atomicWriteFile } from "../../src/utils/atomic-write.js";
import {
  GlobalManagedManifestError,
  GlobalManagedTransactionError,
  reconcileGlobalManagedFiles,
  reconcileGlobalManagedRoots,
  validateGlobalManagedManifest,
} from "../../src/utils/global-managed-files.js";
import { sha256 } from "../../src/utils/hashing.js";
import { createVerifiedUserRoot, type UserPathRoot } from "../../src/utils/user-paths.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRoot = useTemporaryRepositories("harnix-global-managed-");

const markerSelector = { type: "markers" as const, begin: "<!-- harnix:begin -->", end: "<!-- harnix:end -->" };
const jsonSelector = { type: "json-array-member" as const, pointer: "/hooks/UserPromptSubmit", memberId: "harnix-context" };
const legacyCodexContextCommand = "harnix internal context --platform codex";
const codexContextCommand = "harnix context --platform codex";
const lockRecordName = "owner-00000000-0000-4000-8000-000000000001.json";

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
        { path: "AGENTS.md", sourceId: "agents", kind: "managed-block" as const, selector: markerSelector, generatedHash: sha256("block"), generatorVersion: "0.5.0" },
        { path: "hooks.json", sourceId: "hook", kind: "json-member" as const, selector: jsonSelector, generatedHash: sha256("member"), generatorVersion: "0.5.0" },
      ],
    };

    expect(validateGlobalManagedManifest(manifest)).toEqual(manifest);
    expect(() => validateGlobalManagedManifest({ ...manifest, entries: [{ ...manifest.entries[0], selector: undefined }] })).toThrow(GlobalManagedManifestError);
    expect(() => validateGlobalManagedManifest({ ...manifest, entries: [{ ...manifest.entries[0], kind: "file", selector: markerSelector }] })).toThrow("must not use a selector");
    expect(() => validateGlobalManagedManifest({ ...manifest, entries: [{ ...manifest.entries[0], selector: { type: "markers", begin: "<!-- harnix:begin -->", end: "harnix:begin" } }] })).toThrow("overlap");
    expect(() => validateGlobalManagedManifest({ ...manifest, entries: [{ ...manifest.entries[0], path: "../AGENTS.md" }] })).toThrow("safe");
    expect(() => validateGlobalManagedManifest({ ...manifest, entries: [{ ...manifest.entries[0], path: "skills/\0invalid" }] })).toThrow("safe");
    expect(() => validateGlobalManagedManifest({ ...manifest, entries: [{ ...manifest.entries[0], sourceId: "agents\0invalid" }] })).toThrow("safe canonical values");
    expect(() => validateGlobalManagedManifest({ ...manifest, entries: [{ ...manifest.entries[1], selector: { ...jsonSelector, pointer: "hooks/UserPromptSubmit" } }] })).toThrow("canonical JSON pointer");
    expect(() => validateGlobalManagedManifest({ ...manifest, entries: [manifest.entries[0], { ...manifest.entries[0], sourceId: "another-source" }] })).toThrow("overlap");
    expect(() => validateGlobalManagedManifest({
      ...manifest,
      entries: [
        { ...manifest.entries[0], sourceId: "agents-a", selector: { type: "markers", begin: "<!-- harnix:a -->", end: "<!-- harnix:shared -->" } },
        { ...manifest.entries[0], sourceId: "agents-b", selector: { type: "markers", begin: "<!-- harnix:shared -->", end: "<!-- harnix:b -->" } },
      ],
    })).toThrow("overlap");
    expect(() => validateGlobalManagedManifest({
      ...manifest,
      entries: [
        { ...manifest.entries[0], sourceId: "agents-a", selector: { type: "markers", begin: "<!-- harnix:a -->", end: "<!-- harnix:shared boundary -->" } },
        { ...manifest.entries[0], sourceId: "agents-b", selector: { type: "markers", begin: "harnix:shared", end: "<!-- harnix:b -->" } },
      ],
    })).toThrow("overlap");
  });

  it("rejects desired marker content that would make the next reconciliation malformed", async () => {
    const root = await temporaryGlobalRoot();

    await expect(reconcileGlobalManagedFiles({
      root,
      manifestPath: "harnix/managed.json",
      platform: "codex",
      generatorVersion: "0.6.0",
      desired: [{
        path: "AGENTS.md",
        sourceId: "agents",
        kind: "managed-block",
        selector: markerSelector,
        content: "Safe text followed by <!-- harnix:begin --> a nested marker.",
      }],
    })).rejects.toThrow(/marker content/i);

    await expect(access(join(root.path, "AGENTS.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects a desired JSON member that does not match its own stable selector", async () => {
    const root = await temporaryGlobalRoot();

    await expect(reconcileGlobalManagedFiles({
      root,
      manifestPath: "harnix/managed.json",
      platform: "codex",
      generatorVersion: "0.6.0",
      desired: [{
        path: "hooks.json",
        sourceId: "hook",
        kind: "json-member",
        selector: jsonSelector,
        member: { id: "different-id", command: codexContextCommand },
      }],
    })).rejects.toThrow(/does not match/i);

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
        desired: [{
          path: "hooks.json",
          sourceId: "hook",
          kind: "json-member",
          selector,
          member: { id: "harnix-context", command: codexContextCommand },
        }],
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
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "untracked-collision", path: "skills/harnix-check/SKILL.md" }));
  });

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
      desired: [{ path: "plugin.json", sourceId: "plugin", kind: "file", content: "{\"name\":\"harnix\"}\n" }],
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
    expect(collision.warnings).toContainEqual(expect.objectContaining({ code: "untracked-collision", path: "hooks.json" }));

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
    expect(unproven.warnings).toContainEqual(expect.objectContaining({ code: "untracked-collision", path: "hooks.json" }));
  });

  it("fails closed on a corrupt sidecar before attempting a global target write", async () => {
    const root = await temporaryGlobalRoot();
    const manifestPath = join(root.path, "harnix", "managed.json");
    await mkdir(join(root.path, "harnix"), { recursive: true });
    await writeFile(manifestPath, "not-json");
    let writes = 0;

    await expect(reconcileGlobalManagedFiles({
      root,
      manifestPath: "harnix/managed.json",
      platform: "kiro",
      generatorVersion: "0.6.0",
      desired: [{ path: "steering/harnix.md", sourceId: "steering", kind: "file", content: "generated\n" }],
      writer: async () => { writes += 1; },
    })).rejects.toBeInstanceOf(GlobalManagedManifestError);

    expect(writes).toBe(0);
    await expect(access(join(root.path, "steering", "harnix.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_reject_a_sidecar_when_it_claims_ownership_of_itself", async () => {
    const root = await temporaryGlobalRoot();
    const manifestPath = join(root.path, "harnix", "managed.json");
    await mkdir(join(root.path, "harnix"), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify({
      entries: [{
        generatedHash: "0".repeat(64),
        generatorVersion: "0.6.0",
        kind: "file",
        path: "harnix/managed.json",
        sourceId: "invalid-self-owner",
      }],
      generator: "harnix",
      platform: "kiro",
      schemaVersion: 1,
    }, null, 2)}\n`, "utf8");
    let writes = 0;

    await expect(reconcileGlobalManagedFiles({
      root,
      manifestPath: "harnix/managed.json",
      platform: "kiro",
      generatorVersion: "0.6.0",
      desired: [{ path: "steering/harnix.md", sourceId: "steering", kind: "file", content: "generated\n" }],
      writer: async () => { writes += 1; },
    })).rejects.toBeInstanceOf(GlobalManagedManifestError);

    expect(writes).toBe(0);
    await expect(access(join(root.path, "steering", "harnix.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("merges a marker block, updates only its unchanged fragment, and preserves a modified block", async () => {
    const root = await temporaryGlobalRoot();
    const agentsPath = join(root.path, "AGENTS.md");
    await writeFile(agentsPath, "# User guide\n\nKeep this text.\n");
    const base = {
      root,
      manifestPath: "harnix/managed.json",
      platform: "codex" as const,
      generatorVersion: "0.6.0",
    };

    const installed = await reconcileGlobalManagedFiles({ ...base, desired: [{ path: "AGENTS.md", sourceId: "agents", kind: "managed-block", selector: markerSelector, content: "Read Harnix state when present." }] });
    expect(await readFile(agentsPath, "utf8")).toContain("<!-- harnix:begin -->\nRead Harnix state when present.\n<!-- harnix:end -->");

    await writeFile(agentsPath, `# User guide\n\nUser changed this line.\n\n${await readFile(agentsPath, "utf8").then((text) => text.slice(text.indexOf("<!-- harnix:begin -->")))}`);
    const updated = await reconcileGlobalManagedFiles({ ...base, generatorVersion: "0.7.0", desired: [{ path: "AGENTS.md", sourceId: "agents", kind: "managed-block", selector: markerSelector, content: "Read current Harnix state when present." }] });
    expect(await readFile(agentsPath, "utf8")).toContain("User changed this line.");
    expect(await readFile(agentsPath, "utf8")).toContain("Read current Harnix state when present.");
    expect(updated.updated).toEqual(["AGENTS.md#agents"]);

    await writeFile(agentsPath, (await readFile(agentsPath, "utf8")).replace("Read current Harnix state when present.", "User changed the Harnix block."));
    const preserved = await reconcileGlobalManagedFiles({ ...base, generatorVersion: "0.8.0", desired: [{ path: "AGENTS.md", sourceId: "agents", kind: "managed-block", selector: markerSelector, content: "A later generated block." }] });
    expect(await readFile(agentsPath, "utf8")).toContain("User changed the Harnix block.");
    expect(preserved.preserved).toEqual(["AGENTS.md#agents"]);
    expect(preserved.warnings).toContainEqual(expect.objectContaining({ code: "modified", path: "AGENTS.md#agents" }));
    expect(installed.manifest.entries).toHaveLength(1);
  });

  it("merges a JSON array member without overwriting unrelated handlers, but preserves an edited Harnix member", async () => {
    const root = await temporaryGlobalRoot();
    const hooksPath = join(root.path, "hooks.json");
    await writeFile(hooksPath, JSON.stringify({ hooks: { UserPromptSubmit: [{ id: "user-handler", command: "user command" }] } }, null, 2));
    const base = {
      root,
      manifestPath: "harnix/managed.json",
      platform: "codex" as const,
      generatorVersion: "0.6.0",
    };
    const first = await reconcileGlobalManagedFiles({
      ...base,
      desired: [{ path: "hooks.json", sourceId: "hook", kind: "json-member", selector: jsonSelector, member: { id: "harnix-context", command: legacyCodexContextCommand, timeout: 5 } }],
    });
    const afterInstall = JSON.parse(await readFile(hooksPath, "utf8")) as { hooks: { UserPromptSubmit: Array<Record<string, unknown>> } };
    expect(afterInstall.hooks.UserPromptSubmit).toEqual(expect.arrayContaining([expect.objectContaining({ id: "user-handler" }), expect.objectContaining({ id: "harnix-context", timeout: 5 })]));

    afterInstall.hooks.UserPromptSubmit[0]!.command = "user command changed";
    await writeFile(hooksPath, `${JSON.stringify(afterInstall, null, 2)}\n`);
    const updated = await reconcileGlobalManagedFiles({
      ...base,
      generatorVersion: "0.7.0",
      desired: [{ path: "hooks.json", sourceId: "hook", kind: "json-member", selector: jsonSelector, member: { id: "harnix-context", command: codexContextCommand, timeout: 6 } }],
    });
    const afterUpdate = JSON.parse(await readFile(hooksPath, "utf8")) as { hooks: { UserPromptSubmit: Array<Record<string, unknown>> } };
    expect(afterUpdate.hooks.UserPromptSubmit).toEqual(expect.arrayContaining([expect.objectContaining({ id: "user-handler", command: "user command changed" }), expect.objectContaining({ id: "harnix-context", command: codexContextCommand, timeout: 6 })]));
    expect(updated.updated).toEqual(["hooks.json#hook"]);

    const harnixMember = afterUpdate.hooks.UserPromptSubmit.find((member) => member.id === "harnix-context");
    harnixMember!.timeout = 99;
    await writeFile(hooksPath, `${JSON.stringify(afterUpdate, null, 2)}\n`);
    const preserved = await reconcileGlobalManagedFiles({
      ...base,
      generatorVersion: "0.8.0",
      desired: [{ path: "hooks.json", sourceId: "hook", kind: "json-member", selector: jsonSelector, member: { id: "harnix-context", command: "new command", timeout: 7 } }],
    });
    expect(JSON.parse(await readFile(hooksPath, "utf8")).hooks.UserPromptSubmit.find((member: { id: string }) => member.id === "harnix-context").timeout).toBe(99);
    expect(preserved.warnings).toContainEqual(expect.objectContaining({ code: "modified", path: "hooks.json#hook" }));
    expect(first.manifest.entries).toHaveLength(1);
  });

  it("preserves an untracked JSON member collision instead of claiming its identity", async () => {
    const root = await temporaryGlobalRoot();
    const hooksPath = join(root.path, "hooks.json");
    await writeFile(hooksPath, `${JSON.stringify({ hooks: { UserPromptSubmit: [{ id: "harnix-context", command: "someone else" }] } }, null, 2)}\n`);

    const result = await reconcileGlobalManagedFiles({
      root,
      manifestPath: "harnix/managed.json",
      platform: "codex",
      generatorVersion: "0.6.0",
      desired: [{ path: "hooks.json", sourceId: "hook", kind: "json-member", selector: jsonSelector, member: { id: "harnix-context", command: codexContextCommand } }],
    });

    expect(JSON.parse(await readFile(hooksPath, "utf8")).hooks.UserPromptSubmit[0].command).toBe("someone else");
    expect(result.manifest.entries).toEqual([]);
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "untracked-collision", path: "hooks.json#hook" }));
  });

  it("removes only an unchanged obsolete global file and drops its ownership entry", async () => {
    const root = await temporaryGlobalRoot();
    const base = { root, manifestPath: "harnix/managed.json", platform: "kiro" as const, generatorVersion: "0.6.0" };
    await reconcileGlobalManagedFiles({ ...base, desired: [{ path: "skills/harnix-check/SKILL.md", sourceId: "check", kind: "file", content: "generated\n" }] });

    const removed = await reconcileGlobalManagedFiles({ ...base, desired: [], removeObsolete: true });

    await expect(access(join(root.path, "skills", "harnix-check", "SKILL.md"))).rejects.toMatchObject({ code: "ENOENT" });
    expect(removed.deleted).toEqual(["skills/harnix-check/SKILL.md"]);
    expect(removed.manifest.entries).toEqual([]);
  });

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
      writer: async () => { writes += 1; },
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

    await expect(reconcileGlobalManagedRoots({ reconciliations: [secondRequest, firstRequest] })).rejects.toMatchObject({ rollback: expect.objectContaining({ restored: expect.arrayContaining(["~/first-platform/steering/harnix.md"]) }) });
    await expect(access(firstTarget)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(first.path, "harnix", "managed.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("does not begin the first root when a later root has an invalid sidecar during multi-root preflight", async () => {
    const first = await temporaryGlobalRoot("~/first-preflight");
    const second = await temporaryGlobalRoot("~/second-preflight");
    await mkdir(join(second.path, "harnix"), { recursive: true });
    await writeFile(join(second.path, "harnix", "managed.json"), "invalid");

    await expect(reconcileGlobalManagedRoots({
      reconciliations: [
        { root: first, manifestPath: "harnix/managed.json", platform: "kiro", generatorVersion: "0.6.0", desired: [{ path: "steering/harnix.md", sourceId: "steering", kind: "file", content: "first\n" }] },
        { root: second, manifestPath: "harnix/managed.json", platform: "codex", generatorVersion: "0.6.0", desired: [{ path: "AGENTS.md", sourceId: "agents", kind: "file", content: "second\n" }] },
      ],
    })).rejects.toBeInstanceOf(GlobalManagedManifestError);

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

    await expect(reconcileGlobalManagedFiles({
      root,
      manifestPath: "harnix/managed.json",
      platform: "kiro",
      generatorVersion: "0.6.0",
      desired: [{ path: "steering/harnix.md", sourceId: "steering", kind: "file", content: "generated\n" }],
      writer,
    })).rejects.toMatchObject({ rollback: { restored: ["steering/harnix.md"], partial: [] } });

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

    await expect(reconcileGlobalManagedFiles({
      root,
      manifestPath: "harnix/managed.json",
      platform: "kiro",
      generatorVersion: "0.6.0",
      desired: [
        { path: "a-first.md", sourceId: "first", kind: "file", content: "first generated\n" },
        { path: "b-concurrent.md", sourceId: "second", kind: "file", content: "second generated\n" },
      ],
      writer,
    })).rejects.toMatchObject({
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

    await expect(reconcileGlobalManagedFiles({
      ...base,
      generatorVersion: "0.7.0",
      desired: [{ path: "a-first.md", sourceId: "first", kind: "file", content: "new first\n" }],
      removeObsolete: true,
      writer,
    })).rejects.toMatchObject({
      rollback: { restored: ["a-first.md"], partial: [] },
    });

    await expect(readFile(firstTarget, "utf8")).resolves.toBe("old first\n");
    await expect(readFile(obsoleteTarget, "utf8")).resolves.toBe("editor-owned obsolete file\n");
    await expect(readFile(manifest, "utf8")).resolves.toBe(manifestBefore);
  });
});
