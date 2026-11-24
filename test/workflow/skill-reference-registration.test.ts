import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { workflowSkills } from "src/skills/catalog.js";
import { techniqueSkills } from "src/skills/technique-skills.js";

const skillsDirectory = join(process.cwd(), "src", "skills");
const registered = new Map(
  [...workflowSkills, ...techniqueSkills].map((skill) => [skill.name, Object.keys(skill.references).sort()]),
);

function referenceFiles(skill: string): string[] {
  try {
    return readdirSync(join(skillsDirectory, skill, "references"))
      .filter((name) => name.endsWith(".md"))
      .map((name) => name.slice(0, -".md".length))
      .sort();
  } catch {
    return [];
  }
}

describe("skill reference registration", () => {
  const skillDirectories = readdirSync(skillsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  it("registers every skill directory in a catalog", () => {
    expect(skillDirectories.filter((name) => !registered.has(name))).toEqual([]);
  });

  it.each(skillDirectories)("%s registers every file in its references folder and nothing else", (skill) => {
    expect(registered.get(skill) ?? []).toEqual(referenceFiles(skill));
  });
});
