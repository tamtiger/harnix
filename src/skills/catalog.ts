import { parse } from "yaml";

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

export interface SkillTemplate {
  name: string;
  description: string;
  version: string;
  body: string;
  content: string;
  /** Reference detail installed under skills/<name>/references/<topic>.md and loaded with `harnix skill <name> --reference <topic>`. */
  references: Readonly<Record<string, string>>;
}

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

const REFERENCE_TOPIC = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export const workflowSkills: readonly SkillTemplate[] = validateSkillSet(
  canonicalSources.map(([source, references]) => parseSkillSource(source, references)),
);

export function renderSkill(skill: SkillTemplate): string {
  return skill.content;
}

function parseSkillSource(rawSource: string, references: Record<string, string>): SkillTemplate {
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

function validateSkillSet(skills: SkillTemplate[]): readonly SkillTemplate[] {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
