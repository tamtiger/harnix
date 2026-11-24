import type { Command } from "commander";

import type { SkillTemplate } from "src/core/spec/project-skills.js";

export type SkillReferenceIssueKind = "unknown-skill" | "unknown-reference" | "unknown-command" | "unknown-flag";

export interface SkillReferenceIssue {
  readonly kind: SkillReferenceIssueKind;
  /** Skill name and, after a slash, the reference topic the text lives in. */
  readonly where: string;
  readonly name: string;
}

const SKILL_NAME = /(?<![\w-])harnix-[a-z0-9]+(?:-[a-z0-9]+)*/gu;
const SKILL_CALL = /harnix skill (harnix-[a-z0-9]+(?:-[a-z0-9]+)*)(?: --reference ([a-z0-9]+(?:-[a-z0-9]+)*))?/gu;
const COMMAND_LINE = /^\s*harnix ([a-z][a-z-]*)(.*)$/u;
const FLAG = /(?<![\w-])--[a-z][a-z0-9-]*/gu;
const GLOBAL_FLAGS = new Set(["--help", "--version"]);

/** Every text a skill ships: the body and each reference, labelled for the report. */
function texts(skill: SkillTemplate): readonly [string, string][] {
  return [
    [skill.name, skill.content],
    ...Object.entries(skill.references).map(([topic, body]): [string, string] => [`${skill.name}/${topic}`, body]),
  ];
}

/** Candidate `harnix <command> ...` invocations: each backtick span and each line that starts with `harnix`. */
function invocations(text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(/`([^`\n]+)`/gu)) {
    const span = match[1]!.trim();
    if (span.startsWith("harnix ")) found.push(span);
  }
  for (const line of text.split("\n")) {
    if (/^\s*harnix /u.test(line)) found.push(line.trim());
  }
  return found;
}

function flagsOf(command: Command | undefined): Set<string> {
  const flags = new Set<string>(GLOBAL_FLAGS);
  for (const option of command?.options ?? []) {
    if (option.long !== undefined) flags.add(option.long);
  }
  return flags;
}

/**
 * Finds references in skill text that point at nothing: a `harnix-*` skill that is not shipped, a
 * `--reference` topic the skill does not have, a `harnix <command>` the program does not register and a
 * `--flag` the command does not declare. It reads text only, so it needs no process and no model.
 */
export function findDanglingSkillReferences(
  skills: readonly SkillTemplate[],
  program: Command,
  skillNames: ReadonlySet<string> = new Set(skills.map((skill) => skill.name)),
): SkillReferenceIssue[] {
  const byName = new Map(skills.map((skill) => [skill.name, skill]));
  const commands = new Map(program.commands.map((command) => [command.name(), command]));
  const issues: SkillReferenceIssue[] = [];
  const push = (kind: SkillReferenceIssueKind, where: string, name: string): void => {
    if (!issues.some((issue) => issue.kind === kind && issue.where === where && issue.name === name)) {
      issues.push({ kind, where, name });
    }
  };

  for (const skill of skills) {
    for (const [where, text] of texts(skill)) {
      for (const match of text.matchAll(SKILL_NAME)) {
        if (!skillNames.has(match[0])) push("unknown-skill", where, match[0]);
      }
      for (const match of text.matchAll(SKILL_CALL)) {
        const target = byName.get(match[1]!);
        if (target !== undefined && match[2] !== undefined && !Object.hasOwn(target.references, match[2])) {
          push("unknown-reference", where, `${match[1]} --reference ${match[2]}`);
        }
      }
      for (const invocation of invocations(text)) {
        const parsed = COMMAND_LINE.exec(invocation);
        if (parsed === null) continue;
        const command = commands.get(parsed[1]!);
        if (command === undefined) {
          push("unknown-command", where, parsed[1]!);
          continue;
        }
        const known = flagsOf(command);
        const [beforeSeparator = ""] = parsed[2]!.split(/\s--\s/u);
        for (const flag of beforeSeparator.match(FLAG) ?? []) {
          if (!known.has(flag)) push("unknown-flag", where, `${parsed[1]} ${flag}`);
        }
      }
    }
  }
  return issues;
}
