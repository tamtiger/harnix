import { describe, expect, it } from "vitest";

import { matchesSafeGlob } from "../../src/utils/safe-glob.js";

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
});
