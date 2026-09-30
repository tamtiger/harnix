import { legacySkillAliases } from "src/skills/catalog.js";
import { renderSkill, workflowSkills } from "src/templates/harnix/workflow.js";
import { packageVersion } from "src/version.js";

export interface SkillCatalogItemV1 {
  name: string;
  description: string;
  version: string;
  /** On-demand reference topics, loaded with `harnix skill <name> --reference <topic>`. */
  references: string[];
}

export interface SkillCatalogResultV1 {
  generator: "harnix";
  schemaVersion: 1;
  skills: SkillCatalogItemV1[];
}

export interface SkillResultV1 {
  generator: "harnix";
  schemaVersion: 1;
  name: string;
  description: string;
  version: string;
  content: string;
  /** Set when the requested name was an earlier skill that now resolves to this one. */
  resolvedFrom?: string;
  note?: string;
  references: string[];
}

export interface SkillReferenceResultV1 {
  generator: "harnix";
  schemaVersion: 1;
  name: string;
  reference: string;
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
    skills: workflowSkills.map((skill) => ({
      name: skill.name,
      description: skill.description,
      version: packageVersion,
      references: Object.keys(skill.references),
    })),
  };
}

function resolveSkill(name: string) {
  const alias = legacySkillAliases[name];
  const target = alias?.name ?? name;
  const skill = workflowSkills.find((candidate) => candidate.name === target);
  if (skill === undefined) {
    throw new Error(`Unknown Harnix skill. Run harnix skill to list the available stage owners.`);
  }
  return { skill, alias: alias === undefined ? undefined : { from: name, note: alias.note } };
}

/**
 * Returns one canonical skill byte-identical to what platform setup installs,
 * so an agent without a configured platform reads the same instructions. A name
 * from before the instruction slimming resolves to its replacement.
 */
export function reportSkill(name: string): SkillResultV1 {
  const { skill, alias } = resolveSkill(name);
  return {
    generator: "harnix",
    schemaVersion: 1,
    name: skill.name,
    description: skill.description,
    version: packageVersion,
    content: renderSkill(skill),
    ...(alias === undefined ? {} : { resolvedFrom: alias.from }),
    ...(alias?.note === undefined ? {} : { note: alias.note }),
    references: Object.keys(skill.references),
  };
}

/** One on-demand reference of a skill; an unknown topic lists the valid ones. */
export function reportSkillReference(name: string, topic: string): SkillReferenceResultV1 {
  const { skill } = resolveSkill(name);
  const content = Object.hasOwn(skill.references, topic) ? skill.references[topic] : undefined;
  if (content === undefined) {
    const topics = Object.keys(skill.references);
    throw new Error(
      `Unknown reference for ${skill.name}. ${topics.length === 0 ? "This skill has no references." : `Available: ${topics.join(", ")}.`}`,
    );
  }
  return { generator: "harnix", schemaVersion: 1, name: skill.name, reference: topic, content };
}
