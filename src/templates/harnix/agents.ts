import type { LanguageId, TechnologyId } from "src/catalog/catalog.js";
import type { PackageConfig } from "src/core/config/config.js";
import { renderHarnixRules } from "./activation.js";

export interface AgentsProjectProfile {
  languages: readonly LanguageId[];
  technologies: readonly TechnologyId[];
  packages: readonly Pick<PackageConfig, "path">[];
  /** Harnix version stamped into the bootstrap; callers pass `packageVersion`. */
  version?: string;
}

const languageLabels: Record<LanguageId, string> = {
  csharp: "C#",
  go: "Go",
  java: "Java",
  javascript: "JavaScript",
  php: "PHP",
  python: "Python",
  typescript: "TypeScript",
  rust: "Rust",
  kotlin: "Kotlin",
  swift: "Swift",
  dart: "Dart",
  cpp: "C++",
};
const technologyLabels: Record<TechnologyId, string> = {
  abp: "ABP",
  codeigniter: "CodeIgniter",
  dotnet: ".NET",
  mongodb: "MongoDB",
  mysql: "MySQL",
  nestjs: "NestJS",
  postgresql: "PostgreSQL",
  "react-web": "React web",
  redis: "Redis",
  spring: "Spring",
  sqlserver: "SQL Server",
  vue: "Vue",
  nextjs: "Next.js",
  fastapi: "FastAPI",
  django: "Django",
  laravel: "Laravel",
  express: "Express",
  angular: "Angular",
  gin: "Gin",
  axum: "Axum",
};

/** Project bootstrap: the discovered profile first, then the same always-loaded rules as every platform surface. */
export function renderAgentsTemplate(profile: AgentsProjectProfile): string {
  const languages = profile.languages.map((id) => languageLabels[id]).join(", ") || "not specified";
  const technologies = profile.technologies.map((id) => technologyLabels[id]).join(", ") || "not specified";
  const packagePaths = profile.packages.map(({ path }) => `\`${path}\``).join(", ") || "not specified";
  const version = profile.version ?? "unknown";

  return `# Project agent instructions

Harnix version: ${version}.

## Project profile

- Languages: ${languages}.
- Technologies: ${technologies}.
- Package paths: ${packagePaths}.

This is a discovery seed, not complete repository truth: verify manifests, source and tests; do not bulk-load the repository. Guides live in \`.harnix/spec/guides/\` (read relevant files only). Stack and verify commands are in the derived \`.harnix/spec/project-facts.md\` (read-only). Custom skills live in \`.harnix/spec/skills/<name>/SKILL.md\` (\`harnix skill --all\`). Review tasks at \`.harnix/tasks/<id>/review.md\`.

## Harnix

${renderHarnixRules()}
`;
}
