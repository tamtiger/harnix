import { describe, expect, it } from "vitest";

import { matchesSafeGlob } from "src/utils/safe-glob.js";

describe("safe glob matcher", () => {
  it.each([
    ["src/**/*.ts", "src/main.ts", true],
    ["src/**/*.ts", "src/features/main.ts", true],
    ["src/*.ts", "src/features/main.ts", false],
    ["docs/[draft].md", "docs/[draft].md", true],
    ["docs/[draft].md", "docs/d.md", false],
    ["test?.ts", "test?.ts", true],
    ["test?.ts", "test1.ts", false],
  ])("matches %s against %s without expanding unsupported syntax", (glob, path, expected) => {
    expect(matchesSafeGlob(path, glob)).toBe(expected);
  });

  it.each([
    ["**/*.ts", "src/a/b.ts", true],
    ["src/**", "src/a/b", true],
    ["src/**/x", "src/x", true],
    ["a/**/b", "a/c/d/b", true],
    ["a/**/b", "a/cb", false],
  ])("keeps globstar semantics for %s against %s", (glob, path, expected) => {
    expect(matchesSafeGlob(path, glob)).toBe(expected);
  });

  it("matches a many-star glob from repository content in linear time", () => {
    const started = performance.now();

    expect(matchesSafeGlob("a".repeat(60) + ".ts", "*a*a*a*a*a*a*a*a*a*a*a*a*b")).toBe(false);
    expect(performance.now() - started).toBeLessThan(100);
  });
});
