import { describe, expect, it } from "vitest";

import { reportSkill, reportSkillCatalog } from "../../src/commands/skills.js";
import { renderSkill, workflowSkills } from "../../src/templates/harnix/workflow.js";
import { packageVersion } from "../../src/version.js";

describe("harnix skill", () => {
  it("should_list_every_canonical_skill_without_body_content", () => {
    const result = reportSkillCatalog();

    expect(result.generator).toBe("harnix");
    expect(result.schemaVersion).toBe(1);
    expect(result.skills.map((skill) => skill.name)).toEqual(workflowSkills.map((skill) => skill.name));
    expect(result.skills.every((skill) => skill.version === packageVersion)).toBe(true);
    expect(result.skills.every((skill) => skill.description.startsWith("Use when "))).toBe(true);
    expect(JSON.stringify(result)).not.toContain("## Harnix activation guard");
  });

  it("should_return_byte_identical_canonical_content_for_one_skill", () => {
    for (const skill of workflowSkills) {
      const result = reportSkill(skill.name);

      expect(result).toEqual({
        generator: "harnix",
        schemaVersion: 1,
        name: skill.name,
        description: skill.description,
        version: packageVersion,
        content: renderSkill(skill),
      });
    }
  });

  it("should_fail_closed_for_an_unknown_or_unsafe_skill_name", () => {
    for (const name of ["", "harnix-unknown", "../../etc/passwd", "HARNIX-IMPLEMENT", "harnix-implement/SKILL.md"]) {
      expect(() => reportSkill(name)).toThrow(/Unknown Harnix skill/u);
    }
  });

  it("should_name_every_skill_the_router_can_select", () => {
    const names = new Set(reportSkillCatalog().skills.map((skill) => skill.name));

    for (const owner of ["harnix-brainstorm", "harnix-implement", "harnix-check", "harnix-debug", "harnix-research", "harnix-finish-work", "harnix-continue"]) {
      expect(names.has(owner)).toBe(true);
    }
  });
});
