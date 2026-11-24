import { describe, expect, it } from "vitest";

import { workflowSkills } from "src/skills/catalog.js";
import { techniqueSkills } from "src/skills/technique-skills.js";

/**
 * Contract of the review, verify and implement wording added by the external-skill-lessons epic: the
 * review reference is registered and pointed to by one line, and each text keeps the rules promised.
 */
const skillByName = new Map([...workflowSkills, ...techniqueSkills].map((skill) => [skill.name, skill]));

const lower = (text: string): string => text.toLowerCase();

function expectPhrases(text: string, label: string, phrases: readonly string[]): void {
  for (const phrase of phrases) {
    expect(lower(text), `${label} must mention "${phrase}"`).toContain(lower(phrase));
  }
}

describe("review disclosure reference", () => {
  const text = skillByName.get("harnix-review")?.references["disclosure"] ?? "";

  it("is registered and pointed to by exactly one line of harnix-review", () => {
    expect(Object.keys(skillByName.get("harnix-review")?.references ?? {})).toContain("disclosure");
    const pointer = "harnix skill harnix-review --reference disclosure";
    const lines = (skillByName.get("harnix-review")?.content ?? "").split("\n");
    expect(lines.filter((line) => line.includes(pointer))).toHaveLength(1);
  });

  it("requires Could-Not-Verify to be present even when empty", () => {
    expectPhrases(text, "disclosure", ["Could-Not-Verify", "even when empty"]);
  });

  it("asks for what was tried to disprove when nothing was found", () => {
    expectPhrases(text, "disclosure", ["tried to disprove", "found nothing"]);
  });

  it("gives an independent reviewer only the thesis and its evidence", () => {
    expectPhrases(text, "disclosure", ["independent reviewer", "thesis", "evidence", "reasoning"]);
  });

  it("does not repeat the finding-triage rules it builds on", () => {
    expect(text).not.toContain("CONFIRMED");
    expect(text).not.toContain("DISPROVED");
  });
});

describe("verification-gap wording", () => {
  const text = skillByName.get("harnix-verification-gap")?.content ?? "";

  it("makes every check name what it does not prove", () => {
    expectPhrases(text, "harnix-verification-gap", ["does not prove", "scanned scope"]);
  });

  it("treats a skipped check or zero tests run as not a pass", () => {
    expectPhrases(text, "harnix-verification-gap", ["skipped", "zero tests", "not a pass"]);
  });
});

describe("implement discoveries wording", () => {
  const text = skillByName.get("harnix-implement")?.references.discoveries ?? "";

  it("sends an unreachable criterion to replan with what would resolve it", () => {
    expectPhrases(text, "discoveries", ["replan", "what would resolve it", "weaken"]);
  });

  it("adds no transition or CLI flag beyond the existing replan flow", () => {
    expect(text).not.toMatch(/--escalate|--blocked-by/u);
  });
});

describe("no quoted passage from the source repositories", () => {
  it.each([
    ["harnix-review", "disclosure"],
    ["harnix-verification-gap", ""],
    ["harnix-implement", "discoveries"],
  ])("%s %s is written in harnix's own words", (skill, topic) => {
    const entry = skillByName.get(skill);
    const text = topic === "" ? (entry?.content ?? "") : (entry?.references[topic] ?? "");
    for (const borrowed of [
      "Don't fix gaps; surface them",
      "Not detected means not detected",
      "Don't lower the bar",
      "If you mean NO_GO, write NO_GO",
    ]) {
      expect(text).not.toContain(borrowed);
    }
  });
});
