import { describe, expect, it } from "vitest";

import { techniqueSkills } from "src/skills/technique-skills.js";

const exercise = techniqueSkills.find((skill) => skill.name === "harnix-exercise")!;

function reference(topic: string): string {
  const text = exercise.references[topic];
  if (text === undefined) throw new Error(`missing harnix-exercise reference ${topic}`);
  return text.toLowerCase();
}

const needles: Record<string, readonly string[]> = {
  api: [
    "hurl",
    "schemathesis",
    "creates, changes and deletes real data",
    "openapi",
    "sandbox",
    "contract",
    "regression test",
    "junit",
    "exit code",
  ],
  web: [
    "observe",
    "networkidle",
    "data-testid",
    "playwright",
    "agent-browser",
    "browser tool",
    "code-only",
    "cursor",
    "kiro",
    "console",
    "4xx",
    "screenshot",
    "personal data",
    "after the user agrees",
    "repeat",
    "harnix-flaky-test",
    "residual risk",
  ],
  cli: ["stdout", "stderr", "exit code", "argument array", "consumer", "temporary directory", "windows"],
  safety: [
    "temporary database",
    "production",
    "secret",
    "personal data",
    "declared port",
    "timeout",
    "child process",
    "ask the user",
    "windows",
    "posix",
  ],
};

describe("harnix-exercise references", () => {
  it.each(Object.keys(needles))("%s reference keeps its required guidance", (topic) => {
    const text = reference(topic);
    for (const needle of needles[topic]!) expect(text, `${topic} is missing: ${needle}`).toContain(needle);
  });

  it("points at every reference from SKILL.md exactly once as a command line", () => {
    for (const topic of Object.keys(exercise.references)) {
      const pointers = exercise.content
        .split("\n")
        .filter((line) => line.includes(`harnix skill harnix-exercise --reference ${topic}`));
      expect(pointers, `${topic} pointer lines`).toHaveLength(1);
    }
  });

  it("does not make any external tool mandatory", () => {
    const all = [exercise.content, ...Object.values(exercise.references)].join("\n").toLowerCase();
    expect(all).not.toMatch(/npm install -g|pip install|brew install|cargo install/u);
  });
});
