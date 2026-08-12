import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

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
    "Do not mark the task `ready`",
  ],
  "harnix-implement": [
    "Review the plan critically",
    "Verify RED",
    "minimal implementation",
    "technical feedback",
  ],
  "harnix-check": [
    "Map every claim",
    "exit code",
    "compliance",
    "quality and security",
  ],
  "harnix-finish-work": [
    "active pointer",
    "completed",
    "Never commit",
    "residual risks",
  ],
  "harnix-continue": [
    "routing table",
    "planning",
    "in_progress",
    "verifying",
  ],
  "harnix-research": [
    "source authority",
    "facts from inferences",
    "remaining uncertainty",
    "one material unknown",
  ],
  "harnix-debug": [
    "root cause",
    "one falsifiable hypothesis",
    "contained recovery",
    "three failed hypotheses",
  ],
};

describe("canonical Harnix workflow skill sources", () => {
  it("stores all seven discoverable skills as real, self-contained SKILL.md files", async () => {
    for (const name of skillNames) {
      const content = await readSkill(name);
      const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/u)?.[1] ?? "";

      expect(frontmatter).toContain(`name: ${name}`);
      expect(frontmatter).toMatch(/description: ["']?Use when\b/u);
      expect(frontmatter).not.toMatch(/^\s*(?:metadata|version|license):/mu);
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
  });

  it("keeps skill prose out of the TypeScript workflow template", async () => {
    const workflowSource = await readFile(fileURLToPath(new URL("../../src/templates/harnix/workflow.ts", import.meta.url)), "utf8");

    expect(workflowSource).not.toContain("body: \"Incoming state:");
    expect(workflowSource).not.toContain("export const workflowSkills: SkillTemplate[] = [");
  });
});

async function readSkill(name: (typeof skillNames)[number]): Promise<string> {
  return readFile(fileURLToPath(new URL(`../../src/skills/${name}/SKILL.md`, import.meta.url)), "utf8");
}
