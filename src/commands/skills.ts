import { renderSkill, workflowSkills } from "../templates/harnix/workflow.js";
import { packageVersion } from "../version.js";

export interface SkillCatalogItemV1 {
  name: string;
  description: string;
  version: string;
}

export interface SkillCatalogResultV1 {
  generator: "harnix";
  schemaVersion: 1;
  skills: SkillCatalogItemV1[];
}

export interface SkillResultV1 extends SkillCatalogItemV1 {
  generator: "harnix";
  schemaVersion: 1;
  content: string;
}

/**
 * Bounded discovery for any agent, including one on a platform Harnix never
 * configures. It reads the packaged canonical catalog only: no project root,
 * no filesystem access, and no write.
 */
export function reportSkillCatalog(): SkillCatalogResultV1 {
  return {
    generator: "harnix",
    schemaVersion: 1,
    skills: workflowSkills.map((skill) => ({ name: skill.name, description: skill.description, version: packageVersion })),
  };
}

/**
 * Returns one canonical skill byte-identical to what platform setup installs,
 * so an agent without a configured platform reads the same instructions.
 */
export function reportSkill(name: string): SkillResultV1 {
  const skill = workflowSkills.find((candidate) => candidate.name === name);
  if (skill === undefined) {
    throw new Error(`Unknown Harnix skill. Run harnix skill to list the available stage owners.`);
  }
  return {
    generator: "harnix",
    schemaVersion: 1,
    name: skill.name,
    description: skill.description,
    version: packageVersion,
    content: renderSkill(skill),
  };
}
