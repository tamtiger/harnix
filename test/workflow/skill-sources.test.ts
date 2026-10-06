import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { legacySkillAliases, workflowSkills } from "src/skills/catalog.js";

const workflowSkillNames = [
  "harnix-plan",
  "harnix-implement",
  "harnix-verify",
  "harnix-review",
  "harnix-research",
  "harnix-debug",
] as const;
type SkillName = (typeof workflowSkillNames)[number];
const techniqueSkillNames = [
  "harnix-verification-gap",
  "harnix-bugfix-preserve",
  "harnix-flaky-test",
  "harnix-migration-safety",
  "harnix-security-lens",
] as const;
const allSkillNames = [...workflowSkillNames, ...techniqueSkillNames];
const TASK_SKILLS: readonly SkillName[] = ["harnix-plan", "harnix-implement", "harnix-verify", "harnix-debug"];

/**
 * Every responsibility of the seven skills that existed before the merge, with the phrase that proves it still has a
 * home. A needle is looked up in the skill and its references (references are part of the skill's instructions).
 */
const capabilities: Record<SkillName, readonly string[]> = {
  "harnix-plan": [
    "harnix workflow --preflight",
    "inventory",
    "observable acceptance criteria",
    "hyphenated slug",
    "unchecked",
    "context checkpoint",
    "not a second approval gate",
    "--add-decision",
    "harnix skill harnix-research",
    "TaskRecord schema v3",
    "criterionIds",
    "--set-check",
    "freeze at the first persisted `ready`",
    "await",
    "plan-only",
    "epicMembers",
    "contractRevision",
    "context reselection",
    "@task-contract",
    "--migrate",
    "task-schema-to-v3",
    "placeholders",
    "commit discipline",
    "blocked",
  ],
  "harnix-implement": [
    "harnix workflow --preflight",
    "harnix workflow --transition in_progress/implementing",
    "review the plan",
    "RED",
    "GREEN",
    "minimal implementation",
    "--run-check",
    "strongest alternative",
    "`- [x]`",
    "release preparation",
    "project's own version command",
    "before verifying",
    "technical feedback",
    "push back",
    "replan",
    "harnix-debug",
    "--add-risk",
    "wait for approval",
    "repo-map --tests",
  ],
  "harnix-verify": [
    "harnix workflow --preflight",
    "harnix workflow --transition verifying/verifying",
    "evidence precedes claims",
    "compliance",
    "quality and security",
    "inputDigest",
    "reuse a required pass",
    "repo-map --tests",
    "--run-check",
    "--criterion <ids> --met",
    "waived",
    "one remediation round",
    "material correctness",
    "--add-risk",
    "verifying/finishing",
    "harnix workflow --finish --brief",
    "recomputes",
    "never edits the product",
    "learning.captured",
    "review.md",
    "harnix epic",
    "cancelled/cancelling",
    "harnix workflow --cancel",
    "authorizedBy",
    "clears only the matching active pointer",
    "digest-mismatch",
    "fingerprint",
    "wait for approval",
  ],
  "harnix-review": [
    "read-only",
    "working-tree diff",
    "commit range",
    "file:line",
    "fix direction",
    "ready-with-fixes",
    "omitted",
    "residual risk",
    "find-or-create",
    "unique constraint",
    "constant-time",
    "LLM",
    "N+1",
    "readability-only redundancy",
    "consistency-only reshaping",
    "harmless no-op",
    "linter",
    "the diff already fixes",
    "hypothesis",
  ],
  "harnix-research": [
    "authority",
    "separate facts from inferences",
    "remaining uncertainty",
    "one bounded pass",
    "standalone",
    "task-scoped",
    "do not read or change task state",
    "--save",
    "new source could change",
    "primary sources",
  ],
  "harnix-debug": [
    "harnix workflow --preflight",
    "root cause",
    "falsifiable",
    "contained recovery",
    "three distinct failed hypotheses",
    "scope gate",
    "outside the goal",
    "identical check, digest, exit code",
    "replan",
    "harnix skill harnix-research",
    "repo-map --impact",
    "in_progress/implementing",
  ],
};

function fullText(name: SkillName): string {
  const skill = workflowSkills.find((candidate) => candidate.name === name);
  if (skill === undefined) throw new Error(`missing skill ${name}`);
  return [skill.content, ...Object.values(skill.references)].join("\n").toLowerCase();
}

async function readSkillSource(name: string): Promise<string> {
  return (
    await readFile(fileURLToPath(new URL(`../../src/skills/${name}/SKILL.md`, import.meta.url)), "utf8")
  ).replaceAll("\r\n", "\n");
}

