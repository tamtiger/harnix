import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

import { compareCodeUnits } from "src/utils/order.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";

export interface SkillTemplate {
  name: string;
  description: string;
  version: string;
  body: string;
  content: string;
  /** Reference detail installed under skills/<name>/references/<topic>.md and loaded with `harnix skill <name> --reference <topic>`. */
  references: Readonly<Record<string, string>>;
}

export const PROJECT_SKILLS_REL_PATH = "spec/skills";

const REFERENCE_TOPIC = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/**
 * Discovers custom project skills defined in `.harnix/spec/skills/<skill-name>/SKILL.md`.
 * Returns an empty array if the directory does not exist.
 */
export async function discoverProjectSkills(root: string): Promise<readonly SkillTemplate[]> {
  let skillsDir: string;
  try {
    skillsDir = await resolveSafeHarnixPath(root, PROJECT_SKILLS_REL_PATH);
  } catch {
    return [];
  }

  let entries: string[];
  try {
    entries = await readdir(skillsDir);
  } catch (error: unknown) {
    if (isMissing(error)) return [];
    throw error;
  }

  const skills: SkillTemplate[] = [];

  for (const name of entries) {
    const skillDirPath = join(skillsDir, name);
    try {
      const dirStat = await stat(skillDirPath);
      if (!dirStat.isDirectory()) continue;
    } catch {
      continue;
    }

    const skillFilePath = join(skillDirPath, "SKILL.md");
    let rawContent: string;
    try {
      rawContent = await readFile(skillFilePath, "utf8");
    } catch (error: unknown) {
      if (isMissing(error)) continue;
      throw error;
    }

    const referencesDir = join(skillDirPath, "references");
    const references: Record<string, string> = {};
    try {
      const refFiles = await readdir(referencesDir);
      for (const file of refFiles) {
        if (!file.endsWith(".md")) continue;
        const topic = file.slice(0, -3);
        if (!REFERENCE_TOPIC.test(topic)) continue;
        try {
          const refContent = await readFile(join(referencesDir, file), "utf8");
          references[topic] = refContent.replaceAll("\r\n", "\n").trimEnd() + "\n";
        } catch {
          // Ignore unreadable reference files gracefully.
        }
      }
    } catch {
      // References directory missing is expected when skill has no references.
    }

    try {
      const template = parseProjectSkillSource(name, rawContent, references);
      skills.push(template);
    } catch {
      // Skip invalid skill sources gracefully.
    }
  }

  return skills.sort((left, right) => compareCodeUnits(left.name, right.name));
}

function parseProjectSkillSource(
  folderName: string,
  rawSource: string,
  references: Record<string, string>,
): SkillTemplate {
  const content = rawSource.replaceAll("\r\n", "\n").trimEnd() + "\n";
  const match = /^---\n([\s\S]*?)\n---\n\n([\s\S]+)\n$/u.exec(content);
  if (match === null) {
    throw new Error(`Project skill in ${folderName} must contain YAML frontmatter followed by a body.`);
  }

  const frontmatter: unknown = parse(match[1]!);
  if (!isRecord(frontmatter)) {
    throw new Error(`Project skill in ${folderName} frontmatter is invalid.`);
  }

  const name = typeof frontmatter.name === "string" && frontmatter.name.trim() !== "" ? frontmatter.name : folderName;
  const description = typeof frontmatter.description === "string" ? frontmatter.description : "Project custom skill.";
  const version =
    isRecord(frontmatter.metadata) && typeof frontmatter.metadata.version === "string"
      ? frontmatter.metadata.version
      : "1.0.0";

  return {
    name,
    description,
    version,
    body: match[2]!,
    content,
    references,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"
  );
}
