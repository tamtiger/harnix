import { describe, expect, it } from "vitest";

import { legacyStackIds, normalizeLegacyStackIds } from "src/core/stack/stack.js";

describe("legacy stack ids", () => {
  it("lists the supported legacy identifiers in sorted order", () => {
    expect(legacyStackIds).toEqual([...legacyStackIds].sort());
    expect(legacyStackIds).toContain("csharp-dotnet-abp");
    expect(Object.isFrozen(legacyStackIds)).toBe(true);
  });

  it("maps a combined identifier to sorted, de-duplicated languages and technologies", () => {
    expect(normalizeLegacyStackIds(["csharp-dotnet-abp"])).toEqual({
      languages: ["csharp"],
      technologies: ["abp", "dotnet"],
    });
    expect(normalizeLegacyStackIds(["vue", "typescript-nestjs", "vue"])).toEqual({
      languages: ["typescript"],
      technologies: ["nestjs", "vue"],
    });
  });

  it("returns empty profiles for no identifiers and keeps technology-only stacks language-free", () => {
    expect(normalizeLegacyStackIds([])).toEqual({ languages: [], technologies: [] });
    expect(normalizeLegacyStackIds(["react-web"])).toEqual({ languages: [], technologies: ["react-web"] });
  });
});
