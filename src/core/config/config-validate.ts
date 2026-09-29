import { isValidTimeZone } from "src/utils/clock.js";
import { compareCodeUnits } from "src/utils/order.js";
import { normalizeRepositoryPath } from "src/utils/paths.js";
import {
  ConfigValidationError,
  developerPattern,
  languageIds,
  legacyIds,
  packageKeys,
  platformIds,
  technologyIds,
  type HarnixConfigV1,
  type HarnixConfigV2,
  type LegacyPackageConfig,
  type PackageConfig,
  type PlatformId,
  type VerifyConfig,
} from "./config-schema.js";

export function validateDeveloperId(value: string): string {
  if (!developerPattern.test(value)) throw new ConfigValidationError("developer must be a safe journal ID.");
  return value;
}

export function validateConfig(value: unknown): HarnixConfigV2 {
  if (!isRecord(value)) throw new ConfigValidationError("Harnix config must be a YAML object.");
  if (value.generator !== "harnix" || value.schemaVersion !== 2)
    throw new ConfigValidationError("Unsupported Harnix config generator or schema version.");
  validateCommon(value);
  assertIds(value.languages, languageIds, "languages");
  assertIds(value.technologies, technologyIds, "technologies");
  assertPackagesV2(value.packages);
  if (value.verify !== undefined) assertVerify(value.verify);
  return value as HarnixConfigV2;
}

export function validateConfigV1(value: unknown): HarnixConfigV1 {
  if (!isRecord(value)) throw new ConfigValidationError("Harnix config must be a YAML object.");
  if (value.generator !== "harnix" || value.schemaVersion !== 1)
    throw new ConfigValidationError("Unsupported Harnix config generator or schema version.");
  validateCommon(value);
  assertIds(value.languages, legacyIds, "languages");
  assertPackagesV1(value.packages);
  return value as HarnixConfigV1;
}

function validateCommon(value: Record<string, unknown>): void {
  if (typeof value.developer !== "string") throw new ConfigValidationError("developer must be a safe journal ID.");
  validateDeveloperId(value.developer);
  assertPlatforms(value.platforms);
  if (value.timezone !== undefined && !isValidTimeZone(value.timezone))
    throw new ConfigValidationError("timezone must be a valid IANA time zone name.");
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
    if (!isRecord(item) || typeof item.path !== "string")
      throw new ConfigValidationError("packages contains an invalid entry.");
    let normalizedPath: string;
    try {
      normalizedPath = normalizeRepositoryPath(item.path, { allowRoot: true });
    } catch {
      throw new ConfigValidationError("packages must have unique sorted safe paths.");
    }
    if (normalizedPath !== item.path || (previousPath !== undefined && previousPath >= normalizedPath))
      throw new ConfigValidationError("packages must have unique sorted safe paths.");
    validateProfile(item);
    previousPath = normalizedPath;
  }
}

const VERIFY_COMMAND_FIELDS = new Set(["test", "lint", "typecheck", "format", "suite"]);
const VERIFY_CONFIG_FIELDS = new Set([...VERIFY_COMMAND_FIELDS, "packages"]);
const PACKAGE_VERIFY_FIELDS = new Set([...VERIFY_COMMAND_FIELDS, "path"]);

function assertVerifyCommands(commands: Record<string, unknown>, prefix: string): void {
  for (const field of ["test", "lint", "typecheck", "format", "suite"]) {
    const cmd = commands[field];
    if (cmd !== undefined && (typeof cmd !== "string" || cmd.trim() === "")) {
      throw new ConfigValidationError(`${prefix}.${field} must be a non-empty string.`);
    }
  }
}

function assertVerifyPackages(packages: unknown): void {
  if (!Array.isArray(packages)) throw new ConfigValidationError("verify.packages must be an array.");
  let previousPath: string | undefined;
  for (const item of packages) {
    if (!isRecord(item) || typeof item.path !== "string")
      throw new ConfigValidationError("verify.packages contains an invalid entry.");
    for (const key of Object.keys(item)) {
      if (!PACKAGE_VERIFY_FIELDS.has(key)) {
        throw new ConfigValidationError(`verify.packages contains invalid field '${key}'.`);
      }
    }
    let normalizedPath: string;
    try {
      normalizedPath = normalizeRepositoryPath(item.path, { allowRoot: true });
    } catch {
      throw new ConfigValidationError("verify.packages must have unique sorted safe paths.");
    }
    if (normalizedPath !== item.path || (previousPath !== undefined && previousPath >= normalizedPath))
      throw new ConfigValidationError("verify.packages must have unique sorted safe paths.");
    assertVerifyCommands(item, "verify.packages");
    previousPath = normalizedPath;
  }
}

function assertVerify(value: unknown): asserts value is VerifyConfig {
  if (!isRecord(value)) throw new ConfigValidationError("verify must be an object.");
  for (const key of Object.keys(value)) {
    if (!VERIFY_CONFIG_FIELDS.has(key)) {
      throw new ConfigValidationError(`verify contains invalid field '${key}'.`);
    }
  }
  assertVerifyCommands(value, "verify");
  if (value.packages !== undefined) {
    assertVerifyPackages(value.packages);
  }
}

function assertIds<T extends string>(value: unknown, allowed: Set<T>, field: string): asserts value is T[] {
  if (!Array.isArray(value) || !value.every((id) => typeof id === "string" && allowed.has(id as T)))
    throw new ConfigValidationError(`${field} contains an invalid ID.`);
  assertSortedUnique(value as string[], field);
}

function assertPlatforms(value: unknown): asserts value is PlatformId[] {
  if (
    !Array.isArray(value) ||
    !value.every((platform) => typeof platform === "string" && platformIds.has(platform as PlatformId))
  )
    throw new ConfigValidationError("platforms contains an invalid platform.");
  assertSortedUnique(value as string[], "platforms");
}

function assertContext(value: unknown): void {
  if (!isRecord(value) || !isPositiveInteger(value.maxCharacters) || !isPositiveNumber(value.tokenApproximation))
    throw new ConfigValidationError("context values must be positive.");
}

function assertRuntime(value: unknown): void {
  if (!isRecord(value) || value.research !== "conditional" || typeof value.fullContext !== "boolean")
    throw new ConfigValidationError("runtime is invalid.");
}

export function normalizePackages(values: PackageConfig[]): PackageConfig[] {
  return values
    .map((item) => ({
      path: normalizeRepositoryPath(item.path, { allowRoot: true }),
      languages: sortUnique(item.languages),
      technologies: sortUnique(item.technologies),
      ...unknownEntries(item, packageKeys),
    }))
    .sort((left, right) => compareCodeUnits(left.path, right.path));
}

export function unknownEntries(value: Record<string, unknown>, known: Set<string>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !known.has(key)));
}

export function sortUnique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort(compareCodeUnits);
}

function assertSortedUnique(values: string[], field: string): void {
  if (new Set(values).size !== values.length || values.some((value, index) => index > 0 && values[index - 1]! >= value))
    throw new ConfigValidationError(`${field} must be unique and sorted.`);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
