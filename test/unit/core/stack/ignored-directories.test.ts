import { describe, expect, it } from "vitest";

import { IGNORED_DIRECTORY_NAMES } from "src/core/stack/ignored-directories.js";

describe("IGNORED_DIRECTORY_NAMES", () => {
  it("names the VCS, Harnix, dependency, build and agent tool directories once and in code-unit order", () => {
    expect(new Set(IGNORED_DIRECTORY_NAMES).size).toBe(IGNORED_DIRECTORY_NAMES.length);
    expect([...IGNORED_DIRECTORY_NAMES]).toEqual([...IGNORED_DIRECTORY_NAMES].sort());
    expect(IGNORED_DIRECTORY_NAMES).toEqual(
      expect.arrayContaining([".git", ".harnix", "node_modules", "dist", ".kilo", ".worktrees", ".cursor", ".claude"]),
    );
  });

  it("never lists a source directory name", () => {
    for (const source of ["src", "test", "lib", "app", "docs"]) expect(IGNORED_DIRECTORY_NAMES).not.toContain(source);
  });
});
