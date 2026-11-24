import { describe, expect, it } from "vitest";

import { workflowSkills } from "src/skills/catalog.js";

/**
 * Contract of the three reasoning references added by the external-skill-lessons epic: each one is
 * registered, is pointed to by exactly one line of its skill, and keeps the rules the task promised.
 */
const CASES = [
  {
    skill: "harnix-plan",
    topic: "pre-ready-risk",
    phrases: [
      "premortem",
      "tripwire",
      "stop condition",
      "--add-risk",
      "load-bearing",
      "killer condition",
      "spike",
      "one-way door",
      "Full",
      "When not to use",
    ],
  },
  {
    skill: "harnix-debug",
    topic: "rival-hypotheses",
    phrases: [
      "before you look at the evidence",
      "expected signature",
      "negative constraint",
      "invariant",
      "not enough to tell them apart",
      "one hypothesis at a time",
      "replan",
    ],
  },
  {
    skill: "harnix-research",
    topic: "source-verification",
    phrases: [
      "unverified",
      "unverifiable",
      "wrong",
      "network error",
      "Evidence",
      "Inference",
      "Assumption",
      "scanned scope",
    ],
  },
] as const;

const skillByName = new Map(workflowSkills.map((skill) => [skill.name, skill]));

describe("reasoning references", () => {
  it.each(CASES)("registers $skill --reference $topic", ({ skill, topic }) => {
    expect(Object.keys(skillByName.get(skill)?.references ?? {})).toContain(topic);
  });

  it.each(CASES)("points to $topic from exactly one line of $skill", ({ skill, topic }) => {
    const content = skillByName.get(skill)?.content ?? "";
    const pointer = `harnix skill ${skill} --reference ${topic}`;
    expect(content.split("\n").filter((line) => line.includes(pointer))).toHaveLength(1);
  });

  it.each(CASES)("keeps the promised rules of $skill/$topic", ({ skill, topic, phrases }) => {
    const text = skillByName.get(skill)?.references[topic] ?? "";
    for (const phrase of phrases) {
      expect(text.toLowerCase(), `${topic} must mention "${phrase}"`).toContain(phrase.toLowerCase());
    }
  });

  it.each(CASES)(
    "writes $topic in its own words, with no quoted passage from the source repositories",
    ({ skill, topic }) => {
      const text = skillByName.get(skill)?.references[topic] ?? "";
      for (const borrowed of [
        "This conversion step is mandatory",
        "A resolving DOI alone proves nothing",
        "A single failed hoop eliminates a rival",
        "Don't fix gaps; surface them",
      ]) {
        expect(text).not.toContain(borrowed);
      }
    },
  );

  it("gives the plan reference a section that says when not to use it", () => {
    const text = skillByName.get("harnix-plan")?.references["pre-ready-risk"] ?? "";
    expect(text).toMatch(/^## When not to use/imu);
  });
});
