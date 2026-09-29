import { readFile } from "node:fs/promises";
import { parse, stringify } from "yaml";

import { normalizeLegacyStackIds } from "src/core/stack/stack.js";
import { atomicWriteFile } from "src/utils/atomic-write.js";
import { systemTimezone } from "src/utils/clock.js";
import {
  ConfigValidationError,
  contextKeys,
  packageKeys,
  runtimeKeys,
  topLevelKeys,
  type ConfigDocument,
  type CreateConfigOptions,
  type HarnixConfig,
  type HarnixConfigV1,
  type HarnixConfigV2,
  type LegacyPackageConfig,
  type PackageConfig,
  type PackageVerifyConfig,
  type PlatformId,
  type VerifyCommandConfig,
  type VerifyConfig,
} from "./config-schema.js";
import {
  isMissingFile,
  isRecord,
  normalizePackages,
  sortUnique,
  unknownEntries,
  validateConfig,
  validateConfigV1,
  validateDeveloperId,
} from "./config-validate.js";

export {
  ConfigValidationError,
  validateConfig,
  validateConfigV1,
  validateDeveloperId,
  type ConfigDocument,
  type CreateConfigOptions,
  type HarnixConfig,
  type HarnixConfigV1,
  type HarnixConfigV2,
  type LegacyPackageConfig,
  type PackageConfig,
  type PackageVerifyConfig,
  type PlatformId,
  type VerifyCommandConfig,
  type VerifyConfig,
};

export function createConfig(options: CreateConfigOptions): HarnixConfigV2 {
  const base: Record<string, unknown> = {
    context: { maxCharacters: 24000, tokenApproximation: 4 },
    developer: options.developer,
    generator: "harnix",
    languages: sortUnique(options.languages ?? []),
    technologies: sortUnique(options.technologies ?? []),
    packages: normalizePackages(options.packages ?? []),
    platforms: sortUnique(options.platforms ?? []),
    runtime: { fullContext: false, research: "conditional" },
    schemaVersion: 2,
    timezone: options.timezone ?? systemTimezone(),
  };
  if (options.verify !== undefined) {
    base.verify = options.verify;
  }
  return validateConfig(base);
}

/** Configured zone, or the system zone for configs written before `timezone` existed. */
export function effectiveTimezone(config: Pick<HarnixConfigV2, "timezone">): string {
  return config.timezone ?? systemTimezone();
}

/** Best-effort zone for a project's `.harnix` root; an unreadable config never blocks writing task files. */
export async function readProjectTimezone(harnixRoot: string): Promise<string> {
  try {
    return effectiveTimezone(await readConfig(`${harnixRoot}/config.yaml`));
  } catch {
    return systemTimezone();
  }
}

export async function readConfigDocument(path: string): Promise<ConfigDocument> {
  let value: unknown;
  try {
    value = parse(await readFile(path, "utf8"));
  } catch (error: unknown) {
    if (isMissingFile(error)) throw error;
    throw new ConfigValidationError("Harnix config YAML is invalid.");
  }
  if (!isRecord(value) || value.generator !== "harnix")
    throw new ConfigValidationError("Unsupported Harnix config generator or schema version.");
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

export async function migrateConfig(
  path: string,
): Promise<{ status: "migrated" | "unchanged"; config: HarnixConfigV2 }> {
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
    context: {
      maxCharacters: value.context.maxCharacters,
      tokenApproximation: value.context.tokenApproximation,
      ...unknownEntries(value.context, contextKeys),
    },
    runtime: {
      research: value.runtime.research,
      fullContext: value.runtime.fullContext,
      ...unknownEntries(value.runtime, runtimeKeys),
    },
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
    packages: value.packages.map((item) => ({
      path: item.path,
      languages: item.languages,
      technologies: item.technologies,
      ...unknownEntries(item, packageKeys),
    })),
    platforms: value.platforms,
    ...(value.timezone === undefined ? {} : { timezone: value.timezone }),
    context: {
      maxCharacters: value.context.maxCharacters,
      tokenApproximation: value.context.tokenApproximation,
      ...unknownEntries(value.context, contextKeys),
    },
    runtime: {
      research: value.runtime.research,
      fullContext: value.runtime.fullContext,
      ...unknownEntries(value.runtime, runtimeKeys),
    },
    ...(value.verify === undefined ? {} : { verify: value.verify }),
    ...unknownEntries(value, topLevelKeys),
  };
}
