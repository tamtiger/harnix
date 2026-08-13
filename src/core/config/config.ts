import { readFile } from "node:fs/promises";
import { parse, stringify } from "yaml";

import type { LanguageId, TechnologyId } from "../../catalog/catalog.js";
import { atomicWriteFile } from "../../utils/atomic-write.js";
import { normalizeRepositoryPath } from "../../utils/paths.js";
import { legacyStackIds, normalizeLegacyStackIds, type LegacyStackId } from "../../utils/stack.js";

export type PlatformId = "kiro" | "antigravity" | "codex";

export interface LegacyPackageConfig {
  path: string;
  languages: LegacyStackId[];
  [key: string]: unknown;
}

export interface PackageConfig {
  path: string;
  languages: LanguageId[];
  technologies: TechnologyId[];
  [key: string]: unknown;
}

export interface HarnixConfigV1 {
  generator: "harnix";
  schemaVersion: 1;
  developer: string;
  languages: LegacyStackId[];
  packages: LegacyPackageConfig[];
  platforms: PlatformId[];
  context: { maxCharacters: number; tokenApproximation: number; [key: string]: unknown };
  runtime: { research: "conditional"; fullContext: boolean; [key: string]: unknown };
  [key: string]: unknown;
}

export interface HarnixConfigV2 {
  generator: "harnix";
  schemaVersion: 2;
  developer: string;
  languages: LanguageId[];
  technologies: TechnologyId[];
  packages: PackageConfig[];
  platforms: PlatformId[];
  context: { maxCharacters: number; tokenApproximation: number; [key: string]: unknown };
  runtime: { research: "conditional"; fullContext: boolean; [key: string]: unknown };
  [key: string]: unknown;
}

export type HarnixConfig = HarnixConfigV2;

export interface ConfigDocument {
  sourceSchemaVersion: 1 | 2;
  config: HarnixConfigV2;
}

export interface CreateConfigOptions {
  developer: string;
  languages?: LanguageId[] | undefined;
  technologies?: TechnologyId[] | undefined;
  packages?: PackageConfig[] | undefined;
  platforms?: PlatformId[] | undefined;
}

const languageIds = new Set<LanguageId>(["csharp", "typescript", "javascript", "php", "python", "java", "go"]);
const technologyIds = new Set<TechnologyId>(["dotnet", "abp", "nestjs", "spring", "react-web", "vue", "codeigniter"]);
const legacyIds = new Set<LegacyStackId>(legacyStackIds);
const platformIds = new Set<PlatformId>(["kiro", "antigravity", "codex"]);
const developerPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u;
const topLevelKeys = new Set(["generator", "schemaVersion", "developer", "languages", "technologies", "packages", "platforms", "context", "runtime"]);
const packageKeys = new Set(["path", "languages", "technologies"]);
const contextKeys = new Set(["maxCharacters", "tokenApproximation"]);
const runtimeKeys = new Set(["research", "fullContext"]);

export class ConfigValidationError extends Error {
  override name = "ConfigValidationError";
}

export function validateDeveloperId(value: string): string {
  if (!developerPattern.test(value)) throw new ConfigValidationError("developer must be a safe journal ID.");
  return value;
}

export function createConfig(options: CreateConfigOptions): HarnixConfigV2 {
  return validateConfig({
    context: { maxCharacters: 24000, tokenApproximation: 4 },
    developer: options.developer,
    generator: "harnix",
    languages: sortUnique(options.languages ?? []),
    technologies: sortUnique(options.technologies ?? []),
    packages: normalizePackages(options.packages ?? []),
    platforms: sortUnique(options.platforms ?? []),
    runtime: { fullContext: false, research: "conditional" },
    schemaVersion: 2,
  });
}

