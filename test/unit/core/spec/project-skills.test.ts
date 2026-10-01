import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { discoverProjectSkills } from "src/core/spec/project-skills.js";
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
});
