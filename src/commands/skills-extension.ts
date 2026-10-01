import type { SkillTemplate } from "src/core/spec/project-skills.js";
import {
  reportSkill,
  reportSkillCatalog,
  reportSkillReference,
  type SkillCatalogOptions,
  type SkillCatalogResultV1,
  type SkillReferenceResultV1,
  type SkillResultV1,
} from "./skills.js";

/**
 * Extension helper for reporting skill catalog with custom project skills.
 */
export function reportProjectSkillCatalog(
  projectSkills: readonly SkillTemplate[],
  options?: Omit<SkillCatalogOptions, "projectSkills">,
): SkillCatalogResultV1 {
  return reportSkillCatalog({ ...options, all: true, projectSkills });
}

/**
 * Extension helper for retrieving a skill with custom project skills context.
 */
export function reportProjectSkill(name: string, projectSkills: readonly SkillTemplate[]): SkillResultV1 {
  return reportSkill(name, projectSkills);
}

/**
 * Extension helper for retrieving a skill reference with custom project skills context.
 */
export function reportProjectSkillReference(
  name: string,
  topic: string,
  projectSkills: readonly SkillTemplate[],
): SkillReferenceResultV1 {
  return reportSkillReference(name, topic, projectSkills);
}
