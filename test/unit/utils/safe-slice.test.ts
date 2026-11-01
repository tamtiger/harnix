import { describe, expect, it } from "vitest";
import { safeSlice } from "src/utils/safe-slice.js";

const LONE_SURROGATE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/u;

describe("safeSlice", () => {
  it("behaves like slice when the boundary is not inside a surrogate pair", () => {
    expect(safeSlice("abcdef", 3)).toBe("abc");
    expect(safeSlice("abc", 10)).toBe("abc");
    expect(safeSlice("abc", 0)).toBe("");
  });

  it("steps back instead of cutting an astral character in half", () => {
    const text = "a\u{1F600}b";
    expect(text.slice(0, 2)).toHaveLength(2);
    expect(safeSlice(text, 2)).toBe("a");
    expect(safeSlice(text, 3)).toBe("a\u{1F600}");
  });

  it("returns an empty string when the first character does not fit", () => {
    expect(safeSlice("\u{1F600}", 1)).toBe("");
  });

  it("never leaves a lone surrogate for any cut length", () => {
    const text = "x\u{1F600}y\u{1F680}z";
    for (let length = 0; length <= text.length; length += 1) {
      expect(safeSlice(text, length)).not.toMatch(LONE_SURROGATE);
    }
  });
});
