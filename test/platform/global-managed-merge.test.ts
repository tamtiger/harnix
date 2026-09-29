import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { reconcileGlobalManagedFiles } from "src/utils/global-managed-files.js";
import { createVerifiedUserRoot, type UserPathRoot } from "src/utils/user-paths.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRoot = useTemporaryRepositories("harnix-global-managed-");

const markerSelector = { type: "markers" as const, begin: "<!-- harnix:begin -->", end: "<!-- harnix:end -->" };
const jsonSelector = {
  type: "json-array-member" as const,
  pointer: "/hooks/UserPromptSubmit",
  memberId: "harnix-context",
};
const legacyCodexContextCommand = "harnix internal context --platform codex";
const codexContextCommand = "harnix context --platform codex";

async function temporaryGlobalRoot(logicalPath = "~/test-global"): Promise<UserPathRoot> {
  return createVerifiedUserRoot(await temporaryRoot(), logicalPath);
}

describe("global managed files: marker and JSON merges", () => {
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

    const installed = await reconcileGlobalManagedFiles({
      ...base,
      desired: [
        {
          path: "AGENTS.md",
          sourceId: "agents",
          kind: "managed-block",
          selector: markerSelector,
          content: "Read Harnix state when present.",
        },
      ],
    });
    expect(await readFile(agentsPath, "utf8")).toContain(
      "<!-- harnix:begin -->\nRead Harnix state when present.\n<!-- harnix:end -->",
    );

    await writeFile(
      agentsPath,
      `# User guide\n\nUser changed this line.\n\n${await readFile(agentsPath, "utf8").then((text) => text.slice(text.indexOf("<!-- harnix:begin -->")))}`,
    );
    const updated = await reconcileGlobalManagedFiles({
      ...base,
      generatorVersion: "0.7.0",
      desired: [
        {
          path: "AGENTS.md",
          sourceId: "agents",
          kind: "managed-block",
          selector: markerSelector,
          content: "Read current Harnix state when present.",
        },
      ],
    });
    expect(await readFile(agentsPath, "utf8")).toContain("User changed this line.");
    expect(await readFile(agentsPath, "utf8")).toContain("Read current Harnix state when present.");
    expect(updated.updated).toEqual(["AGENTS.md#agents"]);

    await writeFile(
      agentsPath,
      (await readFile(agentsPath, "utf8")).replace(
        "Read current Harnix state when present.",
        "User changed the Harnix block.",
      ),
    );
    const preserved = await reconcileGlobalManagedFiles({
      ...base,
      generatorVersion: "0.8.0",
      desired: [
        {
          path: "AGENTS.md",
          sourceId: "agents",
          kind: "managed-block",
          selector: markerSelector,
          content: "A later generated block.",
        },
      ],
    });
    expect(await readFile(agentsPath, "utf8")).toContain("User changed the Harnix block.");
    expect(preserved.preserved).toEqual(["AGENTS.md#agents"]);
    expect(preserved.warnings).toContainEqual(expect.objectContaining({ code: "modified", path: "AGENTS.md#agents" }));
    expect(installed.manifest.entries).toHaveLength(1);
  });

  it("merges a JSON array member without overwriting unrelated handlers, but preserves an edited Harnix member", async () => {
    const root = await temporaryGlobalRoot();
    const hooksPath = join(root.path, "hooks.json");
    await writeFile(
      hooksPath,
      JSON.stringify({ hooks: { UserPromptSubmit: [{ id: "user-handler", command: "user command" }] } }, null, 2),
    );
    const base = {
      root,
      manifestPath: "harnix/managed.json",
      platform: "codex" as const,
      generatorVersion: "0.6.0",
    };
    const first = await reconcileGlobalManagedFiles({
      ...base,
      desired: [
        {
          path: "hooks.json",
          sourceId: "hook",
          kind: "json-member",
          selector: jsonSelector,
          member: { id: "harnix-context", command: legacyCodexContextCommand, timeout: 5 },
        },
      ],
    });
    const afterInstall = JSON.parse(await readFile(hooksPath, "utf8")) as {
      hooks: { UserPromptSubmit: Array<Record<string, unknown>> };
    };
    expect(afterInstall.hooks.UserPromptSubmit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "user-handler" }),
        expect.objectContaining({ id: "harnix-context", timeout: 5 }),
      ]),
    );

    afterInstall.hooks.UserPromptSubmit[0]!.command = "user command changed";
    await writeFile(hooksPath, `${JSON.stringify(afterInstall, null, 2)}\n`);
    const updated = await reconcileGlobalManagedFiles({
      ...base,
      generatorVersion: "0.7.0",
      desired: [
        {
          path: "hooks.json",
          sourceId: "hook",
          kind: "json-member",
          selector: jsonSelector,
          member: { id: "harnix-context", command: codexContextCommand, timeout: 6 },
        },
      ],
    });
    const afterUpdate = JSON.parse(await readFile(hooksPath, "utf8")) as {
      hooks: { UserPromptSubmit: Array<Record<string, unknown>> };
    };
    expect(afterUpdate.hooks.UserPromptSubmit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "user-handler", command: "user command changed" }),
        expect.objectContaining({ id: "harnix-context", command: codexContextCommand, timeout: 6 }),
      ]),
    );
    expect(updated.updated).toEqual(["hooks.json#hook"]);

    const harnixMember = afterUpdate.hooks.UserPromptSubmit.find((member) => member.id === "harnix-context");
    harnixMember!.timeout = 99;
    await writeFile(hooksPath, `${JSON.stringify(afterUpdate, null, 2)}\n`);
    const preserved = await reconcileGlobalManagedFiles({
      ...base,
      generatorVersion: "0.8.0",
      desired: [
        {
          path: "hooks.json",
          sourceId: "hook",
          kind: "json-member",
          selector: jsonSelector,
          member: { id: "harnix-context", command: "new command", timeout: 7 },
        },
      ],
    });
    expect(
      JSON.parse(await readFile(hooksPath, "utf8")).hooks.UserPromptSubmit.find(
        (member: { id: string }) => member.id === "harnix-context",
      ).timeout,
    ).toBe(99);
    expect(preserved.warnings).toContainEqual(expect.objectContaining({ code: "modified", path: "hooks.json#hook" }));
    expect(first.manifest.entries).toHaveLength(1);
  });

  it("preserves an untracked JSON member collision instead of claiming its identity", async () => {
    const root = await temporaryGlobalRoot();
    const hooksPath = join(root.path, "hooks.json");
    await writeFile(
      hooksPath,
      `${JSON.stringify({ hooks: { UserPromptSubmit: [{ id: "harnix-context", command: "someone else" }] } }, null, 2)}\n`,
    );

    const result = await reconcileGlobalManagedFiles({
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
          member: { id: "harnix-context", command: codexContextCommand },
        },
      ],
    });

    expect(JSON.parse(await readFile(hooksPath, "utf8")).hooks.UserPromptSubmit[0].command).toBe("someone else");
    expect(result.manifest.entries).toEqual([]);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: "untracked-collision", path: "hooks.json#hook" }),
    );
  });

  it("removes only an unchanged obsolete global file and drops its ownership entry", async () => {
    const root = await temporaryGlobalRoot();
    const base = { root, manifestPath: "harnix/managed.json", platform: "kiro" as const, generatorVersion: "0.6.0" };
    await reconcileGlobalManagedFiles({
      ...base,
      desired: [{ path: "skills/harnix-check/SKILL.md", sourceId: "check", kind: "file", content: "generated\n" }],
    });

    const removed = await reconcileGlobalManagedFiles({ ...base, desired: [], removeObsolete: true });

    await expect(access(join(root.path, "skills", "harnix-check", "SKILL.md"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(removed.deleted).toEqual(["skills/harnix-check/SKILL.md"]);
    expect(removed.manifest.entries).toEqual([]);
  });
});
