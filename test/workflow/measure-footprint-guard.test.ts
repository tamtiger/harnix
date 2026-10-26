import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface AssertBuilt {
  assertBuilt(root: string, exists?: (path: string) => boolean): void;
}

const { assertBuilt } = (await import(new URL("../../scripts/assert-built.mjs", import.meta.url).href)) as AssertBuilt;

describe("measure:footprint build guard", () => {
  it("asks for pnpm build when dist/cli.js is missing", () => {
    expect(() => assertBuilt("/repo", () => false)).toThrow("dist/cli.js is missing; run `pnpm build`");
  });

  it("looks for the built CLI and passes when it exists", () => {
    const seen: string[] = [];

    expect(() =>
      assertBuilt("/repo", (path) => {
        seen.push(path);
        return true;
      }),
    ).not.toThrow();
    expect(seen).toEqual([join("/repo", "dist", "cli.js")]);
  });
});

interface FootprintBudget {
  assertWithinBudget(bytes: number, maxBytes: number): void;
  readBudget(root: string, read?: (path: string) => string): number;
}

const { assertWithinBudget, readBudget } = (await import(
  new URL("../../scripts/footprint-budget.mjs", import.meta.url).href
)) as FootprintBudget;

describe("measure:footprint byte budget", () => {
  it("passes at or below the budget", () => {
    expect(() => assertWithinBudget(1000, 1000)).not.toThrow();
    expect(() => assertWithinBudget(999, 1000)).not.toThrow();
  });

  it("fails and names the overshoot and the budget file when the footprint exceeds the budget", () => {
    expect(() => assertWithinBudget(1501, 1000)).toThrow(/501 bytes over.*scripts\/footprint-budget\.json/);
  });

  it("reads maxBytes from the committed budget file", () => {
    const seen: string[] = [];
    const maxBytes = readBudget("/repo", (path) => {
      seen.push(path);
      return '{ "maxBytes": 4096 }';
    });

    expect(maxBytes).toBe(4096);
    expect(seen).toEqual([join("/repo", "scripts", "footprint-budget.json")]);
  });

  it("rejects a budget file without a positive integer maxBytes", () => {
    for (const body of ["{}", '{ "maxBytes": 0 }', '{ "maxBytes": "5" }', '{ "maxBytes": 1.5 }', "not json"]) {
      expect(() => readBudget("/repo", () => body)).toThrow(/footprint-budget\.json/);
    }
  });
});
