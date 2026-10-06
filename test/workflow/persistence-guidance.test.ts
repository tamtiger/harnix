import { describe, expect, it } from "vitest";

import { createProgram } from "src/cli-program.js";
import { claudeGlobalMemoryContent } from "src/configurators/claude.js";
import { codexGlobalAgentsContent } from "src/configurators/codex.js";
import { briefFlagNames } from "src/core/workflow/brief.js";
import { HARNIX_RULES, renderHarnixRules } from "src/templates/harnix/activation.js";
import { HARNIX_GLOBAL_ACTIVATION_DOCUMENT } from "src/templates/harnix/global-surface.js";
import { workflowSkills, workflowTemplate } from "src/templates/harnix/workflow.js";

const ROUTE_RULE = HARNIX_RULES.find((rule) => /^Route:/u.test(rule))!;
const ECONOMY_RULE = HARNIX_RULES.find((rule) => /^Token economy:/u.test(rule))!;
const STATE_RULE = HARNIX_RULES.find((rule) => /change task state only with `harnix workflow`/u.test(rule))!;

function skillAndReferences(name: string): string {
  const skill = workflowSkills.find((candidate) => candidate.name === name);
  if (skill === undefined) throw new Error(`skill ${name} is missing`);
  return [skill.content, ...Object.values(skill.references)].join("\n");
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
  it("states the persistence, clock and encoding rules once, in the rules every surface renders", () => {
    expect(STATE_RULE).toMatch(/change task state only with `harnix workflow`/iu);
    expect(STATE_RULE).toContain("Never create temporary script or JSON files");
    expect(STATE_RULE).toContain("stop and report the exact command and error");
    expect(STATE_RULE).toContain("`clock` in `harnix workflow --preflight`");
    expect(STATE_RULE).toContain("never `<` in PowerShell");
    expect(STATE_RULE).toContain("never accented text through Windows PowerShell 5.1");
    expect(STATE_RULE).toContain("64 KiB");
    for (const flag of ["--set-check", "--add-criterion", "--add-decision", "--add-risk", "--run-check", "--migrate"])
      expect(STATE_RULE, flag).toContain(flag);
    for (const surface of [HARNIX_GLOBAL_ACTIVATION_DOCUMENT, claudeGlobalMemoryContent, codexGlobalAgentsContent])
      expect(surface).toContain(renderHarnixRules());
  });

  it("documents a command cookbook with PowerShell and bash for every hand-off step", () => {
    const start = workflowTemplate.indexOf("## Command cookbook");
    expect(start).toBeGreaterThan(-1);
    const cookbook = workflowTemplate.slice(start);

    for (const needle of [
      "PowerShell",
      "bash",
      "--evidence --check",
      "--criterion",
      "--transition",
      "--run-check",
      "--set-check",
      "--add-criterion",
      "--set-paths",
      "--add-decision",
      "--add-risk",
      "--finish",
      "--cancel",
      "64 KiB",
      "| harnix workflow --save",
      "does not work in PowerShell",
      "bash -c",
      "must never go through a Windows PowerShell 5.1 pipe",
      "edit `prd.md`",
      "single-quote it in bash when it contains backticks",
      "A `--save` envelope is",
      "harnix workflow --schema",
      "reports every independent problem at once",
    ])
      expect(cookbook, needle).toContain(needle);
    expect(cookbook).not.toContain("$OutputEncoding");
  });

  it("explains what changes inputDigest and how to recover after a replan", () => {
    const evidence = skillAndReferences("harnix-verify");
    const plan = skillAndReferences("harnix-plan");

    expect(evidence).toContain("What changes `inputDigest`");
    expect(evidence).toContain("Not: recording evidence");
    expect(plan).toContain("Batch every contract edit into one replan");
    expect(plan).toContain("every earlier pass is stale");
    expect(plan).toContain("--run-check");
  });

  it("teaches recording learning notes with flags and reading the finish report", () => {
    const verify = skillAndReferences("harnix-verify");

    expect(verify).toContain("--add-risk");
    expect(verify).toContain("--add-decision");
    expect(verify).toContain("learning.captured");
    expect(verify).toContain("learning.hint");
    expect(skillAndReferences("harnix-plan")).toContain("harnix workflow --add-decision <id>");
    expect(skillAndReferences("harnix-implement")).toContain("--add-risk");
  });

  it("only documents workflow flags that the CLI registers", () => {
    const registered = registeredWorkflowFlags();
    const sources: [string, string][] = [
      ["workflow.md", workflowTemplate],
      ["rules", renderHarnixRules()],
      ...workflowSkills.map((skill): [string, string] => [skill.name, skillAndReferences(skill.name)]),
    ];

    for (const [source, text] of sources) {
      for (const flag of documentedWorkflowFlags(text)) {
        expect(registered.has(flag), `${source} documents unknown flag ${flag}`).toBe(true);
      }
    }
  });

  it("keeps one cookbook command block instead of repeating every command per shell", () => {
    const cookbook = workflowTemplate.slice(workflowTemplate.indexOf("## Command cookbook"));

    expect(cookbook.match(/^```/gmu)).toHaveLength(2);
    expect(cookbook).toContain("In PowerShell:");
    expect(cookbook).toContain("In bash:");
    expect(cookbook).toContain("pwsh.exe -NoProfile -Command");
    expect(cookbook).toContain("refuses");
  });

  it("shows --brief on every cookbook command that accepts it and on none that refuses it", () => {
    const cookbook = workflowTemplate.slice(workflowTemplate.indexOf("## Command cookbook"));
    const block = cookbook.split(/^```.*$/gmu)[1] ?? "";
    const accepted = new Set(briefFlagNames());
    const optional = new Set(["--preflight"]);
    const lines = block.split(/\r?\n/u).filter((line) => line.startsWith("harnix workflow "));

    expect(lines.length).toBeGreaterThan(8);
    for (const line of lines) {
      const flag = /^harnix workflow (--[a-z-]+)/u.exec(line)?.[1] ?? "";
      if (accepted.has(flag) && !optional.has(flag)) expect(line, flag).toContain("--brief");
      if (!accepted.has(flag)) expect(line, flag).not.toContain("--brief");
    }
  });

  it("tells the reader to read the workflow page and the schema once per session and where --brief is listed", () => {
    expect(ROUTE_RULE).toMatch(/read `\.harnix\/workflow\.md` once per session/u);
    expect(ECONOMY_RULE).toContain("constraints.brief");
    expect(ECONOMY_RULE).toContain("once per session");
    for (const flag of ["--set-check", "--add-criterion", "--set-paths"]) expect(ECONOMY_RULE, flag).toContain(flag);
    expect(workflowTemplate).toContain("once per session");
  });

  it("documents the required --platform flag, the epic ID order and how to edit a member that is not active", () => {
    const plan = skillAndReferences("harnix-plan");

    expect(workflowTemplate).toContain("harnix context --platform <p>");
    expect(workflowTemplate).toContain("harnix context-report --platform <p>");
    expect(plan).toContain("later idPrefix");
    expect(plan).toContain("--task <task-id>");
    expect(plan).not.toContain("harnix pause");
  });
});