describe("canonical Harnix workflow skill sources", () => {
  it("stores canonical workflow and technique skills as SKILL.md files with only references beside them", async () => {
    const packageVersion = JSON.parse(
      await readFile(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8"),
    ) as { version: string };
    const directory = fileURLToPath(new URL("../../src/skills/", import.meta.url));
    const onDisk = (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(onDisk).toEqual([...allSkillNames].sort());
    for (const name of allSkillNames) {
      const content = await readSkillSource(name);
      const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/u)?.[1] ?? "";
      const entries = (await readdir(`${directory}${name}`)).sort();

      expect(entries.filter((entry) => entry !== "references")).toEqual(["SKILL.md"]);
      expect(frontmatter).toContain(`name: ${name}`);
      expect(frontmatter).toMatch(/description: ["']?Use when\b/u);
      expect(frontmatter).toContain(`metadata:\n  version: "${packageVersion.version}"`);
      expect(frontmatter).not.toMatch(/^version:/mu);
      expect(content.split("\n").length).toBeLessThan(500);
      expect(content).not.toContain("REQUIRED SUB-SKILL");
      expect(content).not.toContain("using-git-worktrees");
      expect(content).not.toContain("subagent-driven-development");
    }
    expect(workflowSkills.map(({ name, version }) => ({ name, version }))).toEqual(
      workflowSkillNames.map((name) => ({ name, version: packageVersion.version })),
    );
  });

  it.each(workflowSkillNames)("%s keeps every responsibility of the skills it absorbed", (name) => {
    const text = fullText(name);

    for (const needle of capabilities[name]) {
      expect(text, `${name} is missing behavior: ${needle}`).toContain(needle.toLowerCase());
    }
  });

  it("keeps skill prose out of the TypeScript workflow template", async () => {
    const workflowSource = await readFile(
      fileURLToPath(new URL("../../src/templates/harnix/workflow.ts", import.meta.url)),
      "utf8",
    );

    expect(workflowSource).not.toContain('body: "Incoming state:');
    expect(workflowSource).not.toContain("export const workflowSkills: SkillTemplate[] = [");
  });

  it("makes the review and research skills discoverable and independent of task state", () => {
    const review = workflowSkills.find(({ name }) => name === "harnix-review")!;
    const research = workflowSkills.find(({ name }) => name === "harnix-research")!;

    expect(review.description.toLowerCase()).toContain("code review");
    expect(review.description.toLowerCase()).toContain("review feedback");
    expect(review.content).not.toMatch(/dispatch a code reviewer subagent|before merge to main|auto-?fix/iu);
    expect(research.description.toLowerCase()).toContain("standalone read-only research");
    for (const skill of [review, research]) {
      expect(skill.content, skill.name).toMatch(
        /does not need `\.harnix\/workflow\.md`|do not need `\.harnix\/workflow\.md`|you do not need `\.harnix\/workflow\.md`/u,
      );
    }
  });

  it("makes every task skill start from preflight so it works without a hook", () => {
    for (const name of TASK_SKILLS) {
      const skill = workflowSkills.find((candidate) => candidate.name === name)!;
      expect(skill.content, name).toContain("harnix workflow --preflight");
    }
  });

  it("keeps each rule in one place: no skill repeats the guard, the Bypass list or the state rules", () => {
    for (const skill of workflowSkills) {
      expect(skill.content, skill.name).not.toMatch(/canonicalize|symlink|junction/iu);
      expect(skill.content, skill.name).not.toMatch(/literal-value|docs-only/iu);
      expect(skill.content, skill.name).not.toMatch(/Set-Content|never create temporary/iu);
    }
  });

  it("removes the contradictions C4 to C8 from the instructions", () => {
    const all = workflowSkills
      .map((skill) => [skill.content, ...Object.values(skill.references)].join("\n"))
      .join("\n");

    expect(all).not.toMatch(/through a bounded JSON envelope on stdin to `harnix workflow --save`/u); // C4
    expect(workflowSkills.find(({ name }) => name === "harnix-verify")!.content).toMatch(/Lite task has none/u); // C5
    expect(workflowSkills.find(({ name }) => name === "harnix-implement")!.content).toMatch(/Lite task has none/u); // C5
    for (const name of ["harnix-review", "harnix-research"]) {
      const skill = workflowSkills.find((candidate) => candidate.name === name)!;
      expect(skill.content, name).toMatch(/workflow\.md/u); // C6: says it is not needed
      expect(skill.content, name).not.toMatch(/read `\.harnix\/workflow\.md`/iu);
    }
    expect(all).not.toMatch(/read[^\n]*\.active|\.active[^\n]*(read|before preflight)/iu); // C7: never read the pointer first
    expect(all).not.toContain("harnix-continue"); // C8: one route through nextStage
  });

  it("keeps each persisted checkpoint owned by one stage skill", () => {
    const plan = fullText("harnix-plan");
    const implement = fullText("harnix-implement");
    const verify = fullText("harnix-verify");
    const debug = fullText("harnix-debug");

    expect(plan).toContain("nextstage");
    expect(implement).toContain(
      "`in_progress/implementing`".toLowerCase().replace("`in_progress/implementing`", "in_progress/implementing"),
    );
    expect(verify).toContain("verifying/finishing");
    expect(verify).toContain("run `harnix workflow --finish --brief` exactly once".toLowerCase().replace(/`/gu, "`"));
    expect(verify).toContain("cancelled/cancelling");
    expect(debug).toContain("checkpoint `replan`");
    expect(verify).not.toContain("write the task `status` as `completed`");
  });

  it("resolves every earlier skill name to its replacement", () => {
    expect(Object.keys(legacySkillAliases).sort()).toEqual([
      "harnix-brainstorm",
      "harnix-check",
      "harnix-continue",
      "harnix-finish-work",
    ]);
    for (const alias of Object.values(legacySkillAliases)) {
      expect(workflowSkillNames).toContain(alias.name);
    }
  });

  it("keeps skill descriptions within the documented 1,024-character limit", () => {
    for (const skill of workflowSkills) expect(skill.description.length, skill.name).toBeLessThanOrEqual(1024);
  });
});
