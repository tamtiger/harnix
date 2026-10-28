import { describe, expect, it } from "vitest";

import { legacySkillAliases, renderSkill, workflowSkills } from "src/skills/catalog.js";

const TOKEN_BUDGET = 2_000;
const tokens = (text: string): number => Math.ceil(text.length / 4);

const expectedReferences: Record<string, string[]> = {
  "harnix-plan": [
    "decision-discipline",
    "epic",
    "grilling",
    "migration",
    "multi-repo",
    "plan-critique",
    "ready-review",
    "replan",
  ],
  "harnix-implement": ["brownfield", "commit-hygiene", "discoveries", "dotnet-microservices", "feedback"],
  "harnix-verify": [
    "agent-transport",
    "cookbook-commands",
    "cookbook-notes",
    "evidence",
    "finish-cancel",
    "gates",
    "rationalizations",
    "so-what",
    "task-state",
    "technical-recap",
    "workflow-routing",
  ],
  "harnix-review": ["finding-triage", "multi-lens"],
  "harnix-research": ["scouting-isolation"],
  "harnix-debug": ["feedback-loop"],
};

describe("skill catalog references", () => {
  it("offers the documented references per skill", () => {
    expect(
      Object.fromEntries(workflowSkills.map((skill) => [skill.name, Object.keys(skill.references).sort()])),
    ).toEqual(expectedReferences);
  });

  it("keeps every reference small, self-contained and one level deep", () => {
    for (const skill of workflowSkills) {
      for (const [topic, content] of Object.entries(skill.references)) {
        const label = `${skill.name}/${topic}`;
        expect(content.startsWith("# "), label).toBe(true);
        expect(tokens(content), label).toBeLessThanOrEqual(TOKEN_BUDGET);
        expect(content, label).not.toMatch(/\]\((?:\.\/)?[\w-]+\.md\)/u);
        expect(content.endsWith("\n"), label).toBe(true);
      }
    }
  });

  it("tells the agent to load each reference with the full command and says when", () => {
    for (const skill of workflowSkills) {
      for (const topic of Object.keys(skill.references)) {
        expect(skill.content, `${skill.name}/${topic}`).toContain(`harnix skill ${skill.name} --reference ${topic}`);
      }
    }
  });

  it("never mentions a reference in shorthand or one that does not exist", () => {
    const names = new Set(workflowSkills.map((skill) => skill.name));
    for (const skill of workflowSkills) {
      const texts = [skill.content, ...Object.values(skill.references)].join("\n");
      const bare = texts.match(/--reference [a-z-]+/gu) ?? [];
      const full = [...texts.matchAll(/harnix skill (harnix-[a-z]+) --reference ([a-z-]+)/gu)];

      expect(full.length, skill.name).toBe(bare.length);
      for (const [, name, topic] of full) {
        expect(names.has(name!), `${skill.name} -> ${name}`).toBe(true);
        const target = workflowSkills.find((candidate) => candidate.name === name)!;
        expect(Object.keys(target.references), `${skill.name} -> ${name}/${topic}`).toContain(topic);
      }
    }
  });

  it("resolves every earlier skill name to an existing skill and renders bytes unchanged", () => {
    const names = new Set(workflowSkills.map((skill) => skill.name));
    for (const alias of Object.values(legacySkillAliases)) expect(names.has(alias.name)).toBe(true);
    for (const skill of workflowSkills) expect(renderSkill(skill)).toBe(skill.content);
  });

  it("package version is a valid semver in 2.x series", async () => {
    const { readFile } = await import("node:fs/promises");
    const pkg = JSON.parse(await readFile("package.json", "utf8"));
    expect(pkg.version).toMatch(/^2\.\d+\.\d+(?:-[a-z0-9.]+)?$/u);
  });
});
