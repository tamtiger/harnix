import { readdir, readFile, stat } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";
import { compareCodeUnits } from "./order.js";

import {
  stackCatalog,
  type DetectionConfidence,
  type DetectionEvidence,
  type DetectionMatch,
  type DetectorExpression,
  type DetectorPredicate,
  type LanguageDescriptor,
  type LanguageId,
  type TechnologyDescriptor,
  type TechnologyId,
} from "../catalog/catalog.js";
import { matchesSafeGlob } from "./safe-glob.js";

export type { DetectionMatch, LanguageId, TechnologyId } from "../catalog/catalog.js";
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

interface CollectedFile { absolute: string; path: string }
interface DependencyFact { ecosystem: "npm" | "composer"; name: string; path: string }
interface DetectionFacts { files: CollectedFile[]; dependencies: DependencyFact[] }
interface PackageManifest { dependencies?: Record<string, unknown>; devDependencies?: Record<string, unknown>; peerDependencies?: Record<string, unknown>; optionalDependencies?: Record<string, unknown>; scripts?: Record<string, unknown> }

const ignoredDirectoryNames = new Set([
  ".agents", ".cache", ".claude", ".codex", ".gemini", ".git", ".harnix", ".kiro", ".next", ".pytest_cache", ".trellis", ".turbo", ".understand-anything",
  "__pycache__", "node_modules", "vendor", "bin", "obj", "dist", "build", "coverage", "docs",
]);
const verificationScriptNames = ["build", "lint", "test", "typecheck"] as const;
const maxFiles = 20_000;
const maxDepth = 32;
const maxReadableBytes = 256 * 1024;
const maxEvidencePerMatch = 8;
const confidenceRank: Record<DetectionConfidence, number> = { weak: 0, probable: 1, confirmed: 2 };

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

async function collectFiles(root: string, directory: string, depth: number, collected: CollectedFile[]): Promise<CollectedFile[]> {
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
  const results = await Promise.all(files.filter(({ path }) => ["package.json", "composer.json"].includes(basename(path))).map(async (file) => {
    const manifest = await readJsonObject(file);
    if (manifest === undefined) return [];
    if (basename(file.path) === "package.json") {
      const packageManifest = manifest as PackageManifest;
      return [packageManifest.dependencies, packageManifest.devDependencies, packageManifest.peerDependencies, packageManifest.optionalDependencies]
        .flatMap((group) => Object.keys(isRecord(group) ? group : {}))
        .map((name): DependencyFact => ({ ecosystem: "npm", name, path: file.path }));
    }
    return [manifest.require, manifest["require-dev"]]
      .flatMap((group) => Object.keys(isRecord(group) ? group : {}))
      .map((name): DependencyFact => ({ ecosystem: "composer", name, path: file.path }));
  }));
  return results.flat().sort((left, right) => compareCodeUnits(`${left.path}\0${left.ecosystem}\0${left.name}`, `${right.path}\0${right.ecosystem}\0${right.name}`));
}

async function evaluateFacts(facts: DetectionFacts): Promise<DetectionMatch[]> {
  const matches: DetectionMatch[] = [];
  for (const descriptor of stackCatalog.languages) {
    const evaluated = await evaluateDescriptor(descriptor, facts);
    if (evaluated !== undefined) matches.push({ ...evaluated, facet: "language", id: descriptor.id, kind: "language", source: "catalog" });
  }
  for (const descriptor of stackCatalog.technologies) {
    const evaluated = await evaluateDescriptor(descriptor, facts);
    if (evaluated !== undefined) matches.push({ ...evaluated, facet: "technology", id: descriptor.id, kind: descriptor.kind, source: "catalog" });
  }
  applyTechnologyImplications(matches);
  return matches.sort(compareMatches);
}

async function evaluateDescriptor(descriptor: LanguageDescriptor | TechnologyDescriptor, facts: DetectionFacts): Promise<{ confidence: DetectionConfidence; evidence: DetectionEvidence[] } | undefined> {
  const matches: Array<{ confidence: DetectionConfidence; evidence: DetectionEvidence[] }> = [];
  for (const expression of descriptor.detectors) {
    const evidence = await evaluateExpression(expression, facts);
    if (evidence !== undefined) matches.push({ confidence: expression.confidence, evidence });
  }
  if (matches.length === 0) return undefined;
  const confidence = matches.reduce((best, item) => confidenceRank[item.confidence] > confidenceRank[best] ? item.confidence : best, matches[0]!.confidence);
  return { confidence, evidence: uniqueEvidence(matches.flatMap(({ evidence }) => evidence)).slice(0, maxEvidencePerMatch) };
}

async function evaluateExpression(expression: DetectorExpression, facts: DetectionFacts): Promise<DetectionEvidence[] | undefined> {
  const allEvidence: DetectionEvidence[] = [];
  for (const predicate of expression.allOf ?? []) {
    const evidence = await matchPredicate(predicate, facts);
    if (evidence.length === 0) return undefined;
    allEvidence.push(...evidence);
  }
  if (expression.anyOf !== undefined) {
    const groups = await Promise.all(expression.anyOf.map(async (predicate) => matchPredicate(predicate, facts)));
    const matched = groups.filter((evidence) => evidence.length > 0);
    if (matched.length === 0) return undefined;
    allEvidence.push(...matched.flat());
  }
  for (const predicate of expression.noneOf ?? []) if ((await matchPredicate(predicate, facts)).length > 0) return undefined;
  return uniqueEvidence(allEvidence);
}

