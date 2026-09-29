import type { LanguageId, TechnologyId } from "src/catalog/catalog.js";
import { legacyStackIds, type LegacyStackId } from "src/core/stack/stack.js";

export type PlatformId = "kiro" | "antigravity" | "codex" | "claude";

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

export interface VerifyCommandConfig {
  test?: string;
  lint?: string;
  typecheck?: string;
  format?: string;
  suite?: string;
  [key: string]: unknown;
}

export interface PackageVerifyConfig extends VerifyCommandConfig {
  path: string;
}

export interface VerifyConfig extends VerifyCommandConfig {
  packages?: PackageVerifyConfig[];
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
  /** IANA zone for every persisted timestamp; absent in older configs, which then use the system zone. */
  timezone?: string;
  context: { maxCharacters: number; tokenApproximation: number; [key: string]: unknown };
  runtime: { research: "conditional"; fullContext: boolean; [key: string]: unknown };
  verify?: VerifyConfig;
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
  timezone?: string | undefined;
  verify?: VerifyConfig | undefined;
}

export const languageIds = new Set<LanguageId>(["csharp", "typescript", "javascript", "php", "python", "java", "go"]);

export const technologyIds = new Set<TechnologyId>([
  "dotnet",
  "abp",
  "nestjs",
  "spring",
  "react-web",
  "vue",
  "codeigniter",
  "postgresql",
  "mysql",
  "sqlserver",
  "mongodb",
  "redis",
]);

export const legacyIds = new Set<LegacyStackId>(legacyStackIds);
export const platformIds = new Set<PlatformId>(["kiro", "antigravity", "codex", "claude"]);
export const developerPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u;

export const topLevelKeys = new Set([
  "generator",
  "schemaVersion",
  "developer",
  "languages",
  "technologies",
  "packages",
  "platforms",
  "timezone",
  "context",
  "runtime",
  "verify",
]);

export const packageKeys = new Set(["path", "languages", "technologies"]);
export const contextKeys = new Set(["maxCharacters", "tokenApproximation"]);
export const runtimeKeys = new Set(["research", "fullContext"]);
export const verifyKeys = new Set(["test", "lint", "typecheck", "format", "suite", "packages"]);
export const packageVerifyKeys = new Set(["path", "test", "lint", "typecheck", "format", "suite"]);

export class ConfigValidationError extends Error {
  override name = "ConfigValidationError";
}
