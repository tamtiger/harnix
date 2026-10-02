import type { LanguageDescriptor, Provenance } from "./types.js";

const provenance: Provenance = {
  adaptedAt: "2026-08-13",
  license: "AGPL-3.0-or-later",
  source: "Harnix stack catalog contract",
};

export const catalogLanguages: LanguageDescriptor[] = [
  {
    id: "csharp",
    label: "C#",
    detectors: [
      { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.cs" }] },
      { confidence: "confirmed", anyOf: [{ kind: "file", glob: "**/*.csproj" }] },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "typescript",
    label: "TypeScript",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "file", glob: "tsconfig.json" },
          { kind: "file", glob: "**/tsconfig.json" },
        ],
      },
      {
        confidence: "weak",
        anyOf: [
          { kind: "file", glob: "**/*.ts" },
          { kind: "file", glob: "**/*.tsx" },
        ],
      },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "javascript",
    label: "JavaScript",
    detectors: [
      {
        confidence: "weak",
        anyOf: [
          { kind: "file", glob: "**/*.js" },
          { kind: "file", glob: "**/*.jsx" },
          { kind: "file", glob: "**/*.mjs" },
          { kind: "file", glob: "**/*.cjs" },
        ],
      },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "php",
    label: "PHP",
    detectors: [
      {
        confidence: "probable",
        anyOf: [
          { kind: "file", glob: "composer.json" },
          { kind: "file", glob: "**/composer.json" },
        ],
      },
      { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.php" }] },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "python",
    label: "Python",
    detectors: [
      {
        confidence: "probable",
        anyOf: [
          { kind: "file", glob: "pyproject.toml" },
          { kind: "file", glob: "**/pyproject.toml" },
          { kind: "file", glob: "requirements.txt" },
          { kind: "file", glob: "**/requirements.txt" },
        ],
      },
      { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.py" }] },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "java",
    label: "Java",
    detectors: [{ confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.java" }] }],
    guideIds: [],
    provenance,
  },
  {
    id: "go",
    label: "Go",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "file", glob: "go.mod" },
          { kind: "file", glob: "**/go.mod" },
        ],
      },
      { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.go" }] },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "rust",
    label: "Rust",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "file", glob: "Cargo.toml" },
          { kind: "file", glob: "**/Cargo.toml" },
        ],
      },
      { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.rs" }] },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "kotlin",
    label: "Kotlin",
    detectors: [
      {
        confidence: "weak",
        anyOf: [
          { kind: "file", glob: "**/*.kt" },
          { kind: "file", glob: "**/*.kts" },
        ],
      },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "swift",
    label: "Swift",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "file", glob: "Package.swift" },
          { kind: "file", glob: "**/Package.swift" },
        ],
      },
      { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.swift" }] },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "dart",
    label: "Dart",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "file", glob: "pubspec.yaml" },
          { kind: "file", glob: "**/pubspec.yaml" },
        ],
      },
      { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.dart" }] },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "cpp",
    label: "C++",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "file", glob: "CMakeLists.txt" },
          { kind: "file", glob: "**/CMakeLists.txt" },
        ],
      },
      {
        confidence: "weak",
        anyOf: [
          { kind: "file", glob: "**/*.cpp" },
          { kind: "file", glob: "**/*.hpp" },
          { kind: "file", glob: "**/*.cc" },
          { kind: "file", glob: "**/*.cxx" },
        ],
      },
    ],
    guideIds: [],
    provenance,
  },
];
