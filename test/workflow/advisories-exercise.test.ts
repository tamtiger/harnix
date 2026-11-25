import { describe, expect, it } from "vitest";

interface Scenario {
  name: string;
  match: RegExp;
  expect: boolean;
}

const { CASES, evaluate } = (await import(new URL("../../scripts/exercise-advisories.mjs", import.meta.url).href)) as {
  CASES: Scenario[];
  evaluate(scenario: Scenario, observed: string[]): string | undefined;
};

describe("scripts/exercise-advisories.mjs", () => {
  it("covers the early edit, stale draft, code-only evidence and premortem advisories, present and absent", () => {
    const names = CASES.map((scenario) => scenario.name).join("\n");

    expect(names).toMatch(/changed while planning/u);
    expect(names).toMatch(/real ready transition/u);
    expect(names).toMatch(/commit on relevantPaths/u);
    expect(names).toMatch(/code-only evidence with no risk/u);
    expect(names).toMatch(/premortem/u);
    expect(CASES.some((scenario) => scenario.expect)).toBe(true);
    expect(CASES.some((scenario) => !scenario.expect)).toBe(true);
  });

  it("passes when the advisory shows up exactly as expected and reports the case that does not", () => {
    const present = { name: "x", match: /already changed/u, expect: true };
    const absent = { name: "y", match: /already changed/u, expect: false };

    expect(evaluate(present, ["Files already changed here"])).toBeUndefined();
    expect(evaluate(absent, ["something else"])).toBeUndefined();
    expect(evaluate(present, [])).toContain("expected");
    expect(evaluate(absent, ["Files already changed here"])).toContain("absent");
  });
});
