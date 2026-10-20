import { describe, expect, it } from "vitest";

import type { DetectionMatch, LanguageId } from "src/catalog/catalog.js";
import { projectLanguages, selectedLanguages } from "src/core/stack/language-selection.js";

const language = (id: LanguageId, confidence: DetectionMatch["confidence"]): DetectionMatch => ({
  confidence,
  evidence: [],
  facet: "language",
  id,
  kind: "language",
  source: "catalog",
});

describe("selectedLanguages", () => {
  it("drops weak languages once a stronger one exists", () => {
    const matches = [language("javascript", "weak"), language("python", "weak"), language("typescript", "confirmed")];

    expect(selectedLanguages(matches)).toEqual(["typescript"]);
  });

  it("keeps weak languages when nothing stronger was found", () => {
    expect(selectedLanguages([language("python", "weak"), language("javascript", "weak")])).toEqual([
      "javascript",
      "python",
    ]);
  });

  it("ignores technology matches", () => {
    expect(selectedLanguages([{ ...language("python", "weak"), facet: "technology", kind: "framework" }])).toEqual([]);
  });
});

describe("projectLanguages", () => {
  it("unions package languages instead of the whole tree when packages exist", () => {
    const matches = [language("python", "weak"), language("typescript", "confirmed")];

    expect(
      projectLanguages(matches, [{ languages: ["typescript"] }, { languages: ["javascript", "typescript"] }]),
    ).toEqual(["javascript", "typescript"]);
  });

  it("falls back to the selected languages without packages", () => {
    expect(projectLanguages([language("python", "weak")], [])).toEqual(["python"]);
  });
});
