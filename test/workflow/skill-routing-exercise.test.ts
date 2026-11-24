import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

interface Routing {
  hit1: number;
  hit3: number;
  falseTrigger: number;
  failures: string[];
}

type Suggest = (root: string, cwd: string, query: string) => string[];

const { exerciseRouting } = (await import(
  new URL("../../scripts/exercise-skill-routing.mjs", import.meta.url).href
)) as { exerciseRouting(root: string, cwd: string, suggest: Suggest): Routing };

const root = fileURLToPath(new URL("../..", import.meta.url));
const fixture = JSON.parse(readFileSync(new URL("./skill-routing-cases.json", import.meta.url), "utf8")) as {
  cases: { query: string; expect: string; shouldTrigger: boolean }[];
};

describe("scripts/exercise-skill-routing.mjs", () => {
  it("passes when every query lands on the expected skill and unrelated prompts suggest nothing", () => {
    const answers = new Map(fixture.cases.map((entry) => [entry.query, entry.shouldTrigger ? [entry.expect] : []]));
    const result = exerciseRouting(root, root, (_root, _cwd, query) => answers.get(query) ?? []);
    expect(result).toMatchObject({ hit1: 1, hit3: 1, falseTrigger: 0, failures: [] });
  });

  it("reports a failure for each floor that is missed and for a prompt that should suggest nothing", () => {
    const result = exerciseRouting(root, root, () => ["harnix-plan"]);
    expect(result.failures.some((line) => line.startsWith("hit@1"))).toBe(true);
    expect(result.failures.some((line) => line.includes("should suggest nothing"))).toBe(true);
  });
});
