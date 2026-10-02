import type { GuideDescriptor } from "src/catalog/catalog.js";

import commonEngineering from "./common.md";
import csharpEngineering from "./languages/csharp.md";
import goEngineering from "./languages/go.md";
import javaEngineering from "./languages/java.md";
import javascriptEngineering from "./languages/javascript.md";
import phpEngineering from "./languages/php.md";
import pythonEngineering from "./languages/python.md";
import typescriptEngineering from "./languages/typescript.md";
import rustEngineering from "./languages/rust.md";
import kotlinEngineering from "./languages/kotlin.md";
import swiftEngineering from "./languages/swift.md";
import dartEngineering from "./languages/dart.md";
import cppEngineering from "./languages/cpp.md";
import abpEngineering from "./technologies/framework/abp.md";
import codeigniterEngineering from "./technologies/framework/codeigniter.md";
import nestjsEngineering from "./technologies/framework/nestjs.md";
import springEngineering from "./technologies/framework/spring.md";
import vueEngineering from "./technologies/framework/vue.md";
import nextjsEngineering from "./technologies/framework/nextjs.md";
import fastapiEngineering from "./technologies/framework/fastapi.md";
import djangoEngineering from "./technologies/framework/django.md";
import laravelEngineering from "./technologies/framework/laravel.md";
import expressEngineering from "./technologies/framework/express.md";
import angularEngineering from "./technologies/framework/angular.md";
import ginEngineering from "./technologies/framework/gin.md";
import axumEngineering from "./technologies/framework/axum.md";
import reactWebEngineering from "./technologies/library/react-web.md";
import dotnetEngineering from "./technologies/runtime/dotnet.md";
import databaseRelationalEngineering from "./technologies/database/relational.md";
import postgresqlEngineering from "./technologies/database/postgresql.md";
import mysqlEngineering from "./technologies/database/mysql.md";
import sqlserverEngineering from "./technologies/database/sqlserver.md";
import mongodbEngineering from "./technologies/database/mongodb.md";
import redisEngineering from "./technologies/database/redis.md";

export interface GuideSource {
  descriptor: GuideDescriptor;
  content: string;
}

const provenance = {
  adaptedAt: "2026-08-13",
  license: "MIT-compatible adaptation metadata; see NOTICE",
  source: "Harnix-authored adaptations informed by ECC/Superpowers research",
} as const;

function guide(
  id: string,
  title: string,
  contentPath: string,
  content: string,
  appliesTo: GuideDescriptor["appliesTo"],
  priority: number,
  activation: GuideDescriptor["activation"] = "always",
  extends_?: GuideDescriptor["extends"],
): GuideSource {
  return {
    descriptor: {
      activation,
      appliesTo,
      category: "guide",
      contentPath,
      description: `${title} guidance`,
      extends: extends_,
      id,
      priority,
      provenance,
      title,
    },
    content,
  };
}

