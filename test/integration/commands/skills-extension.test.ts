import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  reportProjectSkill,
  reportProjectSkillCatalog,
  reportProjectSkillReference,
} from "src/commands/skills-extension.js";
import { discoverProjectSkills } from "src/core/spec/project-skills.js";
import { createTestProject } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-skills-ext-");

describe("project skills extension (.harnix/spec/skills)", () => {
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

    const catalog = reportProjectSkillCatalog(discovered);
    const customInCatalog = catalog.skills.find((s) => s.name === "domain-compliance");
    expect(customInCatalog).toBeDefined();
    expect(customInCatalog!.kind).toBe("project");
    expect(customInCatalog!.references).toEqual(["faq"]);

    const reported = reportProjectSkill("domain-compliance", discovered);
    expect(reported.name).toBe("domain-compliance");
    expect(reported.content).toBe(skillContent);
    expect(reported.references).toEqual(["faq"]);

    const refReport = reportProjectSkillReference("domain-compliance", "faq", discovered);
    expect(refReport.reference).toBe("faq");
    expect(refReport.content).toBe(refContent);
  });
});
