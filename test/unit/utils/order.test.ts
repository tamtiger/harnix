import { describe, expect, it } from "vitest";

import { compareCodeUnits } from "src/utils/order.js";

describe("compareCodeUnits", () => {
  it("returns -1, 0 and 1 for ordered, equal and reversed strings", () => {
    expect(compareCodeUnits("a", "b")).toBe(-1);
    expect(compareCodeUnits("b", "a")).toBe(1);
    expect(compareCodeUnits("same", "same")).toBe(0);
    expect(compareCodeUnits("", "a")).toBe(-1);
  });

  it("orders by UTF-16 code unit, not by locale, so results are identical on every machine", () => {
    // Uppercase sorts before lowercase, and accented letters sort after every ASCII letter.
    expect(["b", "a", "Z", "ä", "z"].sort(compareCodeUnits)).toEqual(["Z", "a", "b", "z", "ä"]);
    expect(compareCodeUnits("Z", "a")).toBe(-1);
    expect(compareCodeUnits("z", "ä")).toBe(-1);
  });

  it("compares a prefix as smaller than its extension", () => {
    expect(compareCodeUnits("task", "task-2")).toBe(-1);
    expect(["task-2", "task", "task-1"].sort(compareCodeUnits)).toEqual(["task", "task-1", "task-2"]);
  });

  it("compares astral characters by their surrogate code units", () => {
    // U+1F600 is the surrogate pair D83D DE00, which sorts before U+FF5E (a single unit above D83D).
    expect(compareCodeUnits("\u{1F600}", "～")).toBe(-1);
  });
});
