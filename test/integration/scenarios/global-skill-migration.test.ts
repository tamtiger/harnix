import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { setupPlatforms } from "src/commands/setup.js";
import { updateGlobalPlatforms } from "src/commands/global-update.js";
import { sha256 } from "src/utils/hashing.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-global-skill-migration-");

describe("global skill migration", () => {
  it("should_replace_the_four_retired_skills_with_the_merged_ones_during_global_update", async () => {
    const home = await temporaryUserHome();
    const environment = { CODEX_HOME: join(home, "codex") };
    const homeResolver = async () => home;
    await setupPlatforms({ commandLookup: async () => true, environment, homeResolver, platforms: ["kiro"] });
    const manifestPath = join(home, ".kiro", "harnix", "managed.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      entries: Array<{ path: string; sourceId: string; kind: string; generatedHash: string; generatorVersion: string }>;
    };
    const retired = ["harnix-brainstorm", "harnix-check", "harnix-continue", "harnix-finish-work"];
    for (const name of retired) {
      const content = `retired ${name}\n`;
      await mkdir(join(home, ".kiro", "skills", name), { recursive: true });
      await writeFile(join(home, ".kiro", "skills", name, "SKILL.md"), content);
      manifest.entries.push({
        path: `skills/${name}/SKILL.md`,
        sourceId: `kiro-${name}`,
        kind: "file",
        generatedHash: sha256(content),
        generatorVersion: "1.1.28",
      });
    }
    manifest.entries.sort((left, right) =>
      `${left.path}\u0000${left.sourceId}`.localeCompare(`${right.path}\u0000${right.sourceId}`),
    );
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    await updateGlobalPlatforms({ commandLookup: async () => true, environment, homeResolver });

    for (const name of retired) {
      await expect(access(join(home, ".kiro", "skills", name, "SKILL.md"))).rejects.toMatchObject({ code: "ENOENT" });
    }
    for (const name of ["harnix-plan", "harnix-implement", "harnix-verify", "harnix-review", "harnix-research"]) {
      await expect(access(join(home, ".kiro", "skills", name, "SKILL.md"))).resolves.toBeUndefined();
    }
  });
});
