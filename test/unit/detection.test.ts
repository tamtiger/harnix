import { mkdir, symlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { detectProject } from "../../src/utils/detection.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const createFixture = useTemporaryRepositories("harnix-detection-");

async function writeFixtureFile(root: string, path: string, content = ""): Promise<void> {
  const destination = join(root, ...path.split("/"));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content);
}

describe("detectProject", () => {
  it("detects source languages and technologies as independent facets", async () => {
    const root = await createFixture();
    await writeFixtureFile(root, "src/App/App.csproj", '<Project><ItemGroup><PackageReference Include="Volo.Abp.Core" /></ItemGroup></Project>');
    await writeFixtureFile(root, "src/App/Program.cs", "namespace Sample;");

    const result = await detectProject(root);

    expect(result.languages).toEqual(["csharp"]);
    expect(result.technologies).toEqual(["abp", "dotnet"]);
    expect(result.matches).toEqual(expect.arrayContaining([
      expect.objectContaining({ confidence: "confirmed", facet: "language", id: "csharp", kind: "language" }),
      expect.objectContaining({ confidence: "confirmed", facet: "technology", id: "abp", kind: "framework" }),
    ]));
    expect(result.matches.flatMap(({ evidence }) => evidence).every(({ path }) => !path.includes(root) && !path.includes("\\"))).toBe(true);
  });

  it("does not overclaim ABP or C# from generic .NET markers", async () => {
    const root = await createFixture();
    await writeFixtureFile(root, "global.json", "{}");
    await writeFixtureFile(root, "sample.sln", "");

    const result = await detectProject(root);

    expect(result.languages).toEqual([]);
    expect(result.technologies).toEqual(["dotnet"]);
  });

  it("does not overclaim Java or Spring from generic Maven and Gradle files", async () => {
    const root = await createFixture();
    await writeFixtureFile(root, "pom.xml", "<project />");
    await writeFixtureFile(root, "build.gradle", "plugins { id 'application' }");

    await expect(detectProject(root)).resolves.toMatchObject({ languages: [], technologies: [] });

    await writeFixtureFile(root, "src/Main.java", "class Main {}");
    await writeFixtureFile(root, "pom.xml", "<project><groupId>org.springframework.boot</groupId></project>");
    await expect(detectProject(root)).resolves.toMatchObject({ languages: ["java"], technologies: ["spring"] });
  });

  it("requires authoritative CodeIgniter evidence while retaining generic PHP", async () => {
    const root = await createFixture();
    await writeFixtureFile(root, "composer.json", JSON.stringify({ require: { php: ">=8.2" } }));
    await expect(detectProject(root)).resolves.toMatchObject({ languages: ["php"], technologies: [] });

    await writeFixtureFile(root, "composer.json", JSON.stringify({ require: { php: ">=8.2", "codeigniter4/framework": "^4" } }));
    await expect(detectProject(root)).resolves.toMatchObject({ languages: ["php"], technologies: ["codeigniter"] });
  });

  it("does not infer TypeScript from NestJS without source evidence", async () => {
    const root = await createFixture();
    await writeFixtureFile(root, "package.json", JSON.stringify({ dependencies: { "@nestjs/core": "1" } }));
    await expect(detectProject(root)).resolves.toMatchObject({ languages: [], technologies: ["nestjs"] });

    await writeFixtureFile(root, "tsconfig.json", "{}");
    await expect(detectProject(root)).resolves.toMatchObject({ languages: ["typescript"], technologies: ["nestjs"] });
  });

  it("distinguishes React web from React Native and detects source language separately", async () => {
    const native = await createFixture();
    await writeFixtureFile(native, "package.json", JSON.stringify({ dependencies: { react: "1", "react-native": "1" } }));
    await writeFixtureFile(native, "src/App.tsx", "export const App = () => null;");
    await expect(detectProject(native)).resolves.toMatchObject({ languages: ["typescript"], technologies: [] });

    const web = await createFixture();
    await writeFixtureFile(web, "package.json", JSON.stringify({ dependencies: { react: "1", "react-dom": "1" } }));
    await writeFixtureFile(web, "src/App.jsx", "export const App = () => null;");
    await expect(detectProject(web)).resolves.toMatchObject({ languages: ["javascript"], technologies: ["react-web"] });
  });

  it("detects each database technology through its dependency or content evidence", async () => {
    const npmCases: Array<[string, Record<string, string>]> = [
      ["postgresql", { pg: "1" }],
      ["mysql", { mysql2: "1" }],
      ["mongodb", { mongodb: "1" }],
      ["redis", { ioredis: "1" }],
    ];
    for (const [technology, dependencies] of npmCases) {
      const root = await createFixture();
      await writeFixtureFile(root, "package.json", JSON.stringify({ dependencies }));
      await expect(detectProject(root), technology).resolves.toMatchObject({ technologies: [technology] });
    }

    const postgresDotnet = await createFixture();
    await writeFixtureFile(postgresDotnet, "src/App/App.csproj", '<Project><ItemGroup><PackageReference Include="Npgsql" /></ItemGroup></Project>');
    await expect(detectProject(postgresDotnet)).resolves.toMatchObject({ technologies: expect.arrayContaining(["postgresql"]) });

    const sqlServerDotnet = await createFixture();
    await writeFixtureFile(sqlServerDotnet, "src/App/App.csproj", '<Project><ItemGroup><PackageReference Include="Microsoft.Data.SqlClient" /></ItemGroup></Project>');
    await expect(detectProject(sqlServerDotnet)).resolves.toMatchObject({ technologies: expect.arrayContaining(["sqlserver"]) });

    const postgresJava = await createFixture();
    await writeFixtureFile(postgresJava, "pom.xml", "<project><dependencies><dependency><artifactId>postgresql</artifactId></dependency></dependencies></project>");
    await expect(detectProject(postgresJava)).resolves.toMatchObject({ technologies: expect.arrayContaining(["postgresql"]) });
  });

  it("detects a monorepo deterministically with package profiles and verification commands", async () => {
    const root = await createFixture();
    await writeFixtureFile(root, "pnpm-lock.yaml");
    await writeFixtureFile(root, "apps/api/package.json", JSON.stringify({ dependencies: { "@nestjs/core": "1" }, scripts: { test: "vitest", build: "tsc" } }));
    await writeFixtureFile(root, "apps/api/tsconfig.json", "{}");
    await writeFixtureFile(root, "apps/web/package.json", JSON.stringify({ dependencies: { vue: "1" }, scripts: { lint: "eslint ." } }));
    await writeFixtureFile(root, "apps/web/src/main.js", "createApp({});");

    const result = await detectProject(root);

    expect(result.languages).toEqual(["javascript", "typescript"]);
    expect(result.technologies).toEqual(["nestjs", "vue"]);
    expect(result.packages).toEqual([
      { languages: ["typescript"], packageManager: "pnpm", path: "apps/api", technologies: ["nestjs"], verificationCommands: ["pnpm run build", "pnpm run test"] },
      { languages: ["javascript"], packageManager: "pnpm", path: "apps/web", technologies: ["vue"], verificationCommands: ["pnpm run lint"] },
    ]);
  });

  it("ignores generated, dependency, cache and symlink trees", async () => {
    const root = await createFixture(); const external = await createFixture();
    await writeFixtureFile(root, "node_modules/react/package.json", JSON.stringify({ dependencies: { react: "1" } }));
    await writeFixtureFile(root, "vendor/composer.json", JSON.stringify({ require: { "codeigniter4/framework": "^4" } }));
    await writeFixtureFile(root, "dist/App.csproj", "<Project />");
    await writeFixtureFile(root, "docs/example.java", "class Example {}");
    await writeFixtureFile(external, "package.json", JSON.stringify({ dependencies: { vue: "1" } }));
    await symlink(external, join(root, "linked"), process.platform === "win32" ? "junction" : "dir");

    await expect(detectProject(root)).resolves.toMatchObject({ languages: [], technologies: [], packages: [] });
  });

  it("ignores agent tooling scripts while retaining application source evidence", async () => {
    const root = await createFixture();
    await writeFixtureFile(root, "src/App/Program.cs", "namespace Sample;");
    await writeFixtureFile(root, ".agents/skills/tooling.js", "export default {};");
    await writeFixtureFile(root, ".kiro/hooks/context.py", "print('hook')");
    await writeFixtureFile(root, ".gemini/hooks/context.py", "print('hook')");
    await writeFixtureFile(root, ".trellis/scripts/tool.mjs", "export default {};");
    await writeFixtureFile(root, ".understand-anything/tmp/graph.mjs", "export default {};");

    await expect(detectProject(root)).resolves.toMatchObject({
      languages: ["csharp"], technologies: [], packages: [{ languages: ["csharp"], technologies: [], packageManager: undefined, path: ".", verificationCommands: [] }],
    });
  });

  it("does not execute package scripts while discovering verification commands", async () => {
    const root = await createFixture();
    await writeFixtureFile(root, "package-lock.json");
    await writeFixtureFile(root, "package.json", JSON.stringify({ dependencies: { vue: "1" }, scripts: { test: "node -e \"throw new Error('must not run')\"" } }));
    await writeFixtureFile(root, "src/main.js", "createApp({});");

    await expect(detectProject(root)).resolves.toMatchObject({
      languages: ["javascript"], technologies: ["vue"], packageManager: "npm",
      packages: [{ languages: ["javascript"], technologies: ["vue"], packageManager: "npm", path: ".", verificationCommands: ["npm run test"] }],
    });
  });

  it("detects new languages through their canonical manifests and source files", async () => {
    const rustRoot = await createFixture();
    await writeFixtureFile(rustRoot, "Cargo.toml", '[package]\nname = "rust-sample"');
    await expect(detectProject(rustRoot)).resolves.toMatchObject({ languages: ["rust"] });

    const swiftRoot = await createFixture();
    await writeFixtureFile(swiftRoot, "Package.swift", "// swift-tools-version: 5.9");
    await expect(detectProject(swiftRoot)).resolves.toMatchObject({ languages: ["swift"] });

    const dartRoot = await createFixture();
    await writeFixtureFile(dartRoot, "pubspec.yaml", "name: sample\nenvironment:\n  sdk: '>=3.0.0 <4.0.0'");
    await expect(detectProject(dartRoot)).resolves.toMatchObject({ languages: ["dart"] });

    const cppRoot = await createFixture();
    await writeFixtureFile(cppRoot, "CMakeLists.txt", "cmake_minimum_required(VERSION 3.20)");
    await expect(detectProject(cppRoot)).resolves.toMatchObject({ languages: ["cpp"] });

    const kotlinRoot = await createFixture();
    await writeFixtureFile(kotlinRoot, "src/main/kotlin/App.kt", "fun main() {}");
    await expect(detectProject(kotlinRoot)).resolves.toMatchObject({ languages: ["kotlin"] });
  });

  it("detects new frameworks and respects framework implications", async () => {
    const nextRoot = await createFixture();
    await writeFixtureFile(nextRoot, "package.json", JSON.stringify({ dependencies: { next: "^14.0.0", react: "^18.0.0", "react-dom": "^18.0.0" } }));
    await writeFixtureFile(nextRoot, "src/app/page.tsx", "export default function Page() { return null; }");
    const nextResult = await detectProject(nextRoot);
    expect(nextResult.technologies).toContain("nextjs");
    expect(nextResult.technologies).toContain("react-web");

    const laravelRoot = await createFixture();
    await writeFixtureFile(laravelRoot, "composer.json", JSON.stringify({ require: { "laravel/framework": "^11.0" } }));
    await writeFixtureFile(laravelRoot, "artisan", "#!/usr/bin/env php");
    await expect(detectProject(laravelRoot)).resolves.toMatchObject({ technologies: ["laravel"] });

    const expressRoot = await createFixture();
    await writeFixtureFile(expressRoot, "package.json", JSON.stringify({ dependencies: { express: "^4.19.0" } }));
    await expect(detectProject(expressRoot)).resolves.toMatchObject({ technologies: ["express"] });

    const angularRoot = await createFixture();
    await writeFixtureFile(angularRoot, "package.json", JSON.stringify({ dependencies: { "@angular/core": "^18.0.0" } }));
    await expect(detectProject(angularRoot)).resolves.toMatchObject({ technologies: ["angular"] });

    const fastapiRoot = await createFixture();
    await writeFixtureFile(fastapiRoot, "requirements.txt", "fastapi>=0.110.0\nuvicorn>=0.28.0\n");
    await expect(detectProject(fastapiRoot)).resolves.toMatchObject({ technologies: ["fastapi"] });

    const djangoRoot = await createFixture();
    await writeFixtureFile(djangoRoot, "manage.py", "#!/usr/bin/env python");
    await expect(detectProject(djangoRoot)).resolves.toMatchObject({ technologies: ["django"] });

    const ginRoot = await createFixture();
    await writeFixtureFile(ginRoot, "go.mod", "module sample\n\nrequire github.com/gin-gonic/gin v1.9.1\n");
    await expect(detectProject(ginRoot)).resolves.toMatchObject({ technologies: ["gin"] });

    const axumRoot = await createFixture();
    await writeFixtureFile(axumRoot, "Cargo.toml", '[package]\nname = "sample"\n\n[dependencies]\naxum = "0.7"\n');
    await expect(detectProject(axumRoot)).resolves.toMatchObject({ technologies: ["axum"] });
  });
});

