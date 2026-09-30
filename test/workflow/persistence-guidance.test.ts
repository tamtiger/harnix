import { describe, expect, it } from "vitest";

import { createProgram } from "src/cli-program.js";
import { claudeGlobalMemoryContent } from "src/configurators/claude.js";
import { codexGlobalAgentsContent } from "src/configurators/codex.js";
import { HARNIX_PERSISTENCE_INSTRUCTIONS } from "src/templates/harnix/activation.js";
import { HARNIX_GLOBAL_ACTIVATION_DOCUMENT } from "src/templates/harnix/global-surface.js";
import { renderSkill, workflowSkills, workflowTemplate } from "src/templates/harnix/workflow.js";

const STAGE_SKILLS = [
  "harnix-brainstorm",
  "harnix-implement",
  "harnix-check",
  "harnix-continue",
  "harnix-debug",
  "harnix-finish-work",
] as const;
const DIGEST_SKILLS = ["harnix-brainstorm", "harnix-continue", "harnix-check"] as const;

function skillText(name: string): string {
  const skill = workflowSkills.find((candidate) => candidate.name === name);
  if (skill === undefined) throw new Error(`skill ${name} is missing`);
  return renderSkill(skill);
}

function registeredWorkflowFlags(): Set<string> {
  const workflow = createProgram().commands.find((command) => command.name() === "workflow");
  return new Set(workflow?.options.map((option) => option.long ?? ""));
}

/** Every `--flag` that follows `harnix workflow` on the same line, up to the next backtick or command. */
function documentedWorkflowFlags(text: string): string[] {
  const flags: string[] = [];
  for (const line of text.split(/\r?\n/u)) {
    for (const match of line.matchAll(/harnix workflow([^`\n]*)/gu)) {
      const tail = (match[1] ?? "").split(/harnix (?!workflow)/u)[0] ?? "";
      flags.push(...(tail.match(/(?<![\w-])--[a-z][a-z-]*/gu) ?? []));
    }
  }
  return flags;
}

describe("agent persistence guidance", () => {
  it("shares one persistence and clock rule with every platform through the activation instructions", () => {
    const rules = HARNIX_PERSISTENCE_INSTRUCTIONS.join("\n");

    expect(rules).toMatch(/never create temporary script or JSON files/u);
    expect(rules).toMatch(/\.ps1/u);
    expect(rules).toMatch(/stop and report the exact command and error/u);
    expect(rules).toMatch(/pipe/u);
    expect(rules).toMatch(/64 KiB/u);
    expect(rules).toMatch(/Never pass accented .* text through a Windows PowerShell 5\.1 pipe/u);
    expect(rules).toMatch(/--set-check/u);
    expect(rules).toMatch(/`clock` block of `harnix workflow --preflight`/u);
    for (const surface of [HARNIX_GLOBAL_ACTIVATION_DOCUMENT, claudeGlobalMemoryContent, codexGlobalAgentsContent])
      for (const line of HARNIX_PERSISTENCE_INSTRUCTIONS) expect(surface).toContain(line);
  });

  it.each(STAGE_SKILLS)("%s carries the identical persistence rules section", (name) => {
    const text = skillText(name);
    const section = text.match(/## Persistence rules\r?\n[\s\S]*?(?=\r?\n## |$)/u)?.[0];

    expect(section, `${name} persistence section`).toBeDefined();
    expect(section).toMatch(/Never create temporary `\.ps1`, `\.sh`, `\.js` or `\.json` files/u);
    expect(section).toMatch(/stop and report the exact command and error/u);
    expect(section).toMatch(/`clock` block of `harnix workflow --preflight`/u);
    expect(section).toMatch(/never `<` in PowerShell/u);
    expect(section).toMatch(/64 KiB/u);
    expect(section).toMatch(/never pipe accented text through Windows PowerShell 5\.1/u);
    expect(section).toMatch(/--set-check`, `--add-criterion` and `--set-paths`/u);
    expect(section).not.toMatch(/OutputEncoding/u);
    expect(section).toMatch(/Command cookbook/u);
    const canonical = skillText("harnix-brainstorm").match(/## Persistence rules\r?\n[\s\S]*?(?=\r?\n## |$)/u)?.[0];
    expect(section).toBe(canonical);
  });

  it("documents a command cookbook with PowerShell and bash for every hand-off step", () => {
    const start = workflowTemplate.indexOf("### Command cookbook");
    expect(start).toBeGreaterThan(-1);
    const cookbook = workflowTemplate.slice(start, workflowTemplate.indexOf("\n## ", start));

    for (const needle of [
      "PowerShell",
      "bash",
      "--evidence --check",
      "--criterion",
      "--transition",
      "--snapshot --check",
      "--run-check",
      "--migrate",
      "--finish",
      "--cancel",
      "64 KiB",
      "| harnix workflow --save",
      "does not work in PowerShell",
      "bash -c",
      "--set-check",
      "--add-criterion",
      "--set-paths",
      "--add-risk",
      "--add-decision",
      "learning: { notes, captured, hint? }",
      "must never go through a Windows PowerShell 5.1 pipe",
      "edit `prd.md`",
    ])
      expect(cookbook, needle).toContain(needle);
  });

  it.each(DIGEST_SKILLS)("%s explains what changes inputDigest and how to recover after a replan", (name) => {
    const text = skillText(name);

    expect(text).toMatch(/`inputDigest` changes when/u);
    expect(text).toMatch(/does not change when/u);
    expect(text).toMatch(/batch every contract edit into one replan/u);
    expect(text).toMatch(/--run-check/u);
  });

  it("keeps harnix-check to one consistent evidence transport", () => {
    const text = skillText("harnix-check");

    expect(text).not.toMatch(/checkpoint through a bounded JSON envelope on stdin to `harnix workflow --save`/u);
    expect(text).toMatch(/--criterion <ids> --met/u);
    expect(text).toMatch(/use `--save` only when artifacts or obligations change/u);
  });

  it("only documents workflow flags that the CLI registers", () => {
    const registered = registeredWorkflowFlags();
    const sources: [string, string][] = [
      ["workflow.md", workflowTemplate],
      ["activation", HARNIX_PERSISTENCE_INSTRUCTIONS.join("\n")],
      ...workflowSkills.map((skill): [string, string] => [skill.name, renderSkill(skill)]),
    ];

    for (const [source, text] of sources) {
      for (const flag of documentedWorkflowFlags(text)) {
        expect(registered.has(flag), `${source} documents unknown flag ${flag}`).toBe(true);
      }
    }
  });

  it("teaches recording learning notes with flags and reading the finish report", () => {
    const finish = skillText("harnix-finish-work");

    expect(finish).toMatch(/harnix workflow --add-risk <id> --text <text>/u);
    expect(finish).toMatch(/harnix workflow --add-decision <id> --text <text> --rationale <text>/u);
    expect(finish).toMatch(/learning.captured/u);
    expect(skillText("harnix-brainstorm")).toMatch(/harnix workflow --add-decision <id>/u);
  });
});
