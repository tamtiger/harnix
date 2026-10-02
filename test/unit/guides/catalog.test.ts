import { describe, expect, it } from "vitest";

import type { GuideDescriptor } from "src/catalog/types.js";
import { guideOutputPath, selectGuideSources, type GuideSource } from "src/guides/catalog.js";
import { guideSources } from "src/guides/sources.js";

const provenance = { adaptedAt: "2026-08-13", license: "MIT", source: "Harnix" } as const;

function synthetic(id: string, overrides: Partial<GuideDescriptor> = {}): GuideSource {
  return {
    descriptor: {
      id,
      title: id,
      description: id,
      category: "guide",
      appliesTo: {},
      activation: "always",
      priority: 0,
      contentPath: `${id}.md`,
      provenance,
      ...overrides,
    },
    content: `# ${id}\n`,
  };
}

const ids = (sources: readonly GuideSource[]): string[] => sources.map(({ descriptor }) => descriptor.id);

describe("packaged guide sources", () => {
  it("has unique IDs and content paths and non-empty markdown for every guide", () => {
    const descriptors = guideSources.map(({ descriptor }) => descriptor);

    expect(new Set(descriptors.map(({ id }) => id)).size).toBe(descriptors.length);
    expect(new Set(descriptors.map(({ contentPath }) => contentPath)).size).toBe(descriptors.length);
    expect(guideSources.every(({ content }) => content.trim().length > 0)).toBe(true);
  });

  it("selects only the common guide when no language or technology is chosen", () => {
    expect(ids(selectGuideSources({ languages: [], technologies: [] }))).toEqual(["common-engineering"]);
  });

  it("orders common, then language, then technology guides and skips unrelated stacks", () => {
    const selected = ids(selectGuideSources({ languages: ["typescript"], technologies: ["nestjs"] }));

    expect(selected[0]).toBe("common-engineering");
    expect(selected.indexOf("language-typescript")).toBeGreaterThan(0);
    expect(selected.indexOf("technology-nestjs")).toBeGreaterThan(selected.indexOf("language-typescript"));
    expect(selected).not.toContain("language-go");
  });

  it("maps a guide to its output path under .harnix/spec/guides", () => {
    const common = guideSources.find(({ descriptor }) => descriptor.id === "common-engineering")!;

    expect(guideOutputPath(common)).toBe(`.harnix/spec/guides/${common.descriptor.contentPath}`);
    expect(guideOutputPath(common).startsWith(".harnix/spec/guides/")).toBe(true);
  });
});

describe("selectGuideSources composition", () => {
  const selection = { languages: [], technologies: [] };

  it("includes a path-activated guide only when an active path matches its glob", () => {
    const sources = [
      synthetic("always"),
      synthetic("tests", { activation: "path", appliesTo: { paths: ["test/**/*.ts"] } }),
    ];

    expect(ids(selectGuideSources({ ...selection, activePaths: ["test/unit/a.test.ts"] }, sources))).toEqual([
      "always",
      "tests",
    ]);
    expect(ids(selectGuideSources({ ...selection, activePaths: ["src/a.ts"] }, sources))).toEqual(["always"]);
    expect(ids(selectGuideSources(selection, sources))).toEqual(["always"]);
  });

  it("includes a task-activated guide only when one of its topics is requested", () => {
    const sources = [synthetic("release", { activation: "task", appliesTo: { topics: ["release"] } })];

    expect(ids(selectGuideSources({ ...selection, topics: ["release"] }, sources))).toEqual(["release"]);
    expect(ids(selectGuideSources({ ...selection, topics: ["debug"] }, sources))).toEqual([]);
  });

  it("pulls in extended guides transitively and lists a dependency before its dependent", () => {
    const sources = [
      synthetic("base"),
      synthetic("mid", { extends: ["base"], appliesTo: { languages: ["go"] } }),
      synthetic("top", { extends: ["mid"], appliesTo: { technologies: ["gin"] }, priority: 0 }),
    ];

    // Only "top" is selected by the request; "mid" and "base" arrive through extends.
    expect(ids(selectGuideSources({ languages: [], technologies: ["gin"] }, sources))).toEqual(["base", "mid", "top"]);
  });

  it("drops a guide that a retained guide supersedes", () => {
    const sources = [synthetic("old"), synthetic("new", { supersedes: ["old"] })];

    expect(ids(selectGuideSources(selection, sources))).toEqual(["new"]);
  });

  it("breaks ties by priority and then by code-unit ID order", () => {
    const sources = [synthetic("b", { priority: 5 }), synthetic("a", { priority: 5 }), synthetic("z", { priority: 1 })];

    expect(ids(selectGuideSources(selection, sources))).toEqual(["z", "a", "b"]);
  });
});
