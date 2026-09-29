import { readdir, readFile, stat } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";
import { compareCodeUnits } from "src/utils/order.js";

import type { DetectionMatch, LanguageId, TechnologyId } from "src/catalog/catalog.js";
import { evaluateFacts, type CollectedFile, type DependencyFact, type DetectionFacts } from "./detection-engine.js";

export type { DetectionMatch, LanguageId, TechnologyId } from "src/catalog/catalog.js";
export type PackageManager = "pnpm" | "yarn" | "npm" | "bun";

export interface DetectedPackage {
  path: string;
  languages: LanguageId[];
  technologies: TechnologyId[];
  packageManager: PackageManager | undefined;
  verificationCommands: string[];
}

export interface ProjectDetection {
  languages: LanguageId[];
  technologies: TechnologyId[];
  matches: DetectionMatch[];
  packageManager: PackageManager | undefined;
  packages: DetectedPackage[];
}

interface PackageManifest {
  dependencies?: Record<string, unknown>;
  devDependencies?: Record<string, unknown>;
  peerDependencies?: Record<string, unknown>;
  optionalDependencies?: Record<string, unknown>;
  scripts?: Record<string, unknown>;
}

const ignoredDirectoryNames = new Set([
  ".agents",
  ".cache",
  ".claude",
  ".codex",
  ".gemini",
  ".git",
  ".harnix",
  ".kiro",
  ".next",
  ".pytest_cache",
  ".trellis",
  ".turbo",
  ".understand-anything",
  "__pycache__",
  "node_modules",
  "vendor",
  "bin",
  "obj",
  "dist",
  "build",
  "coverage",
  "docs",
]);
const verificationScriptNames = ["build", "lint", "test", "typecheck"] as const;
const maxFiles = 20_000;
const maxDepth = 32;
const maxReadableBytes = 256 * 1024;

export async function detectProject(projectRoot: string): Promise<ProjectDetection> {
  const root = resolve(projectRoot);
  const files = await collectFiles(root, root, 0, []);
  const dependencies = await collectDependencies(files);
  const facts = { files, dependencies };
  const matches = await evaluateFacts(facts);
  const packageManager = detectPackageManager(files);
  const packages = await detectPackages(facts, packageManager);
  return {
    languages: selectedLanguages(matches),
    technologies: selectedTechnologies(matches),
    matches,
    packageManager,
    packages: packages.length > 0 ? packages : fallbackPackage(matches, packageManager),
  };
}

async function collectFiles(
  root: string,
  directory: string,
  depth: number,
  collected: CollectedFile[],
): Promise<CollectedFile[]> {
  if (depth > maxDepth || collected.length >= maxFiles) return collected;
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => compareCodeUnits(left.name, right.name))) {
    if (collected.length >= maxFiles || entry.isSymbolicLink()) continue;
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectoryNames.has(entry.name)) await collectFiles(root, absolute, depth + 1, collected);
    } else if (entry.isFile()) {
      const path = relative(root, absolute).replaceAll("\\", "/");
      if (path.length > 0 && !path.startsWith("../")) collected.push({ absolute, path });
    }
  }
  return collected.sort((left, right) => compareCodeUnits(left.path, right.path));
}

async function collectDependencies(files: CollectedFile[]): Promise<DependencyFact[]> {
  const results = await Promise.all(
    files
      .filter(({ path }) => ["package.json", "composer.json"].includes(basename(path)))
      .map(async (file) => {
        const manifest = await readJsonObject(file);
        if (manifest === undefined) return [];
        if (basename(file.path) === "package.json") {
          const packageManifest = manifest as PackageManifest;
          return [
            packageManifest.dependencies,
            packageManifest.devDependencies,
            packageManifest.peerDependencies,
            packageManifest.optionalDependencies,
          ]
            .flatMap((group) => Object.keys(isRecord(group) ? group : {}))
            .map((name): DependencyFact => ({ ecosystem: "npm", name, path: file.path }));
        }
        return [manifest.require, manifest["require-dev"]]
          .flatMap((group) => Object.keys(isRecord(group) ? group : {}))
          .map((name): DependencyFact => ({ ecosystem: "composer", name, path: file.path }));
      }),
  );
  return results
    .flat()
    .sort((left, right) =>
      compareCodeUnits(
        `${left.path}\0${left.ecosystem}\0${left.name}`,
        `${right.path}\0${right.ecosystem}\0${right.name}`,
      ),
    );
}

