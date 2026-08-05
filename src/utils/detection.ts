import { readdir, readFile } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";

export type LanguageId =
  | "csharp-dotnet-abp"
  | "typescript-nestjs"
  | "python"
  | "java-spring"
  | "go"
  | "react-web"
  | "vue";

export type PackageManager = "pnpm" | "yarn" | "npm" | "bun";

export interface DetectedPackage {
  path: string;
  languages: LanguageId[];
  packageManager: PackageManager | undefined;
  verificationCommands: string[];
}

export interface ProjectDetection {
  languages: LanguageId[];
  packageManager: PackageManager | undefined;
  packages: DetectedPackage[];
}

interface PackageManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

const ignoredDirectoryNames = new Set([".git", "node_modules", "vendor", "bin", "obj", "dist", "build"]);
const verificationScriptNames = ["build", "lint", "test", "typecheck"] as const;

export async function detectProject(projectRoot: string): Promise<ProjectDetection> {
  const root = resolve(projectRoot);
  const files = await collectFiles(root);
  const packageManager = detectPackageManager(files, root);
  const markerLanguages = detectMarkerLanguages(files);
  const packageDetections = await detectPackageManifests(files, root, packageManager);
  const languages = sortUniqueLanguages([
    ...markerLanguages,
    ...packageDetections.flatMap((detectedPackage) => detectedPackage.languages),
  ]);

  if (packageDetections.length > 0) {
    return {
      languages,
      packageManager,
      packages: packageDetections,
    };
  }

  return {
    languages,
    packageManager,
    packages: languages.length === 0
      ? []
      : [{ languages, packageManager, path: ".", verificationCommands: [] }],
  };
}

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      continue;
    }

    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectoryNames.has(entry.name)) {
        files.push(...await collectFiles(entryPath));
      }
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function detectPackageManager(files: string[], root: string): PackageManager | undefined {
  const rootFiles = new Set(files.filter((file) => dirnameRelative(root, file) === ".").map((file) => basename(file)));

  if (rootFiles.has("pnpm-lock.yaml")) {
    return "pnpm";
  }
  if (rootFiles.has("yarn.lock")) {
    return "yarn";
  }
  if (rootFiles.has("package-lock.json")) {
    return "npm";
  }
  if (rootFiles.has("bun.lockb") || rootFiles.has("bun.lock")) {
    return "bun";
  }
  return undefined;
}

function detectMarkerLanguages(files: string[]): LanguageId[] {
  const languages: LanguageId[] = [];

  for (const file of files) {
    const fileName = basename(file);
    if (fileName.endsWith(".csproj") || fileName === "global.json" || fileName.endsWith(".sln")) {
      languages.push("csharp-dotnet-abp");
    } else if (fileName === "pyproject.toml" || fileName === "requirements.txt") {
      languages.push("python");
    } else if (fileName === "pom.xml" || fileName === "build.gradle" || fileName === "build.gradle.kts") {
      languages.push("java-spring");
    } else if (fileName === "go.mod") {
      languages.push("go");
    }
  }

  return sortUniqueLanguages(languages);
}

async function detectPackageManifests(
  files: string[],
  root: string,
  packageManager: PackageManager | undefined,
): Promise<DetectedPackage[]> {
  const packageFiles = files.filter((file) => basename(file) === "package.json");
  const detections = await Promise.all(packageFiles.map(async (packageFile) => {
    const manifest = await readPackageManifest(packageFile);
    if (manifest === undefined) {
      return undefined;
    }

    const languages = detectManifestLanguages(manifest);
    if (languages.length === 0) {
      return undefined;
    }

    const packagePath = dirnameRelative(root, packageFile);
    return {
      languages,
      packageManager,
      path: packagePath,
      verificationCommands: detectVerificationCommands(manifest, packageManager),
    } satisfies DetectedPackage;
  }));

  return detections
    .filter((detection): detection is DetectedPackage => detection !== undefined)
    .sort((left, right) => left.path.localeCompare(right.path));
}

async function readPackageManifest(packageFile: string): Promise<PackageManifest | undefined> {
  try {
    const parsed: unknown = JSON.parse(await readFile(packageFile, "utf8"));
    return isPackageManifest(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function isPackageManifest(value: unknown): value is PackageManifest {
  return typeof value === "object" && value !== null;
}

function detectManifestLanguages(manifest: PackageManifest): LanguageId[] {
  const dependencies = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ]);
  const languages: LanguageId[] = [];

  if (dependencies.has("@nestjs/core")) {
    languages.push("typescript-nestjs");
  }
  if (dependencies.has("react")) {
    languages.push("react-web");
  }
  if (dependencies.has("vue")) {
    languages.push("vue");
  }

  return sortUniqueLanguages(languages);
}

function detectVerificationCommands(
  manifest: PackageManifest,
  packageManager: PackageManager | undefined,
): string[] {
  if (packageManager === undefined) {
    return [];
  }

  return verificationScriptNames
    .filter((scriptName) => typeof manifest.scripts?.[scriptName] === "string")
    .map((scriptName) => `${packageManager} run ${scriptName}`);
}

function dirnameRelative(root: string, file: string): string {
  const packageDirectory = resolve(file, "..");
  const relativePath = relative(root, packageDirectory).replaceAll("\\", "/");
  return relativePath.length === 0 ? "." : relativePath;
}

function sortUniqueLanguages(languages: LanguageId[]): LanguageId[] {
  return [...new Set(languages)].sort((left, right) => left.localeCompare(right));
}

