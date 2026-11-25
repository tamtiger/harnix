import { describe, expect, it } from "vitest";

interface Scenario {
  name: string;
  include?: string[];
  exclude?: string[];
  hint: boolean;
}

interface Preflight {
  suggestedTechniques?: string[];
  techniqueHint?: string;
}

const { CASES, evaluate } = (await import(
  new URL("../../scripts/exercise-technique-hint.mjs", import.meta.url).href
)) as {
  CASES: Scenario[];
  evaluate(scenario: Scenario, preflight: Preflight | undefined): string | undefined;
};

describe("scripts/exercise-technique-hint.mjs", () => {
  it("covers a plain Full task, a task that asks for sequential thinking, a migration and a quiet task", () => {
    const names = CASES.map((scenario) => scenario.name).join("\n");

    expect(names).toMatch(/plain Full task/u);
    expect(names).toMatch(/asks for sequential thinking/u);
    expect(names).toMatch(/migration/u);
    expect(names).toMatch(/quiet task/u);
    expect(CASES.some((scenario) => scenario.hint)).toBe(true);
    expect(CASES.some((scenario) => !scenario.hint)).toBe(true);
  });

  it("passes only when the suggestions and the hint are exactly as expected", () => {
    const scenario = { name: "x", include: ["harnix-a"], exclude: ["harnix-b"], hint: true };
    const good = { suggestedTechniques: ["harnix-a"], techniqueHint: "Load each with `harnix skill <name> --raw`" };

    expect(evaluate(scenario, good)).toBeUndefined();
    expect(evaluate(scenario, { ...good, suggestedTechniques: ["harnix-a", "harnix-b"] })).toContain("harnix-b");
    expect(evaluate(scenario, { suggestedTechniques: ["harnix-a"] })).toContain("techniqueHint");
    expect(evaluate({ ...scenario, hint: false }, good)).toContain("techniqueHint");
    expect(evaluate(scenario, undefined)).toContain("no preflight");
  });
});
