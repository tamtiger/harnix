import { parse } from "yaml";

import brainstormSource from "./harnix-brainstorm/SKILL.md";
import checkSource from "./harnix-check/SKILL.md";
import continueSource from "./harnix-continue/SKILL.md";
import debugSource from "./harnix-debug/SKILL.md";
import finishWorkSource from "./harnix-finish-work/SKILL.md";
import implementSource from "./harnix-implement/SKILL.md";
import researchSource from "./harnix-research/SKILL.md";

export interface SkillTemplate {
  name: string;
  description: string;
  version: string;
  body: string;
  content: string;
}

const canonicalSources = [
  brainstormSource,
  implementSource,
  checkSource,
  finishWorkSource,
  continueSource,
  researchSource,
  debugSource,
] as const;

export const workflowSkills: readonly SkillTemplate[] = validateSkillSet(canonicalSources.map(parseSkillSource));

export function renderSkill(skill: SkillTemplate): string {
  return skill.content;
}

function parseSkillSource(rawSource: string): SkillTemplate {
  const content = rawSource.replaceAll("\r\n", "\n").trimEnd() + "\n";
  const match = /^---\n([\s\S]*?)\n---\n\n([\s\S]+)\n$/u.exec(content);
  if (match === null) {
    throw new Error("Harnix skill source must contain YAML frontmatter followed by a non-empty body.");
  }

  const frontmatter: unknown = parse(match[1]!);
  if (!isRecord(frontmatter) || Object.keys(frontmatter).sort().join(",") !== "description,metadata,name") {
    throw new Error("Harnix skill frontmatter must contain name, description, and metadata.version.");
  }
  if (typeof frontmatter.name !== "string" || !/^harnix-[a-z0-9-]+$/u.test(frontmatter.name)) {
    throw new Error("Harnix skill name is invalid.");
  }
  if (typeof frontmatter.description !== "string" || !frontmatter.description.startsWith("Use when ")) {
    throw new Error("Harnix skill description must start with 'Use when '.");
  }
  if (!isRecord(frontmatter.metadata)
    || Object.keys(frontmatter.metadata).join(",") !== "version"
    || typeof frontmatter.metadata.version !== "string"
    || !/^\d+\.\d+\.\d+$/u.test(frontmatter.metadata.version)) {
    throw new Error("Harnix skill metadata.version must be a semantic version string.");
  }

  return {
    body: match[2]!,
    content,
    description: frontmatter.description,
    name: frontmatter.name,
    version: frontmatter.metadata.version,
  };
}

function validateSkillSet(skills: SkillTemplate[]): readonly SkillTemplate[] {
  const names = new Set<string>();
  for (const skill of skills) {
    if (names.has(skill.name)) {
      throw new Error(`Duplicate Harnix skill: ${skill.name}`);
    }
    names.add(skill.name);
  }
  if (skills.length !== 7) {
    throw new Error(`Expected seven Harnix workflow skills, received ${skills.length}.`);
  }
  return skills;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