export function validateConfig(value: unknown): HarnixConfigV2 {
  if (!isRecord(value)) throw new ConfigValidationError("Harnix config must be a YAML object.");
  if (value.generator !== "harnix" || value.schemaVersion !== 2) throw new ConfigValidationError("Unsupported Harnix config generator or schema version.");
  validateCommon(value);
  assertIds(value.languages, languageIds, "languages");
  assertIds(value.technologies, technologyIds, "technologies");
  assertPackagesV2(value.packages);
  return value as HarnixConfigV2;
}

export function validateConfigV1(value: unknown): HarnixConfigV1 {
  if (!isRecord(value)) throw new ConfigValidationError("Harnix config must be a YAML object.");
  if (value.generator !== "harnix" || value.schemaVersion !== 1) throw new ConfigValidationError("Unsupported Harnix config generator or schema version.");
  validateCommon(value);
  assertIds(value.languages, legacyIds, "languages");
  assertPackagesV1(value.packages);
  return value as HarnixConfigV1;
}

export async function readConfigDocument(path: string): Promise<ConfigDocument> {
  let value: unknown;
  try {
    value = parse(await readFile(path, "utf8"));
  } catch (error: unknown) {
    if (isMissingFile(error)) throw error;
    throw new ConfigValidationError("Harnix config YAML is invalid.");
  }
  if (!isRecord(value) || value.generator !== "harnix") throw new ConfigValidationError("Unsupported Harnix config generator or schema version.");
  if (value.schemaVersion === 2) return { config: validateConfig(value), sourceSchemaVersion: 2 };
  if (value.schemaVersion === 1) return { config: normalizeV1(validateConfigV1(value)), sourceSchemaVersion: 1 };
  throw new ConfigValidationError("Unsupported Harnix config generator or schema version.");
}

export async function readConfig(path: string): Promise<HarnixConfigV2> {
  return (await readConfigDocument(path)).config;
}

export async function writeConfig(path: string, config: HarnixConfigV2): Promise<void> {
  const valid = validateConfig(config);
  await atomicWriteFile(path, stringify(orderedConfig(valid)).replaceAll("\r\n", "\n"));
}

export async function migrateConfig(path: string): Promise<{ status: "migrated" | "unchanged"; config: HarnixConfigV2 }> {
  const document = await readConfigDocument(path);
  if (document.sourceSchemaVersion === 2) return { status: "unchanged", config: document.config };
  await writeConfig(path, document.config);
  return { status: "migrated", config: document.config };
}

function normalizeV1(value: HarnixConfigV1): HarnixConfigV2 {
  const profile = normalizeLegacyStackIds(value.languages);
  const unknown = unknownEntries(value, topLevelKeys);
  return validateConfig({
    generator: "harnix",
    schemaVersion: 2,
    developer: value.developer,
    languages: profile.languages,
    technologies: profile.technologies,
    packages: value.packages.map((item) => {
      const packageProfile = normalizeLegacyStackIds(item.languages);
      return {
        path: item.path,
        languages: packageProfile.languages,
        technologies: packageProfile.technologies,
        ...unknownEntries(item, packageKeys),
      };
    }),
    platforms: [...value.platforms],
    context: { maxCharacters: value.context.maxCharacters, tokenApproximation: value.context.tokenApproximation, ...unknownEntries(value.context, contextKeys) },
    runtime: { research: value.runtime.research, fullContext: value.runtime.fullContext, ...unknownEntries(value.runtime, runtimeKeys) },
    ...unknown,
  });
}

function orderedConfig(value: HarnixConfigV2): Record<string, unknown> {
  return {
    generator: value.generator,
    schemaVersion: value.schemaVersion,
    developer: value.developer,
    languages: value.languages,
    technologies: value.technologies,
    packages: value.packages.map((item) => ({ path: item.path, languages: item.languages, technologies: item.technologies, ...unknownEntries(item, packageKeys) })),
    platforms: value.platforms,
    context: { maxCharacters: value.context.maxCharacters, tokenApproximation: value.context.tokenApproximation, ...unknownEntries(value.context, contextKeys) },
    runtime: { research: value.runtime.research, fullContext: value.runtime.fullContext, ...unknownEntries(value.runtime, runtimeKeys) },
    ...unknownEntries(value, topLevelKeys),
  };
}

