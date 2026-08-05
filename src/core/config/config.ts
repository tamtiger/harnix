import { readFile } from "node:fs/promises";
import { parse, stringify } from "yaml";

import { atomicWriteFile } from "../../utils/atomic-write.js";
import { normalizeRepositoryPath } from "../../utils/paths.js";
import type { LanguageId } from "../../utils/detection.js";

export type PlatformId = "kiro" | "antigravity" | "codex";

export interface PackageConfig {
  path: string;
  languages: LanguageId[];
}

export interface HarnixConfigV1 {
  generator: "harnix";
  schemaVersion: 1;
  developer: string;
  languages: LanguageId[];
  packages: PackageConfig[];
  platforms: PlatformId[];
  context: { maxCharacters: number; tokenApproximation: number };
  runtime: { research: "conditional"; fullContext: boolean };
  [key: string]: unknown;
}

export interface CreateConfigOptions {
  developer: string;
  languages?: LanguageId[];
  packages?: PackageConfig[];
  platforms?: PlatformId[];
}

const languageIds = new Set<LanguageId>([
  "csharp-dotnet-abp", "typescript-nestjs", "python", "java-spring", "go", "react-web", "vue",
]);
const platformIds = new Set<PlatformId>(["kiro", "antigravity", "codex"]);
const developerPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u;

export class ConfigValidationError extends Error {
  override name = "ConfigValidationError";
}

export function createConfig(options: CreateConfigOptions): HarnixConfigV1 {
  const config: HarnixConfigV1 = {
    context: { maxCharacters: 24000, tokenApproximation: 4 },
    developer: options.developer,
    generator: "harnix",
    languages: sortUnique(options.languages ?? []),
    packages: normalizePackages(options.packages ?? []),
    platforms: sortUnique(options.platforms ?? []),
    runtime: { fullContext: false, research: "conditional" },
    schemaVersion: 1,
  };
  return validateConfig(config);
}

export function validateConfig(value: unknown): HarnixConfigV1 {
  if (!isRecord(value)) {
    throw new ConfigValidationError("Harnix config must be a YAML object.");
  }
  if (value.generator !== "harnix" || value.schemaVersion !== 1) {
    throw new ConfigValidationError("Unsupported Harnix config generator or schema version.");
  }
  if (typeof value.developer !== "string" || !developerPattern.test(value.developer)) {
    throw new ConfigValidationError("developer must be a safe workspace ID.");
  }

  assertLanguages(value.languages, "languages");
  assertPlatforms(value.platforms);
  assertPackages(value.packages);
  assertContext(value.context);
  assertRuntime(value.runtime);

  return value as HarnixConfigV1;
}

export async function readConfig(path: string): Promise<HarnixConfigV1> {
  return validateConfig(parse(await readFile(path, "utf8")));
}

export async function writeConfig(path: string, config: HarnixConfigV1): Promise<void> {
  const validConfig = validateConfig(config);
  const knownKeys = new Set(["generator", "schemaVersion", "developer", "languages", "packages", "platforms", "context", "runtime"]);
  const unknown = Object.fromEntries(Object.entries(validConfig).filter(([key]) => !knownKeys.has(key)));
  const ordered = {
    generator: validConfig.generator,
    schemaVersion: validConfig.schemaVersion,
    developer: validConfig.developer,
    languages: validConfig.languages,
    packages: validConfig.packages,
    platforms: validConfig.platforms,
    context: validConfig.context,
    runtime: validConfig.runtime,
    ...unknown,
  };
  await atomicWriteFile(path, stringify(ordered).replaceAll("\r\n", "\n"));
}

function assertLanguages(value: unknown, field: string): asserts value is LanguageId[] {
  if (!Array.isArray(value) || !value.every((language) => typeof language === "string" && languageIds.has(language as LanguageId))) {
    throw new ConfigValidationError(`${field} contains an invalid language.`);
  }
  assertSortedUnique(value, field);
}

function assertPlatforms(value: unknown): asserts value is PlatformId[] {
  if (!Array.isArray(value) || !value.every((platform) => typeof platform === "string" && platformIds.has(platform as PlatformId))) {
    throw new ConfigValidationError("platforms contains an invalid platform.");
  }
  assertSortedUnique(value, "platforms");
}

function assertPackages(value: unknown): asserts value is PackageConfig[] {
  if (!Array.isArray(value)) {
    throw new ConfigValidationError("packages must be an array.");
  }
  let previousPath: string | undefined;
  for (const packageConfig of value) {
    if (!isRecord(packageConfig) || typeof packageConfig.path !== "string") {
      throw new ConfigValidationError("packages contains an invalid entry.");
    }
    let normalizedPath: string;
    try {
      normalizedPath = normalizeRepositoryPath(packageConfig.path, { allowRoot: true });
    } catch {
      throw new ConfigValidationError("packages must have unique sorted safe paths.");
    }
    if (normalizedPath !== packageConfig.path || previousPath !== undefined && previousPath >= normalizedPath) {
      throw new ConfigValidationError("packages must have unique sorted safe paths.");
    }
    assertLanguages(packageConfig.languages, "package languages");
    previousPath = normalizedPath;
  }
}

function assertContext(value: unknown): void {
  if (!isRecord(value) || !isPositiveInteger(value.maxCharacters) || !isPositiveNumber(value.tokenApproximation)) {
    throw new ConfigValidationError("context values must be positive.");
  }
}

function assertRuntime(value: unknown): void {
  if (!isRecord(value) || value.research !== "conditional" || typeof value.fullContext !== "boolean") {
    throw new ConfigValidationError("runtime is invalid.");
  }
}

function normalizePackages(packages: PackageConfig[]): PackageConfig[] {
  return packages.map((packageConfig) => ({
    languages: sortUnique(packageConfig.languages),
    path: normalizeRepositoryPath(packageConfig.path, { allowRoot: true }),
  })).sort((left, right) => left.path.localeCompare(right.path));
}

function sortUnique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function assertSortedUnique(values: string[], field: string): void {
  if (new Set(values).size !== values.length || values.some((value, index) => index > 0 && values[index - 1]! >= value)) {
    throw new ConfigValidationError(`${field} must be unique and sorted.`);
  }
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

