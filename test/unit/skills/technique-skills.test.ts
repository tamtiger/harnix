import { describe, expect, it } from "vitest";

import { techniqueSkills } from "src/skills/technique-skills.js";
import { workflowSkills } from "src/skills/catalog.js";
import type { WorkflowStageOwner } from "src/core/workflow/routing.js";

const TOKEN_BUDGET = 1_200;
const tokens = (text: string): number => Math.ceil(text.length / 4);

const expectedTechniqueSkillNames = [
  "harnix-verification-gap",
  "harnix-bugfix-preserve",
  "harnix-flaky-test",
  "harnix-migration-safety",
  "harnix-security-lens",
  "harnix-sequential-thinking",
  "harnix-arch-review",
] as const;

describe("technique skills catalog", () => {
  it("ships strictly between 5 and 10 technique skills", () => {
    expect(techniqueSkills.length).toBeGreaterThanOrEqual(5);
    expect(techniqueSkills.length).toBeLessThanOrEqual(10);
    expect(techniqueSkills.map((s) => s.name).sort()).toEqual([...expectedTechniqueSkillNames].sort());
  });

  it("follows the agent skills frontmatter specification", () => {
    for (const skill of techniqueSkills) {
      expect(skill.name).toMatch(/^harnix-[a-z0-9-]+$/u);
      expect(skill.description.startsWith("Use when ")).toBe(true);
      expect(skill.version).toMatch(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u);
      expect(skill.body.trim().length).toBeGreaterThan(0);
      expect(tokens(skill.content), skill.name).toBeLessThanOrEqual(TOKEN_BUDGET);
    }
  });

  it("cites concrete empirical evidence from external-research.md in each technique skill", () => {
    for (const skill of techniqueSkills) {
      expect(skill.content, `${skill.name} missing Evidence heading`).toContain("## Evidence and Rationale");
      expect(skill.content, `${skill.name} missing external-research citation`).toMatch(
        /external-research\.md|§[A-D]/u,
      );
    }
  });

  it("does not collide with stage owners or workflow routing skills", () => {
    const workflowNames = new Set(workflowSkills.map((s) => s.name));
    const stageOwners: WorkflowStageOwner[] = [
      "harnix-plan",
      "harnix-implement",
      "harnix-verify",
      "harnix-review",
      "harnix-research",
      "harnix-debug",
    ];

    for (const skill of techniqueSkills) {
      expect(workflowNames.has(skill.name)).toBe(false);
      expect(stageOwners.includes(skill.name as WorkflowStageOwner)).toBe(false);
    }
  });

  it("exposes references for skills that declare them", () => {
    const archReview = techniqueSkills.find((s) => s.name === "harnix-arch-review");
    expect(archReview).toBeDefined();
    expect(Object.keys(archReview!.references).sort()).toEqual(["domain-briefs", "wbs-consolidation"]);
  });
});
