import { describe, expect, it } from "vitest";

import {
  compareEntries,
  entryKey,
  entryLabel,
  isNonEmptyText,
  normalizeGlobalPath,
  serializeManifest,
  validateGlobalManagedManifest,
} from "src/core/global/manifest.js";
import type { GlobalManagedEntry } from "src/core/global/types.js";

const entry = (path: string, sourceId: string): GlobalManagedEntry => ({
  path,
  sourceId,
  kind: "file",
  generatedHash: "a".repeat(64),
  generatorVersion: "2.0.0",
});

describe("global managed manifest", () => {
  it("orders entries by path then source id using code units", () => {
    const entries = [entry("skills/b/SKILL.md", "x"), entry("skills/a/references/z.md", "x")];

    expect(entries.sort(compareEntries).map(entryKey)).toEqual([
      "skills/a/references/z.md\u0000x",
      "skills/b/SKILL.md\u0000x",
    ]);
    expect(entryLabel(entry("a.md", "id"))).toContain("a.md");
  });

  it("rejects an unsorted or duplicate entry list", () => {
    const valid = { generator: "harnix", schemaVersion: 1, platform: "kiro" };
    const unsorted = [entry("b.md", "x"), entry("a.md", "x")];

    expect(() => validateGlobalManagedManifest({ ...valid, entries: unsorted })).toThrow("sorted");
    expect(() =>
      validateGlobalManagedManifest({ ...valid, entries: [entry("a.md", "x"), entry("a.md", "x")] }),
    ).toThrow("unique");
  });

  it("rejects an unknown platform and round-trips a valid manifest", () => {
    expect(() =>
      validateGlobalManagedManifest({ generator: "harnix", schemaVersion: 1, platform: "gemini", entries: [] }),
    ).toThrow();
    const manifest = validateGlobalManagedManifest({
      generator: "harnix",
      schemaVersion: 1,
      platform: "claude",
      entries: [entry("a.md", "x")],
    });

    expect(JSON.parse(serializeManifest(manifest))).toEqual(manifest);
  });

  it("accepts only canonical relative paths and non-empty text", () => {
    expect(normalizeGlobalPath("skills/a/SKILL.md")).toBe("skills/a/SKILL.md");
    expect(() => normalizeGlobalPath("../escape")).toThrow("canonical relative");
    expect(() => normalizeGlobalPath("skills//a")).toThrow("canonical relative");
    expect(isNonEmptyText("  ")).toBe(false);
    expect(isNonEmptyText("x")).toBe(true);
  });
});