export const guideSources: GuideSource[] = [
  guide("common-engineering", "Common engineering", "common.md", commonEngineering, {}, 0),
  guide("language-csharp", "C#", "languages/csharp.md", csharpEngineering, { languages: ["csharp"] }, 10),
  guide("language-go", "Go", "languages/go.md", goEngineering, { languages: ["go"] }, 10),
  guide("language-java", "Java", "languages/java.md", javaEngineering, { languages: ["java"] }, 10),
  guide(
    "language-javascript",
    "JavaScript",
    "languages/javascript.md",
    javascriptEngineering,
    { languages: ["javascript"] },
    10,
  ),
  guide("language-php", "PHP", "languages/php.md", phpEngineering, { languages: ["php"] }, 10),
  guide("language-python", "Python", "languages/python.md", pythonEngineering, { languages: ["python"] }, 10),
  guide(
    "language-typescript",
    "TypeScript",
    "languages/typescript.md",
    typescriptEngineering,
    { languages: ["typescript"] },
    10,
  ),
  guide("language-rust", "Rust", "languages/rust.md", rustEngineering, { languages: ["rust"] }, 10),
  guide("language-kotlin", "Kotlin", "languages/kotlin.md", kotlinEngineering, { languages: ["kotlin"] }, 10),
  guide("language-swift", "Swift", "languages/swift.md", swiftEngineering, { languages: ["swift"] }, 10),
  guide("language-dart", "Dart", "languages/dart.md", dartEngineering, { languages: ["dart"] }, 10),
  guide("language-cpp", "C++", "languages/cpp.md", cppEngineering, { languages: ["cpp"] }, 10),
  guide("technology-abp", "ABP", "technologies/framework/abp.md", abpEngineering, { technologies: ["abp"] }, 20),
  guide(
    "technology-codeigniter",
    "CodeIgniter",
    "technologies/framework/codeigniter.md",
    codeigniterEngineering,
    { technologies: ["codeigniter"] },
    20,
  ),
  guide(
    "technology-nestjs",
    "NestJS",
    "technologies/framework/nestjs.md",
    nestjsEngineering,
    { technologies: ["nestjs"] },
    20,
  ),
  guide(
    "technology-spring",
    "Spring",
    "technologies/framework/spring.md",
    springEngineering,
    { technologies: ["spring"] },
    20,
  ),
  guide("technology-vue", "Vue", "technologies/framework/vue.md", vueEngineering, { technologies: ["vue"] }, 20),
  guide(
    "technology-nextjs",
    "Next.js",
    "technologies/framework/nextjs.md",
    nextjsEngineering,
    { technologies: ["nextjs"] },
    20,
  ),
  guide(
    "technology-fastapi",
    "FastAPI",
    "technologies/framework/fastapi.md",
    fastapiEngineering,
    { technologies: ["fastapi"] },
    20,
  ),
  guide(
    "technology-django",
    "Django",
    "technologies/framework/django.md",
    djangoEngineering,
    { technologies: ["django"] },
    20,
  ),
  guide(
    "technology-laravel",
    "Laravel",
    "technologies/framework/laravel.md",
    laravelEngineering,
    { technologies: ["laravel"] },
    20,
  ),
  guide(
    "technology-express",
    "Express",
    "technologies/framework/express.md",
    expressEngineering,
    { technologies: ["express"] },
    20,
  ),
  guide(
    "technology-angular",
    "Angular",
    "technologies/framework/angular.md",
    angularEngineering,
    { technologies: ["angular"] },
    20,
  ),
  guide("technology-gin", "Gin", "technologies/framework/gin.md", ginEngineering, { technologies: ["gin"] }, 20),
  guide("technology-axum", "Axum", "technologies/framework/axum.md", axumEngineering, { technologies: ["axum"] }, 20),
  guide(
    "technology-react-web",
    "React (web)",
    "technologies/library/react-web.md",
    reactWebEngineering,
    { technologies: ["react-web"] },
    20,
  ),
  guide(
    "technology-dotnet",
    ".NET",
    "technologies/runtime/dotnet.md",
    dotnetEngineering,
    { technologies: ["dotnet"] },
    20,
  ),
  guide(
    "technology-database-relational",
    "Relational databases",
    "technologies/database/relational.md",
    databaseRelationalEngineering,
    { technologies: ["postgresql", "mysql", "sqlserver"] },
    15,
  ),
  guide(
    "technology-postgresql",
    "PostgreSQL",
    "technologies/database/postgresql.md",
    postgresqlEngineering,
    { technologies: ["postgresql"] },
    20,
    "always",
    ["technology-database-relational"],
  ),
  guide(
    "technology-mysql",
    "MySQL",
    "technologies/database/mysql.md",
    mysqlEngineering,
    { technologies: ["mysql"] },
    20,
    "always",
    ["technology-database-relational"],
  ),
  guide(
    "technology-sqlserver",
    "SQL Server",
    "technologies/database/sqlserver.md",
    sqlserverEngineering,
    { technologies: ["sqlserver"] },
    20,
    "always",
    ["technology-database-relational"],
  ),
  guide(
    "technology-mongodb",
    "MongoDB",
    "technologies/database/mongodb.md",
    mongodbEngineering,
    { technologies: ["mongodb"] },
    20,
  ),
  guide(
    "technology-redis",
    "Redis",
    "technologies/database/redis.md",
    redisEngineering,
    { technologies: ["redis"] },
    20,
  ),
];
