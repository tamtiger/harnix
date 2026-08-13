import type { Provenance, StackCatalog } from "./types.js";
import { validateStackCatalog } from "./validation.js";

export type * from "./types.js";
export { CatalogValidationError, validateStackCatalog } from "./validation.js";

const provenance: Provenance = {
  adaptedAt: "2026-08-13",
  license: "AGPL-3.0-or-later",
  source: "Harnix stack catalog contract",
};

const definition: StackCatalog = {
  guides: [],
  languages: [
    { id: "csharp", label: "C#", detectors: [{ confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.cs" }] }, { confidence: "confirmed", anyOf: [{ kind: "file", glob: "**/*.csproj" }] }], guideIds: [], provenance },
    { id: "typescript", label: "TypeScript", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "file", glob: "tsconfig.json" }, { kind: "file", glob: "**/tsconfig.json" }] }, { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.ts" }, { kind: "file", glob: "**/*.tsx" }] }], guideIds: [], provenance },
    { id: "javascript", label: "JavaScript", detectors: [{ confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.js" }, { kind: "file", glob: "**/*.jsx" }, { kind: "file", glob: "**/*.mjs" }, { kind: "file", glob: "**/*.cjs" }] }], guideIds: [], provenance },
    { id: "php", label: "PHP", detectors: [{ confidence: "probable", anyOf: [{ kind: "file", glob: "composer.json" }, { kind: "file", glob: "**/composer.json" }] }, { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.php" }] }], guideIds: [], provenance },
    { id: "python", label: "Python", detectors: [{ confidence: "probable", anyOf: [{ kind: "file", glob: "pyproject.toml" }, { kind: "file", glob: "**/pyproject.toml" }, { kind: "file", glob: "requirements.txt" }, { kind: "file", glob: "**/requirements.txt" }] }, { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.py" }] }], guideIds: [], provenance },
    { id: "java", label: "Java", detectors: [{ confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.java" }] }], guideIds: [], provenance },
    { id: "go", label: "Go", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "file", glob: "go.mod" }, { kind: "file", glob: "**/go.mod" }] }, { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.go" }] }], guideIds: [], provenance },
  ],
  technologies: [
    { id: "dotnet", kind: "runtime", label: ".NET", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "file", glob: "global.json" }, { kind: "file", glob: "**/*.csproj" }] }, { confidence: "probable", anyOf: [{ kind: "file", glob: "**/*.sln" }] }], guideIds: [], provenance },
    { id: "abp", kind: "framework", label: "ABP", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "content", glob: "**/*.csproj", contains: "Volo.Abp" }] }], implies: { technologies: ["dotnet"] }, guideIds: [], provenance },
    { id: "nestjs", kind: "framework", label: "NestJS", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "@nestjs/core" }] }], guideIds: [], provenance },
    { id: "spring", kind: "framework", label: "Spring", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "content", glob: "**/pom.xml", contains: "org.springframework" }, { kind: "content", glob: "**/build.gradle", contains: "org.springframework" }, { kind: "content", glob: "**/build.gradle.kts", contains: "org.springframework" }] }], guideIds: [], provenance },
    { id: "react-web", kind: "library", label: "React web", detectors: [{ confidence: "confirmed", allOf: [{ kind: "dependency", ecosystem: "npm", name: "react" }, { kind: "dependency", ecosystem: "npm", name: "react-dom" }], noneOf: [{ kind: "dependency", ecosystem: "npm", name: "react-native" }] }, { confidence: "confirmed", allOf: [{ kind: "dependency", ecosystem: "npm", name: "react" }], noneOf: [{ kind: "dependency", ecosystem: "npm", name: "react-native" }] }], guideIds: [], provenance },
    { id: "vue", kind: "framework", label: "Vue", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "vue" }] }], guideIds: [], provenance },
    { id: "codeigniter", kind: "framework", label: "CodeIgniter", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "composer", name: "codeigniter/framework" }, { kind: "dependency", ecosystem: "composer", name: "codeigniter4/framework" }] }], guideIds: [], provenance },
  ],
};

export const stackCatalog = validateStackCatalog(definition);
