import { parse } from "yaml";

import bugfixPreserveSource from "./harnix-bugfix-preserve/SKILL.md";
import flakyTestSource from "./harnix-flaky-test/SKILL.md";
import migrationSafetySource from "./harnix-migration-safety/SKILL.md";
import securityLensSource from "./harnix-security-lens/SKILL.md";
import verificationGapSource from "./harnix-verification-gap/SKILL.md";

import type { SkillTemplate } from "src/core/spec/project-skills.js";

const REFERENCE_TOPIC = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export function parseSkill(rawSource: string, references: Record<string, string>): SkillTemplate {
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
  if (
    !isRecord(frontmatter.metadata) ||
    Object.keys(frontmatter.metadata).join(",") !== "version" ||
    typeof frontmatter.metadata.version !== "string" ||
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(frontmatter.metadata.version)
  ) {
    throw new Error("Harnix skill metadata.version must be a semantic version string.");
  }

  return {
    body: match[2]!,
    content,
    description: frontmatter.description,
    name: frontmatter.name,
    references: normalizeReferences(references),
    version: frontmatter.metadata.version,
  };
}

function normalizeReferences(references: Record<string, string>): Readonly<Record<string, string>> {
  const normalized: Record<string, string> = {};
  for (const [topic, text] of Object.entries(references)) {
    if (!REFERENCE_TOPIC.test(topic)) throw new Error(`Harnix skill reference topic is invalid: ${topic}`);
    const content = text.replaceAll("\r\n", "\n").trimEnd() + "\n";
    if (content.trim() === "") throw new Error(`Harnix skill reference ${topic} is empty.`);
    normalized[topic] = content;
  }
  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const canonicalTechniqueSources: readonly [string, Record<string, string>][] = [
  [verificationGapSource, {}],
  [bugfixPreserveSource, {}],
  [flakyTestSource, {}],
  [migrationSafetySource, {}],
  [securityLensSource, {}],
];

function validateTechniqueSkillSet(
  skills: SkillTemplate[],
  existingWorkflowNames: readonly string[],
): readonly SkillTemplate[] {
  const names = new Set<string>(existingWorkflowNames);
  for (const skill of skills) {
    if (names.has(skill.name)) {
      throw new Error(`Duplicate or colliding Harnix technique skill: ${skill.name}`);
    }
    names.add(skill.name);
  }
  if (skills.length < 5 || skills.length > 10) {
    throw new Error(`Expected between 5 and 10 Harnix technique skills, received ${skills.length}.`);
  }
  return skills;
}

const workflowStageOwnerNames = [
  "harnix-plan",
  "harnix-implement",
  "harnix-verify",
  "harnix-review",
  "harnix-research",
  "harnix-debug",
];

export const techniqueSkills: readonly SkillTemplate[] = Object.freeze(
  validateTechniqueSkillSet(
    canonicalTechniqueSources.map(([source, references]) => parseSkill(source, references)),
    workflowStageOwnerNames,
  ),
);
