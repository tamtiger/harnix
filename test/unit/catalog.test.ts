import { describe, expect, it } from "vitest";

import {
  stackCatalog,
  validateStackCatalog,
  type StackCatalog,
} from "../../src/catalog/catalog.js";

const provenance = { adaptedAt: "2026-08-13", license: "AGPL-3.0-or-later", source: "Harnix" } as const;

function candidate(): StackCatalog {
  return structuredClone(stackCatalog);
}

describe("stack catalog", () => {
  it("exposes the frozen language and technology taxonomy in deterministic order", () => {
    const catalog = validateStackCatalog(candidate());

    expect(catalog.languages.map(({ id }) => id)).toEqual([
      "cpp", "csharp", "dart", "go", "java", "javascript", "kotlin", "php", "python", "rust", "swift", "typescript",
    ]);
    expect(catalog.technologies.map(({ id, kind }) => ({ id, kind }))).toEqual([
      { id: "abp", kind: "framework" },
      { id: "angular", kind: "framework" },
      { id: "axum", kind: "framework" },
      { id: "codeigniter", kind: "framework" },
      { id: "django", kind: "framework" },
      { id: "dotnet", kind: "runtime" },
      { id: "express", kind: "framework" },
      { id: "fastapi", kind: "framework" },
      { id: "gin", kind: "framework" },
      { id: "laravel", kind: "framework" },
      { id: "mongodb", kind: "database" },
      { id: "mysql", kind: "database" },
      { id: "nestjs", kind: "framework" },
      { id: "nextjs", kind: "framework" },
      { id: "postgresql", kind: "database" },
      { id: "react-web", kind: "library" },
      { id: "redis", kind: "database" },
      { id: "spring", kind: "framework" },
      { id: "sqlserver", kind: "database" },
      { id: "vue", kind: "framework" },
    ]);
    expect(catalog.technologies.find(({ id }) => id === "abp")?.implies).toEqual({ technologies: ["dotnet"] });
    expect(catalog.technologies.find(({ id }) => id === "nextjs")?.implies).toEqual({ technologies: ["react-web"] });
    expect(catalog.technologies.find(({ id }) => id === "nestjs")?.implies).toBeUndefined();
  });

  it("declares five database technologies with a confirmed or probable detector and no unsupported dependency ecosystem", () => {
    const catalog = validateStackCatalog(candidate());
    const databaseIds = ["mongodb", "mysql", "postgresql", "redis", "sqlserver"] as const;

    for (const id of databaseIds) {
      const descriptor = catalog.technologies.find((technology) => technology.id === id);
      expect(descriptor?.kind, id).toBe("database");
      const hasStrongDetector = descriptor?.detectors.some((detector) => detector.confidence === "confirmed" || detector.confidence === "probable");
      expect(hasStrongDetector, `${id} must have a confirmed or probable detector`).toBe(true);
    }

    const allPredicates = catalog.technologies.flatMap((technology) => technology.detectors.flatMap((detector) => [
      ...(detector.allOf ?? []), ...(detector.anyOf ?? []), ...(detector.noneOf ?? []),
    ]));
    const unsupportedEcosystemPredicate = allPredicates.find((predicate) => predicate.kind === "dependency" && ["gradle", "maven", "nuget"].includes(predicate.ecosystem));
    expect(unsupportedEcosystemPredicate).toBeUndefined();
  });

  it("normalizes descriptor, reference and predicate order without mutating the input", () => {
    const input: StackCatalog = {
      guides: [],
      languages: [
        { id: "typescript", label: "TypeScript", detectors: [{ confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.ts" }, { kind: "file", glob: "tsconfig.json" }] }], guideIds: [], provenance },
        { id: "csharp", label: "C#", detectors: [{ confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.cs" }] }], guideIds: [], provenance },
      ],
      technologies: [],
    };

    const normalized = validateStackCatalog(input);

    expect(normalized.languages.map(({ id }) => id)).toEqual(["csharp", "typescript"]);
    expect(normalized.languages[1]?.detectors[0]?.anyOf).toEqual([
      { kind: "file", glob: "**/*.ts" },
      { kind: "file", glob: "tsconfig.json" },
    ]);
    expect(input.languages[0]?.id).toBe("typescript");
  });

  it.each([
    ["duplicate descriptor IDs", (value: StackCatalog) => { value.languages.push(structuredClone(value.languages[0]!)); }],
    ["invalid confidence", (value: StackCatalog) => { value.languages[0]!.detectors[0]!.confidence = "certain" as never; }],
    ["missing provenance", (value: StackCatalog) => { value.languages[0]!.provenance.source = ""; }],
    ["unsafe detector glob", (value: StackCatalog) => { value.languages[0]!.detectors[0]!.anyOf = [{ kind: "file", glob: "../secret" }]; }],
    ["empty positive predicates", (value: StackCatalog) => { value.languages[0]!.detectors = [{ confidence: "weak", anyOf: [] }]; }],
    ["duplicate predicates", (value: StackCatalog) => { value.languages[0]!.detectors = [{ confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.cs" }, { kind: "file", glob: "**/*.cs" }] }]; }],
    ["missing implied technology", (value: StackCatalog) => { value.technologies[0]!.implies = { technologies: ["missing" as never] }; }],
  ])("rejects %s", (_name, mutate) => {
    const value = candidate();
    mutate(value);
    expect(() => validateStackCatalog(value)).toThrow();
  });

  it("rejects missing guide references, unsafe content paths and composition cycles", () => {
    const missing = candidate();
    missing.languages[0]!.guideIds = ["missing-guide"];
    expect(() => validateStackCatalog(missing)).toThrow(/guide/i);

    const unsafe = candidate();
    unsafe.guides = [{
      activation: "always", appliesTo: {}, category: "rule", contentPath: "../outside.md",
      description: "Unsafe", id: "unsafe", priority: 0, provenance, title: "Unsafe",
    }];
    expect(() => validateStackCatalog(unsafe)).toThrow(/contentPath/i);

    const cyclic = candidate();
    cyclic.guides = [
      { activation: "always", appliesTo: {}, category: "rule", contentPath: "common/a.md", description: "A", extends: ["b"], id: "a", priority: 0, provenance, title: "A" },
      { activation: "always", appliesTo: {}, category: "rule", contentPath: "common/b.md", description: "B", extends: ["a"], id: "b", priority: 0, provenance, title: "B" },
    ];
    expect(() => validateStackCatalog(cyclic)).toThrow(/cycle/i);

    const conflicting = candidate();
    conflicting.guides = [
      { activation: "always", appliesTo: {}, category: "rule", contentPath: "common/base.md", description: "Base", id: "base", priority: 0, provenance, title: "Base" },
      { activation: "always", appliesTo: {}, category: "rule", contentPath: "common/conflict.md", description: "Conflict", extends: ["base"], id: "conflict", priority: 0, provenance, supersedes: ["base"], title: "Conflict" },
    ];
    expect(() => validateStackCatalog(conflicting)).toThrow(/both extend and supersede/i);
  });
});
