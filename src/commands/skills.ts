import { legacySkillAliases, techniqueSkills } from "src/skills/catalog.js";
import { renderSkill, workflowSkills, type SkillTemplate } from "src/templates/harnix/workflow.js";
import { packageVersion } from "src/version.js";

export interface SkillCatalogItemV1 {
  name: string;
  description: string;
  version: string;
  /** On-demand reference topics, loaded with `harnix skill <name> --reference <topic>`. */
  references: string[];
  kind?: "workflow" | "technique" | "project" | undefined;
}

export interface SkillCatalogResultV1 {
  generator: "harnix";
  schemaVersion: 1;
  skills: SkillCatalogItemV1[];
}

export interface SkillCatalogOptions {
  /** If true, lists both workflow skills and technique/project skills. */
  all?: boolean | undefined;
  /** Custom project skills discovered from `.harnix/spec/skills/`. */
  projectSkills?: readonly SkillTemplate[] | undefined;
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
 * configures. By default it reports workflow stage-owners; when `--all` is set
 * it also includes technique skills and custom project skills.
 */
export function reportSkillCatalog(options?: SkillCatalogOptions): SkillCatalogResultV1 {
  if (options?.all !== true) {
    return {
      generator: "harnix",
      schemaVersion: 1,
      skills: workflowSkills.map((skill) => ({
        name: skill.name,
        description: skill.description,
        version: packageVersion,
        references: Object.keys(skill.references),
        kind: "workflow",
      })),
    };
  }

  const items: SkillCatalogItemV1[] = [
    ...workflowSkills.map((skill) => ({
      name: skill.name,
      description: skill.description,
      version: packageVersion,
      references: Object.keys(skill.references),
      kind: "workflow" as const,
    })),
    ...techniqueSkills.map((skill) => ({
      name: skill.name,
      description: skill.description,
      version: skill.version,
      references: Object.keys(skill.references),
      kind: "technique" as const,
    })),
    ...(options.projectSkills ?? []).map((skill) => ({
      name: skill.name,
      description: skill.description,
      version: skill.version,
      references: Object.keys(skill.references),
      kind: "project" as const,
    })),
  ];

  return {
    generator: "harnix",
    schemaVersion: 1,
    skills: items,
  };
}

function resolveSkill(name: string, projectSkills?: readonly SkillTemplate[]) {
  const alias = legacySkillAliases[name];
  const target = alias?.name ?? name;
  const skill =
    workflowSkills.find((candidate) => candidate.name === target) ??
    techniqueSkills.find((candidate) => candidate.name === target) ??
    projectSkills?.find((candidate) => candidate.name === target);
  if (skill === undefined) {
    throw new Error(`Unknown Harnix skill. Run harnix skill to list the available stage owners.`);
  }
  return { skill, alias: alias === undefined ? undefined : { from: name, note: alias.note } };
}

/**
 * Returns one skill byte-identical to what platform setup installs,
 * so an agent without a configured platform reads the same instructions. A name
 * from before the instruction slimming resolves to its replacement.
 * Resolves across workflow skills, technique skills, and project custom skills.
 */
export function reportSkill(name: string, projectSkills?: readonly SkillTemplate[]): SkillResultV1 {
  const { skill, alias } = resolveSkill(name, projectSkills);
  return {
    generator: "harnix",
    schemaVersion: 1,
    name: skill.name,
    description: skill.description,
    version: skill.version,
    content: renderSkill(skill),
    ...(alias === undefined ? {} : { resolvedFrom: alias.from }),
    ...(alias?.note === undefined ? {} : { note: alias.note }),
    references: Object.keys(skill.references),
  };
}

/** One on-demand reference of a skill; an unknown topic lists the valid ones. */
export function reportSkillReference(
  name: string,
  topic: string,
  projectSkills?: readonly SkillTemplate[],
): SkillReferenceResultV1 {
  const { skill } = resolveSkill(name, projectSkills);
  const content = Object.hasOwn(skill.references, topic) ? skill.references[topic] : undefined;
  if (content === undefined) {
    const topics = Object.keys(skill.references);
    throw new Error(
      `Unknown reference for ${skill.name}. ${topics.length === 0 ? "This skill has no references." : `Available: ${topics.join(", ")}.`}`,
    );
  }
  return { generator: "harnix", schemaVersion: 1, name: skill.name, reference: topic, content };
}
