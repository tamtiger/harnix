import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { detectEcosystemVerify } from "src/core/stack/verify-detection.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const createFixture = useTemporaryRepositories("harnix-verify-detect-");

async function writeFixture(root: string, path: string, content = ""): Promise<void> {
  const destination = join(root, ...path.split("/"));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content);
}

describe("detectEcosystemVerify (ac-detect: >= 8 ecosystems)", () => {
  it("detects Node.js verify commands (pnpm, npm, yarn, bun)", async () => {
    const root = await createFixture();
    await writeFixture(
      root,
      "package.json",
      JSON.stringify({
        scripts: {
          test: "vitest run",
          lint: "eslint .",
          typecheck: "tsc --noEmit",
          format: "prettier --check .",
        },
      }),
    );
    await writeFixture(root, "pnpm-lock.yaml", "");
    await writeFixture(root, "test/sample.test.ts", "");

    const result = await detectEcosystemVerify(root, ".");
    expect(result?.ecosystem).toBe("node");
    expect(result?.hasTests).toBe(true);
    expect(result?.commands.test).toBe("pnpm run test");
    expect(result?.commands.lint).toBe("pnpm run lint");
    expect(result?.commands.typecheck).toBe("pnpm run typecheck");
    expect(result?.commands.format).toBe("pnpm run format");
  });

  it("detects Python verify commands (uv, poetry, pip)", async () => {
    const uvRoot = await createFixture();
    await writeFixture(uvRoot, "pyproject.toml", "[tool.uv]\n[tool.pytest]\n[tool.ruff]\n[tool.mypy]\n");
    await writeFixture(uvRoot, "uv.lock", "");
    await writeFixture(uvRoot, "tests/test_app.py", "def test_ok(): pass\n");

    const uvResult = await detectEcosystemVerify(uvRoot, ".");
    expect(uvResult?.ecosystem).toBe("python");
    expect(uvResult?.hasTests).toBe(true);
    expect(uvResult?.commands.test).toBe("uv run pytest");
    expect(uvResult?.commands.lint).toBe("uv run ruff check");
    expect(uvResult?.commands.typecheck).toBe("uv run mypy");
    expect(uvResult?.commands.format).toBe("uv run ruff format --check");

    const poetryRoot = await createFixture();
    await writeFixture(poetryRoot, "pyproject.toml", "[tool.poetry]\n[tool.pytest]\n");
    await writeFixture(poetryRoot, "poetry.lock", "");
    await writeFixture(poetryRoot, "tests/test_main.py", "");

    const poetryResult = await detectEcosystemVerify(poetryRoot, ".");
    expect(poetryResult?.ecosystem).toBe("python");
    expect(poetryResult?.commands.test).toBe("poetry run pytest");
  });

  it("detects Rust verify commands (cargo)", async () => {
    const root = await createFixture();
    await writeFixture(root, "Cargo.toml", '[package]\nname = "demo"\nversion = "0.1.0"\n');
    await writeFixture(root, "src/lib.rs", "#[test] fn it_works() {}\n");

    const result = await detectEcosystemVerify(root, ".");
    expect(result?.ecosystem).toBe("rust");
    expect(result?.hasTests).toBe(true);
    expect(result?.commands.test).toBe("cargo test");
    expect(result?.commands.lint).toBe("cargo clippy");
    expect(result?.commands.format).toBe("cargo fmt --check");
  });

  it("detects Go verify commands", async () => {
    const root = await createFixture();
    await writeFixture(root, "go.mod", "module example.com/demo\ngo 1.22\n");
    await writeFixture(root, "main_test.go", "package main\n");
    await writeFixture(root, ".golangci.yml", "");

    const result = await detectEcosystemVerify(root, ".");
    expect(result?.ecosystem).toBe("go");
    expect(result?.hasTests).toBe(true);
    expect(result?.commands.test).toBe("go test ./...");
    expect(result?.commands.lint).toBe("golangci-lint run");
  });

  it("detects JVM verify commands (Gradle and Maven)", async () => {
    const gradleRoot = await createFixture();
    await writeFixture(gradleRoot, "build.gradle.kts", 'plugins { id("java") }\n');
    await writeFixture(gradleRoot, "gradlew", "#!/bin/sh\n");
    await writeFixture(gradleRoot, "src/test/java/DemoTest.java", "class DemoTest {}\n");

    const gradleResult = await detectEcosystemVerify(gradleRoot, ".");
    expect(gradleResult?.ecosystem).toBe("gradle");
    expect(gradleResult?.hasTests).toBe(true);
    expect(gradleResult?.commands.test).toBe("./gradlew test");
    expect(gradleResult?.commands.lint).toBe("./gradlew check");

    const mavenRoot = await createFixture();
    await writeFixture(mavenRoot, "pom.xml", "<project />\n");
    await writeFixture(mavenRoot, "mvnw", "#!/bin/sh\n");
    await writeFixture(mavenRoot, "src/test/java/AppTest.java", "class AppTest {}\n");

    const mavenResult = await detectEcosystemVerify(mavenRoot, ".");
    expect(mavenResult?.ecosystem).toBe("maven");
    expect(mavenResult?.hasTests).toBe(true);
    expect(mavenResult?.commands.test).toBe("./mvnw test");
    expect(mavenResult?.commands.lint).toBe("./mvnw verify");
  });

  it("detects .NET verify commands", async () => {
    const root = await createFixture();
    await writeFixture(root, "Demo.csproj", '<Project Sdk="Microsoft.NET.Sdk" />\n');
    await writeFixture(root, "UnitTest1.cs", "public class UnitTest1 {}\n");

    const result = await detectEcosystemVerify(root, ".");
    expect(result?.ecosystem).toBe("dotnet");
    expect(result?.hasTests).toBe(true);
    expect(result?.commands.test).toBe("dotnet test");
    expect(result?.commands.format).toBe("dotnet format --verify-no-changes");
  });

  it("detects PHP Composer verify commands", async () => {
    const root = await createFixture();
    await writeFixture(
      root,
      "composer.json",
      JSON.stringify({
        scripts: {
          test: "phpunit",
        },
      }),
    );
    await writeFixture(root, "tests/AppTest.php", "<?php class AppTest {}\n");

    const result = await detectEcosystemVerify(root, ".");
    expect(result?.ecosystem).toBe("composer");
    expect(result?.hasTests).toBe(true);
    expect(result?.commands.test).toBe("composer test");
  });

  it("detects Swift verify commands", async () => {
    const root = await createFixture();
    await writeFixture(root, "Package.swift", "// swift-tools-version: 5.9\n");
    await writeFixture(root, ".swiftlint.yml", "");
    await writeFixture(root, "Tests/AppTests/AppTests.swift", "");

    const result = await detectEcosystemVerify(root, ".");
    expect(result?.ecosystem).toBe("swift");
    expect(result?.hasTests).toBe(true);
    expect(result?.commands.test).toBe("swift test");
    expect(result?.commands.lint).toBe("swiftlint");
  });

  it("detects Flutter / Dart verify commands", async () => {
    const root = await createFixture();
    await writeFixture(root, "pubspec.yaml", "name: app\ndependencies:\n  flutter:\n    sdk: flutter\n");
    await writeFixture(root, "test/widget_test.dart", "");

    const result = await detectEcosystemVerify(root, ".");
    expect(result?.ecosystem).toBe("flutter");
    expect(result?.hasTests).toBe(true);
    expect(result?.commands.test).toBe("flutter test");
    expect(result?.commands.lint).toBe("flutter analyze");
  });

  it("detects pure Dart verify commands when pubspec lacks flutter", async () => {
    const root = await createFixture();
    await writeFixture(root, "pubspec.yaml", "name: dart_app\n");
    await writeFixture(root, "test/sample_test.dart", "");

    const result = await detectEcosystemVerify(root, ".");
    expect(result?.ecosystem).toBe("dart");
    expect(result?.commands.test).toBe("dart test");
    expect(result?.commands.lint).toBe("dart analyze");
  });

  it("detects yarn and bun package managers in Node projects", async () => {
    const yarnRoot = await createFixture();
    await writeFixture(yarnRoot, "package.json", JSON.stringify({ scripts: { "format:check": "prettier" } }));
    await writeFixture(yarnRoot, "yarn.lock", "");
    const yarnRes = await detectEcosystemVerify(yarnRoot, ".");
    expect(yarnRes?.commands.format).toBe("yarn run format:check");

    const bunRoot = await createFixture();
    await writeFixture(bunRoot, "package.json", JSON.stringify({ scripts: { test: "bun test" } }));
    await writeFixture(bunRoot, "bun.lockb", "");
    const bunRes = await detectEcosystemVerify(bunRoot, ".");
    expect(bunRes?.commands.test).toBe("bun run test");
  });

  it("detects composer with phpunit.xml when scripts.test is missing", async () => {
    const root = await createFixture();
    await writeFixture(root, "composer.json", "{}");
    await writeFixture(root, "phpunit.xml", "<phpunit />");
    const res = await detectEcosystemVerify(root, ".");
    expect(res?.commands.test).toBe("vendor/bin/phpunit");
  });

  it("returns undefined for non-existent directory or unknown stack", async () => {
    const root = await createFixture();
    expect(await detectEcosystemVerify(root, "non-existent-dir")).toBeUndefined();
    expect(await detectEcosystemVerify(root, ".")).toBeUndefined();
  });

  it("detects pip with requirements.txt or Pipfile", async () => {
    const root = await createFixture();
    await writeFixture(root, "requirements.txt", "pytest\n");
    await writeFixture(root, "tests/sample_test.py", "");
    const res = await detectEcosystemVerify(root, ".");
    expect(res?.ecosystem).toBe("python");
    expect(res?.commands.test).toBe("pytest");
  });
});
