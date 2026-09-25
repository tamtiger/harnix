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
    { id: "rust", label: "Rust", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "file", glob: "Cargo.toml" }, { kind: "file", glob: "**/Cargo.toml" }] }, { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.rs" }] }], guideIds: [], provenance },
    { id: "kotlin", label: "Kotlin", detectors: [{ confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.kt" }, { kind: "file", glob: "**/*.kts" }] }], guideIds: [], provenance },
    { id: "swift", label: "Swift", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "file", glob: "Package.swift" }, { kind: "file", glob: "**/Package.swift" }] }, { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.swift" }] }], guideIds: [], provenance },
    { id: "dart", label: "Dart", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "file", glob: "pubspec.yaml" }, { kind: "file", glob: "**/pubspec.yaml" }] }, { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.dart" }] }], guideIds: [], provenance },
    { id: "cpp", label: "C++", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "file", glob: "CMakeLists.txt" }, { kind: "file", glob: "**/CMakeLists.txt" }] }, { confidence: "weak", anyOf: [{ kind: "file", glob: "**/*.cpp" }, { kind: "file", glob: "**/*.hpp" }, { kind: "file", glob: "**/*.cc" }, { kind: "file", glob: "**/*.cxx" }] }], guideIds: [], provenance },
  ],
  technologies: [
    { id: "dotnet", kind: "runtime", label: ".NET", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "file", glob: "global.json" }, { kind: "file", glob: "**/*.csproj" }] }, { confidence: "probable", anyOf: [{ kind: "file", glob: "**/*.sln" }] }], guideIds: [], provenance },
    { id: "abp", kind: "framework", label: "ABP", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "content", glob: "**/*.csproj", contains: "Volo.Abp" }] }], implies: { technologies: ["dotnet"] }, guideIds: [], provenance },
    { id: "nestjs", kind: "framework", label: "NestJS", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "@nestjs/core" }] }], guideIds: [], provenance },
    { id: "spring", kind: "framework", label: "Spring", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "content", glob: "**/pom.xml", contains: "org.springframework" }, { kind: "content", glob: "**/build.gradle", contains: "org.springframework" }, { kind: "content", glob: "**/build.gradle.kts", contains: "org.springframework" }] }], guideIds: [], provenance },
    { id: "react-web", kind: "library", label: "React web", detectors: [{ confidence: "confirmed", allOf: [{ kind: "dependency", ecosystem: "npm", name: "react" }, { kind: "dependency", ecosystem: "npm", name: "react-dom" }], noneOf: [{ kind: "dependency", ecosystem: "npm", name: "react-native" }] }, { confidence: "confirmed", allOf: [{ kind: "dependency", ecosystem: "npm", name: "react" }], noneOf: [{ kind: "dependency", ecosystem: "npm", name: "react-native" }] }], guideIds: [], provenance },
    { id: "vue", kind: "framework", label: "Vue", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "vue" }] }], guideIds: [], provenance },
    { id: "codeigniter", kind: "framework", label: "CodeIgniter", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "composer", name: "codeigniter/framework" }, { kind: "dependency", ecosystem: "composer", name: "codeigniter4/framework" }] }], guideIds: [], provenance },
    { id: "nextjs", kind: "framework", label: "Next.js", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "next" }] }], implies: { technologies: ["react-web"] }, guideIds: [], provenance },
    { id: "fastapi", kind: "framework", label: "FastAPI", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "content", glob: "**/requirements.txt", contains: "fastapi" }, { kind: "content", glob: "**/pyproject.toml", contains: "fastapi" }] }], guideIds: [], provenance },
    { id: "django", kind: "framework", label: "Django", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "content", glob: "**/requirements.txt", contains: "django" }, { kind: "content", glob: "**/pyproject.toml", contains: "django" }, { kind: "file", glob: "manage.py" }, { kind: "file", glob: "**/manage.py" }] }], guideIds: [], provenance },
    { id: "laravel", kind: "framework", label: "Laravel", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "composer", name: "laravel/framework" }, { kind: "file", glob: "artisan" }, { kind: "file", glob: "**/artisan" }] }], guideIds: [], provenance },
    { id: "express", kind: "framework", label: "Express", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "express" }] }], guideIds: [], provenance },
    { id: "angular", kind: "framework", label: "Angular", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "@angular/core" }] }], guideIds: [], provenance },
    { id: "gin", kind: "framework", label: "Gin", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "content", glob: "**/go.mod", contains: "gin-gonic/gin" }] }], guideIds: [], provenance },
    { id: "axum", kind: "framework", label: "Axum", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "content", glob: "**/Cargo.toml", contains: "axum" }] }], guideIds: [], provenance },
    // Database detectors use `dependency` (npm/composer) and `content` glob only. `src/utils/detection.ts`
    // never collects nuget/maven/gradle dependency facts, so a .NET or Java driver is detected by
    // matching its package name inside `*.csproj`/`pom.xml`/`build.gradle*` content instead.
    { id: "postgresql", kind: "database", label: "PostgreSQL", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "pg" }, { kind: "content", glob: "**/*.csproj", contains: "Npgsql" }, { kind: "content", glob: "**/pom.xml", contains: "postgresql" }] }], guideIds: [], provenance },
    { id: "mysql", kind: "database", label: "MySQL", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "mysql2" }, { kind: "content", glob: "**/*.csproj", contains: "MySql.Data" }, { kind: "content", glob: "**/pom.xml", contains: "mysql-connector" }] }], guideIds: [], provenance },
    { id: "sqlserver", kind: "database", label: "SQL Server", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "mssql" }, { kind: "content", glob: "**/*.csproj", contains: "Microsoft.Data.SqlClient" }] }], guideIds: [], provenance },
    { id: "mongodb", kind: "database", label: "MongoDB", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "mongodb" }, { kind: "dependency", ecosystem: "npm", name: "mongoose" }, { kind: "dependency", ecosystem: "composer", name: "mongodb/mongodb" }, { kind: "content", glob: "**/pom.xml", contains: "spring-boot-starter-data-mongodb" }] }], guideIds: [], provenance },
    { id: "redis", kind: "database", label: "Redis", detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "ioredis" }, { kind: "dependency", ecosystem: "npm", name: "redis" }, { kind: "content", glob: "**/*.csproj", contains: "StackExchange.Redis" }, { kind: "content", glob: "**/pom.xml", contains: "spring-boot-starter-data-redis" }] }], guideIds: [], provenance },
  ],
};

export const stackCatalog = validateStackCatalog(definition);
