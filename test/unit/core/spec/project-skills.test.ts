import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { discoverProjectSkills } from "src/core/spec/project-skills.js";
import { fileSymlinksSupported, linkDirectory } from "test/support/symlink-support.js";
import { createTestProject } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-project-skills-");

describe("discoverProjectSkills", () => {
  it("returns empty array when .harnix/spec/skills does not exist", async () => {
    const root = await createTestProject(await temporaryRepository());
    const skills = await discoverProjectSkills(root);
    expect(skills).toEqual([]);
  });

  it("discovers custom project skills with frontmatter and references", async () => {
    const root = await createTestProject(await temporaryRepository());
    const customSkillDir = join(root, ".harnix", "spec", "skills", "domain-compliance");
    const referencesDir = join(customSkillDir, "references");
    await mkdir(referencesDir, { recursive: true });

    const skillContent = [
      "---",
      "name: domain-compliance",
      "description: Use when verifying domain compliance requirements.",
      "metadata:",
      '  version: "1.0.0"',
      "---",
      "",
      "# Domain compliance skill",
      "",
      "Instructions for domain compliance.",
      "",
    ].join("\n");

    const refContent = ["# FAQ for domain compliance", "", "Frequently asked questions.", ""].join("\n");

    await writeFile(join(customSkillDir, "SKILL.md"), skillContent);
    await writeFile(join(referencesDir, "faq.md"), refContent);

    const discovered = await discoverProjectSkills(root);
    expect(discovered).toHaveLength(1);
    expect(discovered[0]!.name).toBe("domain-compliance");
    expect(discovered[0]!.description).toBe("Use when verifying domain compliance requirements.");
    expect(discovered[0]!.version).toBe("1.0.0");
    expect(discovered[0]!.references).toEqual({ faq: refContent });
  });

  it("skips directories without SKILL.md", async () => {
    const root = await createTestProject(await temporaryRepository());
    const emptySkillDir = join(root, ".harnix", "spec", "skills", "empty-skill");
    await mkdir(emptySkillDir, { recursive: true });

    const discovered = await discoverProjectSkills(root);
    expect(discovered).toEqual([]);
  });

  const SKILL = [
    "---",
    "name: x",
    "description: Use when testing.",
    "metadata:",
    '  version: "1.0.0"',
    "---",
    "",
    "# X",
    "",
  ].join("\n");

  it("skips a skill directory that links outside the project root", async () => {
    const root = await createTestProject(await temporaryRepository());
    const outside = await temporaryRepository();
    await writeFile(join(outside, "SKILL.md"), SKILL);
    await mkdir(join(root, ".harnix", "spec", "skills"), { recursive: true });
    await linkDirectory(outside, join(root, ".harnix", "spec", "skills", "escaped"));

    await expect(discoverProjectSkills(root)).resolves.toEqual([]);
  });

  it.skipIf(!fileSymlinksSupported())("skips SKILL.md and references that are symlinks leaving the root", async () => {
    const root = await createTestProject(await temporaryRepository());
    const outside = await temporaryRepository();
    await writeFile(join(outside, "secret.md"), SKILL);
    const dir = join(root, ".harnix", "spec", "skills", "linked");
    await mkdir(join(dir, "references"), { recursive: true });
    await symlink(join(outside, "secret.md"), join(dir, "SKILL.md"), "file");
    const ok = join(root, ".harnix", "spec", "skills", "ok");
    await mkdir(join(ok, "references"), { recursive: true });
    await writeFile(join(ok, "SKILL.md"), SKILL);
    await symlink(join(outside, "secret.md"), join(ok, "references", "leak.md"), "file");
    await writeFile(join(ok, "references", "fine.md"), "fine");

    const discovered = await discoverProjectSkills(root);

    expect(discovered.map((skill) => skill.name)).toEqual(["x"]);
    expect(Object.keys(discovered[0]!.references)).toEqual(["fine"]);
  });
});
