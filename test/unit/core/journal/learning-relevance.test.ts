import { describe, expect, it } from "vitest";

import { relevanceScore } from "src/core/journal/learning-relevance.js";

describe("relevanceScore", () => {
  it("counts the active paths that overlap any source path", () => {
    expect(relevanceScore(["src/core/a.ts", "src/utils/b.ts"], ["src/core", "docs"])).toBe(1);
    expect(relevanceScore(["src/core/a.ts", "src/core/b.ts"], ["src/core"])).toBe(2);
  });

  it("is zero without overlap or without either side", () => {
    expect(relevanceScore(["docs/a.md"], ["src"])).toBe(0);
    expect(relevanceScore([], ["src"])).toBe(0);
    expect(relevanceScore(["src/a.ts"], [])).toBe(0);
  });
});
