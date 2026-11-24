import { describe, expect, it } from "vitest";

import { createProgram } from "src/cli-program.js";
import { canonicalSkills } from "src/skills/catalog.js";
import { findDanglingSkillReferences } from "test/support/skill-reference-audit.js";

import type { SkillTemplate } from "src/core/spec/project-skills.js";

const skill = (name: string, content: string, references: Record<string, string> = {}): SkillTemplate =>
  ({ name, description: "Use when testing.", version: "0.0.0", content, references }) as SkillTemplate;

describe("skill reference audit", () => {
  it("finds no dangling skill, reference, command or flag in the shipped skills", () => {
    expect(findDanglingSkillReferences(canonicalSkills, createProgram())).toEqual([]);
  });

  it("reports a skill name that is not shipped", () => {
    const issues = findDanglingSkillReferences([skill("harnix-a", "Use `harnix-ghost` here.")], createProgram());
    expect(issues).toEqual([{ kind: "unknown-skill", where: "harnix-a", name: "harnix-ghost" }]);
  });

  it("reports a reference topic the skill does not have, naming the text it lives in", () => {
    const issues = findDanglingSkillReferences(
      [
        skill("harnix-a", "See `harnix skill harnix-b --reference missing`.", { note: "ok" }),
        skill("harnix-b", "Body.", { real: "x" }),
      ],
      createProgram(),
    );
    expect(issues).toEqual([{ kind: "unknown-reference", where: "harnix-a", name: "harnix-b --reference missing" }]);
  });

  it("reports an unknown command and a flag the command does not declare", () => {
    const issues = findDanglingSkillReferences(
      [skill("harnix-a", "Run `harnix workflow --no-such-flag` or `harnix nonsense --brief`.")],
      createProgram(),
    );
    expect(issues).toEqual([
      { kind: "unknown-flag", where: "harnix-a", name: "workflow --no-such-flag" },
      { kind: "unknown-command", where: "harnix-a", name: "nonsense" },
    ]);
  });

  it("accepts a real flag, ignores what follows the `--` separator and reads fenced command lines", () => {
    const body = [
      "Run `harnix workflow --run-check chk-1 -- node --made-up`.",
      "```",
      "harnix status --summary",
      "```",
    ];
    expect(findDanglingSkillReferences([skill("harnix-a", body.join("\n"))], createProgram())).toEqual([]);
  });

  it("flags a bad flag on a fenced command line too", () => {
    const body = ["```", "harnix status --nope", "```"].join("\n");
    expect(findDanglingSkillReferences([skill("harnix-a", body)], createProgram())).toEqual([
      { kind: "unknown-flag", where: "harnix-a", name: "status --nope" },
    ]);
  });
});
