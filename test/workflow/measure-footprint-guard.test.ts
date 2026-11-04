import { existsSync, readFileSync } from "node:fs";
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

describe("measure:footprint has no byte budget", () => {
  it("only measures: no budget module, file or assertion is left", () => {
    expect(existsSync(join(process.cwd(), "scripts", "footprint-budget.json"))).toBe(false);
    expect(existsSync(join(process.cwd(), "scripts", "footprint-budget.mjs"))).toBe(false);
    expect(readFileSync(join(process.cwd(), "scripts", "measure-footprint.mjs"), "utf8")).not.toMatch(
      /budget|maxBytes/iu,
    );
  });
});
