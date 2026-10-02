import type { Provenance, TechnologyDescriptor } from "./types.js";

const provenance: Provenance = {
  adaptedAt: "2026-08-13",
  license: "AGPL-3.0-or-later",
  source: "Harnix stack catalog contract",
};

export const catalogTechnologies: TechnologyDescriptor[] = [
  {
    id: "dotnet",
    kind: "runtime",
    label: ".NET",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "file", glob: "global.json" },
          { kind: "file", glob: "**/*.csproj" },
        ],
      },
      { confidence: "probable", anyOf: [{ kind: "file", glob: "**/*.sln" }] },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "abp",
    kind: "framework",
    label: "ABP",
    detectors: [{ confidence: "confirmed", anyOf: [{ kind: "content", glob: "**/*.csproj", contains: "Volo.Abp" }] }],
    implies: { technologies: ["dotnet"] },
    guideIds: [],
    provenance,
  },
  {
    id: "nestjs",
    kind: "framework",
    label: "NestJS",
    detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "@nestjs/core" }] }],
    guideIds: [],
    provenance,
  },
  {
    id: "spring",
    kind: "framework",
    label: "Spring",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "content", glob: "**/pom.xml", contains: "org.springframework" },
          { kind: "content", glob: "**/build.gradle", contains: "org.springframework" },
          { kind: "content", glob: "**/build.gradle.kts", contains: "org.springframework" },
        ],
      },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "react-web",
    kind: "library",
    label: "React web",
    detectors: [
      {
        confidence: "confirmed",
        allOf: [
          { kind: "dependency", ecosystem: "npm", name: "react" },
          { kind: "dependency", ecosystem: "npm", name: "react-dom" },
        ],
        noneOf: [{ kind: "dependency", ecosystem: "npm", name: "react-native" }],
      },
      {
        confidence: "confirmed",
        allOf: [{ kind: "dependency", ecosystem: "npm", name: "react" }],
        noneOf: [{ kind: "dependency", ecosystem: "npm", name: "react-native" }],
      },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "vue",
    kind: "framework",
    label: "Vue",
    detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "vue" }] }],
    guideIds: [],
    provenance,
  },
  {
    id: "codeigniter",
    kind: "framework",
    label: "CodeIgniter",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "dependency", ecosystem: "composer", name: "codeigniter/framework" },
          { kind: "dependency", ecosystem: "composer", name: "codeigniter4/framework" },
        ],
      },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "nextjs",
    kind: "framework",
    label: "Next.js",
    detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "next" }] }],
    implies: { technologies: ["react-web"] },
    guideIds: [],
    provenance,
  },
  {
    id: "fastapi",
    kind: "framework",
    label: "FastAPI",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "content", glob: "**/requirements.txt", contains: "fastapi" },
          { kind: "content", glob: "**/pyproject.toml", contains: "fastapi" },
        ],
      },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "django",
    kind: "framework",
    label: "Django",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "content", glob: "**/requirements.txt", contains: "django" },
          { kind: "content", glob: "**/pyproject.toml", contains: "django" },
          { kind: "file", glob: "manage.py" },
          { kind: "file", glob: "**/manage.py" },
        ],
      },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "laravel",
    kind: "framework",
    label: "Laravel",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "dependency", ecosystem: "composer", name: "laravel/framework" },
          { kind: "file", glob: "artisan" },
          { kind: "file", glob: "**/artisan" },
        ],
      },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "express",
    kind: "framework",
    label: "Express",
    detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "express" }] }],
    guideIds: [],
    provenance,
  },
  {
    id: "angular",
    kind: "framework",
    label: "Angular",
    detectors: [{ confidence: "confirmed", anyOf: [{ kind: "dependency", ecosystem: "npm", name: "@angular/core" }] }],
    guideIds: [],
    provenance,
  },
  {
    id: "gin",
    kind: "framework",
    label: "Gin",
    detectors: [
      { confidence: "confirmed", anyOf: [{ kind: "content", glob: "**/go.mod", contains: "gin-gonic/gin" }] },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "axum",
    kind: "framework",
    label: "Axum",
    detectors: [{ confidence: "confirmed", anyOf: [{ kind: "content", glob: "**/Cargo.toml", contains: "axum" }] }],
    guideIds: [],
    provenance,
  },
  // Database detectors use `dependency` (npm/composer) and `content` glob only. `src/core/stack/detection.ts`
  // never collects nuget/maven/gradle dependency facts, so a .NET or Java driver is detected by
  // matching its package name inside `*.csproj`/`pom.xml`/`build.gradle*` content instead.
  {
    id: "postgresql",
    kind: "database",
    label: "PostgreSQL",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "dependency", ecosystem: "npm", name: "pg" },
          { kind: "content", glob: "**/*.csproj", contains: "Npgsql" },
          { kind: "content", glob: "**/pom.xml", contains: "postgresql" },
        ],
      },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "mysql",
    kind: "database",
    label: "MySQL",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "dependency", ecosystem: "npm", name: "mysql2" },
          { kind: "content", glob: "**/*.csproj", contains: "MySql.Data" },
          { kind: "content", glob: "**/pom.xml", contains: "mysql-connector" },
        ],
      },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "sqlserver",
    kind: "database",
    label: "SQL Server",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "dependency", ecosystem: "npm", name: "mssql" },
          { kind: "content", glob: "**/*.csproj", contains: "Microsoft.Data.SqlClient" },
        ],
      },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "mongodb",
    kind: "database",
    label: "MongoDB",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "dependency", ecosystem: "npm", name: "mongodb" },
          { kind: "dependency", ecosystem: "npm", name: "mongoose" },
          { kind: "dependency", ecosystem: "composer", name: "mongodb/mongodb" },
          { kind: "content", glob: "**/pom.xml", contains: "spring-boot-starter-data-mongodb" },
        ],
      },
    ],
    guideIds: [],
    provenance,
  },
  {
    id: "redis",
    kind: "database",
    label: "Redis",
    detectors: [
      {
        confidence: "confirmed",
        anyOf: [
          { kind: "dependency", ecosystem: "npm", name: "ioredis" },
          { kind: "dependency", ecosystem: "npm", name: "redis" },
          { kind: "content", glob: "**/*.csproj", contains: "StackExchange.Redis" },
          { kind: "content", glob: "**/pom.xml", contains: "spring-boot-starter-data-redis" },
        ],
      },
    ],
    guideIds: [],
    provenance,
  },
];
