import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CLAUDE_GLOBAL_MEMBER_MATCHERS, claudeGlobalDesiredFiles } from "src/configurators/claude.js";
import { reconcileGlobalManagedFiles } from "src/core/global/managed-files.js";
import { createVerifiedUserRoot } from "src/core/platform/user-paths.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRoot = useTemporaryRepositories("harnix-settings-json-");
const BOM = String.fromCharCode(0xfeff);

async function claudeRoot() {
  return createVerifiedUserRoot(await temporaryRoot(), "~/.claude");
}

const base = (root: Awaited<ReturnType<typeof claudeRoot>>) => ({
  root,
  manifestPath: "harnix/managed.json",
  platform: "claude" as const,
  generatorVersion: "2.0.5",
  memberMatchers: CLAUDE_GLOBAL_MEMBER_MATCHERS,
});

const settingsOnly = () => claudeGlobalDesiredFiles().filter((file) => file.path === "settings.json");

const samples: [string, string][] = [
  [
    "four-space indent, a large number and keys out of alphabetical order",
    '{\n    "z": 1,\n    "big": 12345678901234567890,\n    "env": { "Z": "1", "A": "2" },\n    "ratio": 1.50\n}\n',
  ],
  ["tab indent", '{\n\t"model": "x"\n}\n'],
  ["CRLF line endings", '{\r\n  "model": "x"\r\n}\r\n'],
  ["a byte order mark", `${BOM}{\n  "model": "x"\n}\n`],
  [
    "other hook events and a user hook group",
    '{\n  "hooks": {\n    "PreToolUse": [ { "matcher": "Bash" } ],\n    "UserPromptSubmit": [ { "hooks": [ { "type": "command", "command": "mine" } ] } ]\n  },\n  "model": "x"\n}\n',
  ],
];

describe("settings.json is edited in place", () => {
  it.each(samples)("setup then uninstall returns the original bytes: %s", async (_name, original) => {
    const root = await claudeRoot();
    const path = join(root.path, "settings.json");
    await writeFile(path, original);

    const installed = await reconcileGlobalManagedFiles({ ...base(root), desired: settingsOnly() });
    const afterSetup = await readFile(path, "utf8");

    expect(installed.created).toHaveLength(2);
    expect(afterSetup).not.toBe(original);
    expect(afterSetup).toContain("harnix context --platform claude");
    expect(afterSetup).toContain("12345678901234567890".slice(0, original.includes("12345678901234567890") ? 20 : 0));
    const removed = await reconcileGlobalManagedFiles({ ...base(root), desired: [], removeObsolete: true });

    expect(removed.deleted).toHaveLength(2);
    await expect(readFile(path, "utf8")).resolves.toBe(original);
  });

  it("is idempotent: a second setup changes nothing", async () => {
    const root = await claudeRoot();
    const path = join(root.path, "settings.json");
    await writeFile(path, '{\n    "z": 1,\n    "big": 12345678901234567890\n}\n');
    await reconcileGlobalManagedFiles({ ...base(root), desired: settingsOnly() });
    const first = await readFile(path, "utf8");

    const again = await reconcileGlobalManagedFiles({ ...base(root), desired: settingsOnly() });

    expect(again.unchanged).toHaveLength(2);
    await expect(readFile(path, "utf8")).resolves.toBe(first);
  });

  it("adds its PreToolUse group beside a user group and removes only its own", async () => {
    const root = await claudeRoot();
    const path = join(root.path, "settings.json");
    const mine = { matcher: "Bash", hooks: [{ type: "command", command: "mine" }] };
    await writeFile(path, JSON.stringify({ hooks: { PreToolUse: [mine] } }, null, 2));

    await reconcileGlobalManagedFiles({ ...base(root), desired: settingsOnly() });
    const installed = JSON.parse(await readFile(path, "utf8")) as { hooks: Record<string, Record<string, unknown>[]> };

    expect(installed.hooks.PreToolUse).toHaveLength(2);
    expect(installed.hooks.PreToolUse![0]).toEqual(mine);
    expect(installed.hooks.PreToolUse![1]).toMatchObject({ matcher: "Grep|Bash" });
    expect(installed.hooks.UserPromptSubmit).toHaveLength(1);

    await reconcileGlobalManagedFiles({ ...base(root), desired: [], removeObsolete: true });
    const removed = JSON.parse(await readFile(path, "utf8")) as { hooks: Record<string, unknown[]> };
    expect(removed.hooks.PreToolUse).toEqual([mine]);
    expect(removed.hooks.UserPromptSubmit).toBeUndefined();
  });

  it("keeps a user-edited PreToolUse group instead of overwriting it", async () => {
    const root = await claudeRoot();
    const path = join(root.path, "settings.json");
    await reconcileGlobalManagedFiles({ ...base(root), desired: settingsOnly() });
    const edited = (await readFile(path, "utf8")).replace('"Grep|Bash"', '"Grep|Bash|Read"');
    await writeFile(path, edited);

    const again = await reconcileGlobalManagedFiles({ ...base(root), desired: settingsOnly() });

    expect(again.preserved.length + again.unchanged.length + again.updated.length).toBe(2);
    await expect(readFile(path, "utf8")).resolves.toContain("Grep|Bash|Read");
  });

  it("creates a new settings.json when none exists and keeps updates in the user's layout", async () => {
    const root = await claudeRoot();
    const path = join(root.path, "settings.json");

    await reconcileGlobalManagedFiles({ ...base(root), desired: settingsOnly() });

    const created = JSON.parse(await readFile(path, "utf8")) as { hooks: { UserPromptSubmit: unknown[] } };
    expect(created.hooks.UserPromptSubmit).toHaveLength(1);
    await expect(access(join(root.path, "harnix", "managed.json"))).resolves.toBeUndefined();
  });

  it("still preserves an invalid settings.json instead of rewriting it", async () => {
    const root = await claudeRoot();
    await mkdir(root.path, { recursive: true });
    const path = join(root.path, "settings.json");
    await writeFile(path, '{ "hooks": ');

    const result = await reconcileGlobalManagedFiles({ ...base(root), desired: settingsOnly() });

    expect(result.warnings.map((warning) => warning.code)).toEqual(["invalid-json", "invalid-json"]);
    await expect(readFile(path, "utf8")).resolves.toBe('{ "hooks": ');
  });
});
