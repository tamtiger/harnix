import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { workflowSkills } from "../../src/skills/catalog.js";

const skillNames = [
  "harnix-brainstorm",
  "harnix-implement",
  "harnix-check",
  "harnix-finish-work",
  "harnix-continue",
  "harnix-research",
  "harnix-debug",
] as const;

const behaviorNeedles: Record<(typeof skillNames)[number], readonly string[]> = {
  "harnix-brainstorm": [
    "decision inventory",
    "observable acceptance criteria",
    "placeholder scan",
    "hyphen between words",
    "implementation checklist",
    "Do not mark the task `ready`",
    "stale context",
    "context reselection",
    "TaskRecord schema v2",
    "criterionIds",
    "@task-contract",
    "context checkpoint",
    "assumptions and inferences",
    "no blocking question remains",
    "not a second approval gate",
    "harnix workflow save",
    "bounded JSON envelope on stdin",
  ],
  "harnix-implement": [
    "Review the plan critically",
    "Verify RED",
    "minimal implementation",
    "technical feedback",
    "implementation checklist",
    "workflow snapshot",
    "inputDigest",
    "harnix workflow save",
  ],
  "harnix-check": [
    "Map every claim",
    "exit code",
    "compliance",
    "quality and security",
    "standalone read-only review",
    "working-tree diff",
    "explicit commit range",
    "bounded paths",
    "file:line",
    "fix direction",
    "ready-with-fixes",
    "omitted checks",
    "residual risk",
    "workflow snapshot",
    "inputDigest",
    "harnix workflow save",
  ],
  "harnix-finish-work": [
    "active pointer",
    "completed",
    "Never commit",
    "residual risks",
    "project-specific release instruction",
    "verification-inputs.json",
    "harnix workflow finish",
  ],
  "harnix-continue": [
    "routing table",
    "planning",
    "in_progress",
    "verifying",
    "contextDrift",
    "checkpoint `replan`",
    "reselect context",
    "legacy-task-schema",
    "v1 to v2 migration",
    "harnix workflow inspect",
    "harnix workflow save",
  ],
  "harnix-research": [
    "source authority",
    "facts from inferences",
    "remaining uncertainty",
    "one material unknown",
    "harnix workflow save",
  ],
  "harnix-debug": [
    "root cause",
    "one falsifiable hypothesis",
    "contained recovery",
    "three failed hypotheses",
    "harnix workflow save",
  ],
};

describe("canonical Harnix workflow skill sources", () => {
  it("stores all seven discoverable skills as real, self-contained SKILL.md files", async () => {
    const packageVersion = JSON.parse(
      await readFile(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8"),
    ) as { version: string };

    for (const name of skillNames) {
      const content = await readSkill(name);
      const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/u)?.[1] ?? "";

      expect(frontmatter).toContain(`name: ${name}`);
      expect(frontmatter).toMatch(/description: ["']?Use when\b/u);
      expect(frontmatter).toContain(`metadata:\n  version: "${packageVersion.version}"`);
      expect(frontmatter).not.toMatch(/^version:/mu);
      expect(content).toContain("## Harnix activation guard");
      expect(content).toContain("`.harnix/config.yaml`");
      expect(content).toContain("## Incoming state");
      expect(content).toContain("## Persist");
      expect(content).toContain("## Exit");
      expect(content).toContain("## Upstream basis");
      expect(content.split("\n").length).toBeLessThan(500);
      expect(content).not.toContain("REQUIRED SUB-SKILL");
      expect(content).not.toContain("using-git-worktrees");
      expect(content).not.toContain("subagent-driven-development");

      for (const needle of behaviorNeedles[name]) {
        expect(content.toLowerCase(), `${name} is missing behavior: ${needle}`).toContain(needle.toLowerCase());
      }
    }

    expect(workflowSkills.map(({ name, version }) => ({ name, version }))).toEqual(
      skillNames.map((name) => ({ name, version: packageVersion.version })),
    );
  });

  it("keeps skill prose out of the TypeScript workflow template", async () => {
    const workflowSource = await readFile(fileURLToPath(new URL("../../src/templates/harnix/workflow.ts", import.meta.url)), "utf8");

    expect(workflowSource).not.toContain("body: \"Incoming state:");
    expect(workflowSource).not.toContain("export const workflowSkills: SkillTemplate[] = [");
  });

  it("makes the check skill discoverable for code review and review feedback", async () => {
    const content = await readSkill("harnix-check");
    const description = content.match(/^description:\s*(.+)$/mu)?.[1] ?? "";

    expect(description.toLowerCase()).toContain("code review");
    expect(description.toLowerCase()).toContain("review feedback");
    expect(content).not.toMatch(/dispatch a code reviewer subagent|before merge to main|auto-?fix/iu);
  });

  it("keeps each persisted checkpoint owned by one stage skill", async () => {
    const brainstorm = await readSkill("harnix-brainstorm");
    const implement = await readSkill("harnix-implement");
    const check = await readSkill("harnix-check");
    const finish = await readSkill("harnix-finish-work");
    const continuation = await readSkill("harnix-continue");

    expect(brainstorm).toContain("outside `planning|replan`");
    expect(implement).toContain("`in_progress/implementing`");
    expect(implement).not.toContain("`implementing` or `debugging`");
    expect(check).toContain("persist `verifying/finishing`");
    expect(finish).toContain("Accept only `verifying/finishing`");
    expect(finish).toContain("run `harnix workflow finish` exactly once");
    expect(finish).not.toContain("write the task `status` as `completed`");
    expect(continuation).toContain("Blocked state takes precedence over its checkpoint");
  });
});

async function readSkill(name: (typeof skillNames)[number]): Promise<string> {
  return (await readFile(fileURLToPath(new URL(`../../src/skills/${name}/SKILL.md`, import.meta.url)), "utf8")).replaceAll("\r\n", "\n");
}