function validateCommon(value: Record<string, unknown>): void {
  if (typeof value.developer !== "string") throw new ConfigValidationError("developer must be a safe journal ID.");
  validateDeveloperId(value.developer);
  assertPlatforms(value.platforms);
  assertContext(value.context);
  assertRuntime(value.runtime);
}

function assertPackagesV2(value: unknown): asserts value is PackageConfig[] {
  assertPackages(value, (item) => {
    assertIds(item.languages, languageIds, "package languages");
    assertIds(item.technologies, technologyIds, "package technologies");
  });
}

function assertPackagesV1(value: unknown): asserts value is LegacyPackageConfig[] {
  assertPackages(value, (item) => assertIds(item.languages, legacyIds, "package languages"));
}

function assertPackages(value: unknown, validateProfile: (item: Record<string, unknown>) => void): void {
  if (!Array.isArray(value)) throw new ConfigValidationError("packages must be an array.");
  let previousPath: string | undefined;
  for (const item of value) {
    if (!isRecord(item) || typeof item.path !== "string") throw new ConfigValidationError("packages contains an invalid entry.");
    let normalizedPath: string;
    try { normalizedPath = normalizeRepositoryPath(item.path, { allowRoot: true }); }
    catch { throw new ConfigValidationError("packages must have unique sorted safe paths."); }
    if (normalizedPath !== item.path || previousPath !== undefined && previousPath >= normalizedPath) throw new ConfigValidationError("packages must have unique sorted safe paths.");
    validateProfile(item);
    previousPath = normalizedPath;
  }
}

function assertIds<T extends string>(value: unknown, allowed: Set<T>, field: string): asserts value is T[] {
  if (!Array.isArray(value) || !value.every((id) => typeof id === "string" && allowed.has(id as T))) throw new ConfigValidationError(`${field} contains an invalid ID.`);
  assertSortedUnique(value, field);
}

function assertPlatforms(value: unknown): asserts value is PlatformId[] {
  if (!Array.isArray(value) || !value.every((platform) => typeof platform === "string" && platformIds.has(platform as PlatformId))) throw new ConfigValidationError("platforms contains an invalid platform.");
  assertSortedUnique(value, "platforms");
}

function assertContext(value: unknown): void {
  if (!isRecord(value) || !isPositiveInteger(value.maxCharacters) || !isPositiveNumber(value.tokenApproximation)) throw new ConfigValidationError("context values must be positive.");
}

function assertRuntime(value: unknown): void {
  if (!isRecord(value) || value.research !== "conditional" || typeof value.fullContext !== "boolean") throw new ConfigValidationError("runtime is invalid.");
}

function normalizePackages(values: PackageConfig[]): PackageConfig[] {
  return values.map((item) => ({
    path: normalizeRepositoryPath(item.path, { allowRoot: true }),
    languages: sortUnique(item.languages),
    technologies: sortUnique(item.technologies),
    ...unknownEntries(item, packageKeys),
  })).sort((left, right) => left.path.localeCompare(right.path));
}

function unknownEntries(value: Record<string, unknown>, known: Set<string>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !known.has(key)));
}

function sortUnique<T extends string>(values: T[]): T[] { return [...new Set(values)].sort((left, right) => left.localeCompare(right)); }
function assertSortedUnique(values: string[], field: string): void {
  if (new Set(values).size !== values.length || values.some((value, index) => index > 0 && values[index - 1]! >= value)) throw new ConfigValidationError(`${field} must be unique and sorted.`);
}
function isPositiveInteger(value: unknown): value is number { return typeof value === "number" && Number.isInteger(value) && value > 0; }
function isPositiveNumber(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value > 0; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isMissingFile(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"; }

