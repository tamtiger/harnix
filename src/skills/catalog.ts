import debugSource from "./harnix-debug/SKILL.md";
import implementSource from "./harnix-implement/SKILL.md";
import feedbackReference from "./harnix-implement/references/feedback.md";
import epicReference from "./harnix-plan/references/epic.md";
import migrationReference from "./harnix-plan/references/migration.md";
import readyReviewReference from "./harnix-plan/references/ready-review.md";
import replanReference from "./harnix-plan/references/replan.md";
import planSource from "./harnix-plan/SKILL.md";
import researchSource from "./harnix-research/SKILL.md";
import reviewSource from "./harnix-review/SKILL.md";
import evidenceReference from "./harnix-verify/references/evidence.md";
import finishCancelReference from "./harnix-verify/references/finish-cancel.md";
import verifySource from "./harnix-verify/SKILL.md";
import { parseSkill, techniqueSkills } from "./technique-skills.js";

import type { SkillTemplate } from "src/core/spec/project-skills.js";

export type { SkillTemplate };
export { parseSkill, techniqueSkills };

const canonicalSources: readonly [string, Record<string, string>][] = [
  [
    planSource,
    {
      replan: replanReference,
      migration: migrationReference,
      epic: epicReference,
      "ready-review": readyReviewReference,
    },
  ],
  [implementSource, { feedback: feedbackReference }],
  [verifySource, { evidence: evidenceReference, "finish-cancel": finishCancelReference }],
  [reviewSource, {}],
  [researchSource, {}],
  [debugSource, {}],
];

/**
 * Names of skills that existed before the instruction slimming, with the skill
 * that replaced each one. `harnix skill <old>` resolves through this table.
 */
export const legacySkillAliases: Readonly<Record<string, { name: string; note?: string }>> = {
  "harnix-brainstorm": { name: "harnix-plan" },
  "harnix-check": { name: "harnix-verify" },
  "harnix-finish-work": { name: "harnix-verify" },
  "harnix-continue": {
    name: "harnix-plan",
    note: "harnix-continue was removed: run `harnix workflow --preflight` and load the skill named by nextStage.",
  },
};

export const workflowSkills: readonly SkillTemplate[] = validateWorkflowSkillSet(
  canonicalSources.map(([source, references]) => parseSkill(source, references)),
);

export const canonicalSkills: readonly SkillTemplate[] = [...workflowSkills, ...techniqueSkills];

export function renderSkill(skill: SkillTemplate): string {
  return skill.content;
}

function validateWorkflowSkillSet(skills: SkillTemplate[]): readonly SkillTemplate[] {
  const names = new Set<string>();
  for (const skill of skills) {
    if (names.has(skill.name)) {
      throw new Error(`Duplicate Harnix skill: ${skill.name}`);
    }
    names.add(skill.name);
  }
  if (skills.length !== 6) {
    throw new Error(`Expected six Harnix workflow skills, received ${skills.length}.`);
  }
  return skills;
}