async function detectPackages(
  facts: DetectionFacts,
  packageManager: PackageManager | undefined,
): Promise<DetectedPackage[]> {
  const packageFiles = facts.files.filter(({ path }) => basename(path) === "package.json");
  const results = await Promise.all(
    packageFiles.map(async (file) => {
      const path = dirname(file.path).replaceAll("\\", "/");
      const packagePath = path === "." ? "." : path;
      const prefix = packagePath === "." ? "" : `${packagePath}/`;
      const scoped: DetectionFacts = {
        files: facts.files.filter((item) => prefix.length === 0 || item.path.startsWith(prefix)),
        dependencies: facts.dependencies.filter((item) => prefix.length === 0 || item.path.startsWith(prefix)),
      };
      const matches = await evaluateFacts(scoped);
      const languages = selectedLanguages(matches),
        technologies = selectedTechnologies(matches);
      if (languages.length === 0 && technologies.length === 0) return undefined;
      const manifest = (await readJsonObject(file)) as PackageManifest | undefined;
      return {
        languages,
        technologies,
        packageManager,
        path: packagePath,
        verificationCommands: detectVerificationCommands(manifest, packageManager),
      } satisfies DetectedPackage;
    }),
  );
  return results
    .filter((item): item is DetectedPackage => item !== undefined)
    .sort((left, right) => compareCodeUnits(left.path, right.path));
}

function fallbackPackage(matches: DetectionMatch[], packageManager: PackageManager | undefined): DetectedPackage[] {
  const languages = selectedLanguages(matches),
    technologies = selectedTechnologies(matches);
  return languages.length === 0 && technologies.length === 0
    ? []
    : [{ languages, technologies, packageManager, path: ".", verificationCommands: [] }];
}

function selectedLanguages(matches: DetectionMatch[]): LanguageId[] {
  return sorted(
    matches
      .filter((match): match is DetectionMatch & { id: LanguageId } => match.facet === "language")
      .map(({ id }) => id),
  );
}

function selectedTechnologies(matches: DetectionMatch[]): TechnologyId[] {
  return sorted(
    matches
      .filter(
        (match): match is DetectionMatch & { id: TechnologyId } =>
          match.facet === "technology" && match.confidence !== "weak",
      )
      .map(({ id }) => id),
  );
}

function detectPackageManager(files: CollectedFile[]): PackageManager | undefined {
  const rootFiles = new Set(files.filter(({ path }) => !path.includes("/")).map(({ path }) => path));
  if (rootFiles.has("pnpm-lock.yaml")) return "pnpm";
  if (rootFiles.has("yarn.lock")) return "yarn";
  if (rootFiles.has("package-lock.json")) return "npm";
  if (rootFiles.has("bun.lockb") || rootFiles.has("bun.lock")) return "bun";
  return undefined;
}

function detectVerificationCommands(
  manifest: PackageManifest | undefined,
  packageManager: PackageManager | undefined,
): string[] {
  if (packageManager === undefined || manifest === undefined) return [];
  return verificationScriptNames
    .filter((name) => typeof manifest.scripts?.[name] === "string")
    .map((name) => `${packageManager} run ${name}`);
}

async function readJsonObject(file: CollectedFile): Promise<Record<string, unknown> | undefined> {
  const content = await readBoundedText(file);
  if (content === undefined) return undefined;
  try {
    const parsed: unknown = JSON.parse(content);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

async function readBoundedText(file: CollectedFile): Promise<string | undefined> {
  try {
    if ((await stat(file.absolute)).size > maxReadableBytes) return undefined;
    return await readFile(file.absolute, "utf8");
  } catch {
    return undefined;
  }
}

function sorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort(compareCodeUnits);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
