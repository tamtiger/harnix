import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { VerifyCommandConfig } from "src/core/config/config-schema.js";

export interface EcosystemVerifyResult {
  ecosystem: string;
  hasTests: boolean;
  commands: VerifyCommandConfig;
}

export async function detectEcosystemVerify(
  projectRoot: string,
  relativePackagePath = ".",
): Promise<EcosystemVerifyResult | undefined> {
  const dir = resolve(projectRoot, relativePackagePath);
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return undefined;
  }
  const fileSet = new Set(entries);

  // 1. Node.js
  if (fileSet.has("package.json")) {
    return detectNodeVerify(projectRoot, dir, fileSet);
  }
  // 2. Python
  if (
    fileSet.has("pyproject.toml") ||
    fileSet.has("Pipfile") ||
    fileSet.has("requirements.txt") ||
    fileSet.has("uv.lock")
  ) {
    return detectPythonVerify(dir, fileSet);
  }
  // 3. Rust
  if (fileSet.has("Cargo.toml")) {
    return detectRustVerify();
  }
  // 4. Go
  if (fileSet.has("go.mod")) {
    return detectGoVerify(fileSet);
  }
  // 5. JVM - Gradle
  if (
    fileSet.has("build.gradle") ||
    fileSet.has("build.gradle.kts") ||
    fileSet.has("settings.gradle") ||
    fileSet.has("settings.gradle.kts")
  ) {
    return detectGradleVerify(fileSet);
  }
  // 5. JVM - Maven
  if (fileSet.has("pom.xml")) {
    return detectMavenVerify(fileSet);
  }
  // 6. .NET
  if (entries.some((f) => f.endsWith(".csproj") || f.endsWith(".fsproj") || f.endsWith(".sln"))) {
    return detectDotnetVerify();
  }
  // 7. PHP Composer
  if (fileSet.has("composer.json")) {
    return detectComposerVerify(dir, fileSet);
  }
  // 8. Swift
  if (fileSet.has("Package.swift")) {
    return detectSwiftVerify(fileSet);
  }
  // 9. Flutter / Dart
  if (fileSet.has("pubspec.yaml")) {
    return detectFlutterVerify(dir, fileSet);
  }

  return undefined;
}

async function detectNodeVerify(
  projectRoot: string,
  dir: string,
  fileSet: Set<string>,
): Promise<EcosystemVerifyResult> {
  const pkgContent = await readSafeText(join(dir, "package.json"));
  let scripts: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(pkgContent ?? "{}") as { scripts?: Record<string, unknown> };
    scripts = parsed.scripts ?? {};
  } catch {
    /* ignore invalid package.json syntax */
  }

  let pm = "npm";
  const rootEntries = new Set(await readdir(projectRoot).catch(() => []));
  if (fileSet.has("pnpm-lock.yaml") || rootEntries.has("pnpm-lock.yaml")) pm = "pnpm";
  else if (fileSet.has("yarn.lock") || rootEntries.has("yarn.lock")) pm = "yarn";
  else if (
    fileSet.has("bun.lockb") ||
    fileSet.has("bun.lock") ||
    rootEntries.has("bun.lock") ||
    rootEntries.has("bun.lockb")
  )
    pm = "bun";

  const commands: VerifyCommandConfig = {};
  if (typeof scripts.test === "string") commands.test = `${pm} run test`;
  if (typeof scripts.lint === "string") commands.lint = `${pm} run lint`;
  if (typeof scripts.typecheck === "string") commands.typecheck = `${pm} run typecheck`;
  if (typeof scripts.format === "string") commands.format = `${pm} run format`;
  else if (typeof scripts["format:check"] === "string") commands.format = `${pm} run format:check`;

  const hasTests = typeof scripts.test === "string" || fileSet.has("test") || fileSet.has("tests");
  return { ecosystem: "node", hasTests, commands };
}

