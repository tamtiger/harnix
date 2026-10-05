import { describe, expect, it } from "vitest";

import { normalizeCheckCwd } from "src/core/tasks/check-cwd.js";

describe("normalizeCheckCwd", () => {
  it.each([
    [".", "."],
    ["packages/portal", "packages/portal"],
    ["./packages//portal/", "packages/portal"],
    ["packages\\portal", "packages/portal"],
  ])("normalizes %j to %j", (input, expected) => {
    expect(normalizeCheckCwd(input)).toBe(expected);
  });

  it.each(["", "../other-repo", "a/../../b", "/etc", "C:/x", "C:\\x", "D:foo", "a\u0000b", "\\\\server\\share"])(
    "rejects the unsafe cwd %j",
    (input) => {
      expect(() => normalizeCheckCwd(input)).toThrow();
    },
  );
});
