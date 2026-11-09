import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { TOKEN_BUDGETS, approximateTokens, skillBudget } from "src/templates/harnix/token-budgets.js";

describe("token budgets", () => {
  it("holds every ceiling in one json file the measure script also reads", async () => {
    const file = JSON.parse(
      await readFile(new URL("../../../../src/templates/harnix/token-budgets.json", import.meta.url), "utf8"),
    ) as unknown;

    expect(file).toEqual(TOKEN_BUDGETS);
  });

  it("keeps the agreed ceilings", () => {
    expect(TOKEN_BUDGETS).toMatchObject({
      alwaysLoaded: 1500,
      skill: 2000,
      techniqueSkill: 1200,
      reference: 1200,
      workflow: 2500,
      directPath: 3600,
      fullPath: 11000,
    });
    expect(skillBudget("harnix-plan")).toBe(1700);
    expect(skillBudget("harnix-review")).toBe(2000);
  });

  it("leaves the path ceilings room for the stacked per-file ceilings", () => {
    const stacked =
      TOKEN_BUDGETS.alwaysLoaded + TOKEN_BUDGETS.workflow + skillBudget("harnix-plan") + 2 * TOKEN_BUDGETS.skill;

    expect(TOKEN_BUDGETS.fullPath).toBeGreaterThanOrEqual(stacked);
    expect(TOKEN_BUDGETS.directPath).toBeGreaterThanOrEqual(TOKEN_BUDGETS.alwaysLoaded + TOKEN_BUDGETS.skill);
  });

  it("approximates tokens as characters divided by four, rounded up", () => {
    expect(approximateTokens("abcd")).toBe(1);
    expect(approximateTokens("abcde")).toBe(2);
  });
});