async function detectPythonVerify(dir: string, fileSet: Set<string>): Promise<EcosystemVerifyResult> {
  const pyproject = (await readSafeText(join(dir, "pyproject.toml"))) ?? "";
  let runner = "";
  if (fileSet.has("uv.lock") || pyproject.includes("[tool.uv]")) runner = "uv run ";
  else if (fileSet.has("poetry.lock") || pyproject.includes("[tool.poetry]")) runner = "poetry run ";

  const hasRuff = fileSet.has("ruff.toml") || fileSet.has(".ruff.toml") || pyproject.includes("[tool.ruff]");
  const hasMypy = fileSet.has("mypy.ini") || pyproject.includes("[tool.mypy]");
  const commands: VerifyCommandConfig = {};

  const hasTests =
    fileSet.has("tests") || fileSet.has("test") || pyproject.includes("[tool.pytest]") || fileSet.has("pytest.ini");
  if (hasTests) commands.test = `${runner}pytest`;
  if (hasRuff) {
    commands.lint = `${runner}ruff check`;
    commands.format = `${runner}ruff format --check`;
  }
  if (hasMypy) commands.typecheck = `${runner}mypy`;

  return { ecosystem: "python", hasTests, commands };
}

function detectRustVerify(): EcosystemVerifyResult {
  return {
    ecosystem: "rust",
    hasTests: true,
    commands: {
      test: "cargo test",
      lint: "cargo clippy",
      format: "cargo fmt --check",
    },
  };
}

function detectGoVerify(fileSet: Set<string>): EcosystemVerifyResult {
  const commands: VerifyCommandConfig = {
    test: "go test ./...",
    lint: fileSet.has(".golangci.yml") || fileSet.has(".golangci.yaml") ? "golangci-lint run" : "go vet ./...",
  };
  return { ecosystem: "go", hasTests: true, commands };
}

function detectGradleVerify(fileSet: Set<string>): EcosystemVerifyResult {
  const runner = fileSet.has("gradlew") ? "./gradlew" : "gradle";
  return {
    ecosystem: "gradle",
    hasTests: fileSet.has("src") || fileSet.has("test"),
    commands: {
      test: `${runner} test`,
      lint: `${runner} check`,
    },
  };
}

function detectMavenVerify(fileSet: Set<string>): EcosystemVerifyResult {
  const runner = fileSet.has("mvnw") ? "./mvnw" : "mvn";
  return {
    ecosystem: "maven",
    hasTests: fileSet.has("src") || fileSet.has("test"),
    commands: {
      test: `${runner} test`,
      lint: `${runner} verify`,
    },
  };
}

function detectDotnetVerify(): EcosystemVerifyResult {
  return {
    ecosystem: "dotnet",
    hasTests: true,
    commands: {
      test: "dotnet test",
      format: "dotnet format --verify-no-changes",
    },
  };
}

async function detectComposerVerify(dir: string, fileSet: Set<string>): Promise<EcosystemVerifyResult> {
  const composer = await readSafeText(join(dir, "composer.json"));
  let scripts: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(composer ?? "{}") as { scripts?: Record<string, unknown> };
    scripts = parsed.scripts ?? {};
  } catch {
    /* ignore invalid composer.json syntax */
  }

  const commands: VerifyCommandConfig = {};
  if (typeof scripts.test === "string") commands.test = "composer test";
  else if (fileSet.has("phpunit.xml") || fileSet.has("phpunit.xml.dist")) commands.test = "vendor/bin/phpunit";

  return {
    ecosystem: "composer",
    hasTests: typeof commands.test === "string" || fileSet.has("tests"),
    commands,
  };
}

function detectSwiftVerify(fileSet: Set<string>): EcosystemVerifyResult {
  const commands: VerifyCommandConfig = { test: "swift test" };
  if (fileSet.has(".swiftlint.yml")) commands.lint = "swiftlint";
  return { ecosystem: "swift", hasTests: fileSet.has("Tests"), commands };
}

async function detectFlutterVerify(dir: string, fileSet: Set<string>): Promise<EcosystemVerifyResult> {
  const pubspec = (await readSafeText(join(dir, "pubspec.yaml"))) ?? "";
  const isFlutter = pubspec.includes("flutter:");
  const cli = isFlutter ? "flutter" : "dart";
  return {
    ecosystem: isFlutter ? "flutter" : "dart",
    hasTests: fileSet.has("test"),
    commands: {
      test: `${cli} test`,
      lint: `${cli} analyze`,
    },
  };
}

async function readSafeText(filePath: string): Promise<string | undefined> {
  try {
    const s = await stat(filePath);
    if (s.size > 256 * 1024) return undefined;
    return await readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}