async function matchPredicate(predicate: DetectorPredicate, facts: DetectionFacts): Promise<DetectionEvidence[]> {
  if (predicate.kind === "file") {
    return facts.files.filter((file) => matchesSafeGlob(file.path, predicate.glob)).slice(0, maxEvidencePerMatch).map((file) => ({ detail: predicate.glob, kind: "file", path: file.path }));
  }
  if (predicate.kind === "dependency") {
    return facts.dependencies.filter((fact) => fact.ecosystem === predicate.ecosystem && fact.name === predicate.name).slice(0, maxEvidencePerMatch).map((fact) => ({ detail: `${fact.ecosystem}:${fact.name}`, kind: "dependency", path: fact.path }));
  }
  const candidates = facts.files.filter((file) => matchesSafeGlob(file.path, predicate.glob));
  const evidence: DetectionEvidence[] = [];
  for (const file of candidates) {
    const content = await readBoundedText(file);
    if (content?.includes(predicate.contains)) evidence.push({ detail: `contains:${predicate.contains}`, kind: "content", path: file.path });
    if (evidence.length >= maxEvidencePerMatch) break;
  }
  return evidence;
}

function applyTechnologyImplications(matches: DetectionMatch[]): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const match of [...matches]) {
      if (match.facet !== "technology") continue;
      const descriptor = stackCatalog.technologies.find(({ id }) => id === match.id);
      for (const id of descriptor?.implies?.technologies ?? []) {
        if (matches.some((candidate) => candidate.facet === "technology" && candidate.id === id)) continue;
        const implied = stackCatalog.technologies.find((candidate) => candidate.id === id)!;
        matches.push({ confidence: match.confidence, evidence: match.evidence, facet: "technology", id, kind: implied.kind, source: "catalog" });
        changed = true;
      }
    }
  }
}

async function detectPackages(facts: DetectionFacts, packageManager: PackageManager | undefined): Promise<DetectedPackage[]> {
  const packageFiles = facts.files.filter(({ path }) => basename(path) === "package.json");
  const results = await Promise.all(packageFiles.map(async (file) => {
    const path = dirname(file.path).replaceAll("\\", "/");
    const packagePath = path === "." ? "." : path;
    const prefix = packagePath === "." ? "" : `${packagePath}/`;
    const scoped: DetectionFacts = {
      files: facts.files.filter((item) => prefix.length === 0 || item.path.startsWith(prefix)),
      dependencies: facts.dependencies.filter((item) => prefix.length === 0 || item.path.startsWith(prefix)),
    };
    const matches = await evaluateFacts(scoped);
    const languages = selectedLanguages(matches), technologies = selectedTechnologies(matches);
    if (languages.length === 0 && technologies.length === 0) return undefined;
    const manifest = await readJsonObject(file) as PackageManifest | undefined;
    return { languages, technologies, packageManager, path: packagePath, verificationCommands: detectVerificationCommands(manifest, packageManager) } satisfies DetectedPackage;
  }));
  return results.filter((item): item is DetectedPackage => item !== undefined).sort((left, right) => compareCodeUnits(left.path, right.path));
}

function fallbackPackage(matches: DetectionMatch[], packageManager: PackageManager | undefined): DetectedPackage[] {
  const languages = selectedLanguages(matches), technologies = selectedTechnologies(matches);
  return languages.length === 0 && technologies.length === 0 ? [] : [{ languages, technologies, packageManager, path: ".", verificationCommands: [] }];
}

function selectedLanguages(matches: DetectionMatch[]): LanguageId[] {
  return sorted(matches.filter((match): match is DetectionMatch & { id: LanguageId } => match.facet === "language").map(({ id }) => id));
}

function selectedTechnologies(matches: DetectionMatch[]): TechnologyId[] {
  return sorted(matches.filter((match): match is DetectionMatch & { id: TechnologyId } => match.facet === "technology" && match.confidence !== "weak").map(({ id }) => id));
}

function detectPackageManager(files: CollectedFile[]): PackageManager | undefined {
  const rootFiles = new Set(files.filter(({ path }) => !path.includes("/")).map(({ path }) => path));
  if (rootFiles.has("pnpm-lock.yaml")) return "pnpm";
  if (rootFiles.has("yarn.lock")) return "yarn";
  if (rootFiles.has("package-lock.json")) return "npm";
  if (rootFiles.has("bun.lockb") || rootFiles.has("bun.lock")) return "bun";
  return undefined;
}

function detectVerificationCommands(manifest: PackageManifest | undefined, packageManager: PackageManager | undefined): string[] {
  if (packageManager === undefined || manifest === undefined) return [];
  return verificationScriptNames.filter((name) => typeof manifest.scripts?.[name] === "string").map((name) => `${packageManager} run ${name}`);
}

async function readJsonObject(file: CollectedFile): Promise<Record<string, unknown> | undefined> {
  const content = await readBoundedText(file);
  if (content === undefined) return undefined;
  try { const parsed: unknown = JSON.parse(content); return isRecord(parsed) ? parsed : undefined; }
  catch { return undefined; }
}

async function readBoundedText(file: CollectedFile): Promise<string | undefined> {
  try {
    if ((await stat(file.absolute)).size > maxReadableBytes) return undefined;
    return await readFile(file.absolute, "utf8");
  } catch { return undefined; }
}

function uniqueEvidence(values: DetectionEvidence[]): DetectionEvidence[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = `${value.path}\0${value.kind}\0${value.detail}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).sort((left, right) => compareCodeUnits(`${left.path}\0${left.kind}\0${left.detail}`, `${right.path}\0${right.kind}\0${right.detail}`));
}

function compareMatches(left: DetectionMatch, right: DetectionMatch): number { return compareCodeUnits(`${left.facet}\0${left.id}`, `${right.facet}\0${right.id}`); }
function sorted<T extends string>(values: T[]): T[] { return [...new Set(values)].sort(compareCodeUnits); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
