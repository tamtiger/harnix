import debugSource from "./harnix-debug/SKILL.md";
import feedbackLoopReference from "./harnix-debug/references/feedback-loop.md";
import implementSource from "./harnix-implement/SKILL.md";
import brownfieldReference from "./harnix-implement/references/brownfield.md";
import commitHygieneReference from "./harnix-implement/references/commit-hygiene.md";
import feedbackReference from "./harnix-implement/references/feedback.md";
import decisionDisciplineReference from "./harnix-plan/references/decision-discipline.md";
import epicReference from "./harnix-plan/references/epic.md";
import grillingReference from "./harnix-plan/references/grilling.md";
import migrationReference from "./harnix-plan/references/migration.md";
import multiRepoReference from "./harnix-plan/references/multi-repo.md";
import readyReviewReference from "./harnix-plan/references/ready-review.md";
import replanReference from "./harnix-plan/references/replan.md";
import planSource from "./harnix-plan/SKILL.md";
import researchSource from "./harnix-research/SKILL.md";
import scoutingIsolationReference from "./harnix-research/references/scouting-isolation.md";
import multiLensReference from "./harnix-review/references/multi-lens.md";
import reviewSource from "./harnix-review/SKILL.md";
import evidenceReference from "./harnix-verify/references/evidence.md";
import finishCancelReference from "./harnix-verify/references/finish-cancel.md";
import rationalizationsReference from "./harnix-verify/references/rationalizations.md";
import soWhatReference from "./harnix-verify/references/so-what.md";
import technicalRecapReference from "./harnix-verify/references/technical-recap.md";
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
      "multi-repo": multiRepoReference,
      "ready-review": readyReviewReference,
      grilling: grillingReference,
      "decision-discipline": decisionDisciplineReference,
    },
  ],
  [
    implementSource,
    {
      feedback: feedbackReference,
      brownfield: brownfieldReference,
      "commit-hygiene": commitHygieneReference,
    },
  ],
  [
    verifySource,
    {
      evidence: evidenceReference,
      "finish-cancel": finishCancelReference,
      rationalizations: rationalizationsReference,
      "so-what": soWhatReference,
      "technical-recap": technicalRecapReference,
    },
  ],
  [reviewSource, { "multi-lens": multiLensReference }],
  [researchSource, { "scouting-isolation": scoutingIsolationReference }],
  [debugSource, { "feedback-loop": feedbackLoopReference }],
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
