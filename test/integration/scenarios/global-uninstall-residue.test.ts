import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { uninstallGlobalIntegrations } from "src/commands/global-uninstall.js";
import { setupPlatforms } from "src/commands/setup.js";
import type { PlatformId } from "src/core/platform/registry.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-global-residue-");

/** Shared roots belong to the tool and stay, but nothing Harnix put inside or above them may. */
const SHARED_ROOTS = new Set([".kiro", ".claude", "codex", ".agents", ".config", ".config/opencode", ".cursor"]);

async function walk(directory: string, base = directory): Promise<{ files: string[]; directories: string[] }> {
  const files: string[] = [];
  const directories: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const name = relative(base, path).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      directories.push(name);
      const nested = await walk(path, base);
      files.push(...nested.files);
      directories.push(...nested.directories);
    } else {
      files.push(name);
    }
  }
  return { files, directories };
}

const PLATFORMS: PlatformId[] = ["kiro", "antigravity", "codex", "claude", "opencode", "cursor"];

describe("global uninstall leaves nothing of Harnix behind", () => {
  it.each(PLATFORMS)(
    "setup then uninstall on an empty home leaves no file and no Harnix directory: %s",
    async (platform) => {
      const home = await temporaryUserHome();
      const environment = { CODEX_HOME: join(home, "codex") };
      const options = { commandLookup: async () => true, environment, homeResolver: async () => home };

      await setupPlatforms({ ...options, platforms: [platform] });
      await uninstallGlobalIntegrations({ ...options, platforms: [platform], yes: true });

      const tree = await walk(home);
      expect(tree.files).toEqual([]);
      expect(tree.directories.filter((directory) => !SHARED_ROOTS.has(directory))).toEqual([]);
    },
  );

  it("keeps a directory that holds anything of the user's", async () => {
    const home = await temporaryUserHome();
    const environment = { CODEX_HOME: join(home, "codex") };
    const options = { commandLookup: async () => true, environment, homeResolver: async () => home };
    await mkdir(join(home, ".kiro", "steering"), { recursive: true });
    await writeFile(join(home, ".kiro", "steering", "mine.md"), "keep\n");
    await mkdir(join(home, ".kiro", "skills", "my-skill"), { recursive: true });
    await writeFile(join(home, ".kiro", "skills", "my-skill", "SKILL.md"), "keep\n");

    await setupPlatforms({ ...options, platforms: ["kiro"] });
    await uninstallGlobalIntegrations({ ...options, platforms: ["kiro"], yes: true });

    const tree = await walk(home);
    expect(tree.files.sort()).toEqual([".kiro/skills/my-skill/SKILL.md", ".kiro/steering/mine.md"]);
  });
});
