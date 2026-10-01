import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { setupPlatforms } from "src/commands/setup.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";

const temporaryUserHome = useTemporaryUserHomes("harnix-skill-dedup-home-");

const options = (home: string) =>
  ({
    commandLookup: async () => true,
    environment: {} as Record<string, string>,
    homeResolver: async () => home,
  }) as const;

const skillUnit = (base: string) => join(base, "skills", "harnix-implement", "SKILL.md");

describe("skill deduplication across platforms", () => {
  it("gives each tool-read directory exactly one owned copy of a skill", async () => {
    const home = await temporaryUserHome();

    await setupPlatforms({ ...options(home), platforms: ["opencode", "cursor", "claude"] });

    const opencodeSkill = await readFile(skillUnit(join(home, ".config", "opencode")), "utf8");
    const cursorSkill = await readFile(skillUnit(join(home, ".cursor")), "utf8");
    const claudeSkill = await readFile(skillUnit(join(home, ".claude")), "utf8");
    // One copy per directory a tool reads; the canonical bytes stay identical across platforms.
    expect(opencodeSkill).toContain("harnix workflow --preflight");
    expect(cursorSkill).toBe(opencodeSkill);
    expect(claudeSkill).toBe(opencodeSkill);
  });

  it("preserves a pre-existing unowned Harnix skill unit instead of overwriting it", async () => {
    const home = await temporaryUserHome();
    const cursorSkillsDir = join(home, ".cursor", "skills", "harnix-implement");
    await mkdir(cursorSkillsDir, { recursive: true });
    await writeFile(join(cursorSkillsDir, "SKILL.md"), "# Not Harnix-owned\n", "utf8");

    const result = await setupPlatforms({ ...options(home), platforms: ["cursor"] });
    const cursor = result.platforms.find((platform) => platform.platform === "cursor");

    expect(cursor?.preserved.some((label) => label.includes("harnix-implement"))).toBe(true);
    expect(cursor?.warnings.join(" ")).toContain("not owned by Harnix");
    await expect(readFile(join(cursorSkillsDir, "SKILL.md"), "utf8")).resolves.toBe("# Not Harnix-owned\n");
  });
});
