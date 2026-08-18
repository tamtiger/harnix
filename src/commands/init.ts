import type { DetectionMatch, LanguageId, TechnologyId } from "../catalog/catalog.js";
import { stackCatalog } from "../catalog/catalog.js";
import { createConfig, readConfig, writeConfig } from "../core/config/config.js";
import { refreshRepoMap } from "../core/repo-map/service.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "../utils/paths.js";
import { detectProject } from "../utils/detection.js";
import { writeManifest } from "../utils/managed-files.js";
import { pathExists } from "../utils/filesystem.js";
import { normalizeLegacyStackIds, legacyStackIds, type LegacyStackId } from "../utils/stack.js";
import { compareCodeUnits } from "../utils/order.js";
import { desiredFiles, updateProject } from "./update.js";

export interface InitializeProjectOptions {
  root: string;
  developer: string;
  yes?: boolean | undefined;
  dryRun?: boolean | undefined;
  languages?: LanguageId[] | undefined;
  technologies?: TechnologyId[] | undefined;
  warnings?: string[] | undefined;
}

export interface InitializeProjectResult {
  scope: "project";
  status: "initialized" | "already-initialized" | "planned";
  developer: string;
  languages: LanguageId[];
  technologies: TechnologyId[];
  detection: { matches: DetectionMatch[] };
  created: string[];
  updated: string[];
  unchanged: string[];
  preserved: string[];
  warnings: string[];
}

export interface ParsedInitProfile {
  languages?: LanguageId[] | undefined;
  technologies?: TechnologyId[] | undefined;
  warnings: string[];
}

const languageIds: ReadonlySet<string> = new Set(stackCatalog.languages.map(({ id }) => id));
const technologyIds: ReadonlySet<string> = new Set(stackCatalog.technologies.map(({ id }) => id));
const legacyIds: ReadonlySet<string> = new Set(legacyStackIds);

export function parseInitProfile(languageCsv?: string, technologyCsv?: string): ParsedInitProfile {
  const requestedLanguages = csv(languageCsv), requestedTechnologies = csv(technologyCsv);
  const legacy = requestedLanguages.filter(isLegacyStackId);
  const invalidLanguages = requestedLanguages.filter((id) => !isLanguageId(id) && !isLegacyStackId(id));
  const invalidTechnologies = requestedTechnologies.filter((id) => !isTechnologyId(id));
  if (invalidLanguages.length > 0) throw new Error(`Unknown language ID: ${invalidLanguages.join(", ")}.`);
  if (invalidTechnologies.length > 0) throw new Error(`Unknown technology ID: ${invalidTechnologies.join(", ")}.`);
  const mapped = normalizeLegacyStackIds(legacy);
  const languages = requestedLanguages.length === 0 ? undefined : sorted([...requestedLanguages.filter(isLanguageId), ...mapped.languages]);
  const technologies = requestedTechnologies.length === 0 && legacy.length === 0 ? undefined : sorted([...requestedTechnologies.filter(isTechnologyId), ...mapped.technologies]);
  return { languages, technologies, warnings: legacy.length === 0 ? [] : [`Legacy --languages IDs were normalized: ${legacy.join(", ")}.`] };
}

export async function initializeProject(options: InitializeProjectOptions): Promise<InitializeProjectResult> {
  const configPath = await resolveSafeHarnixPath(options.root, "config.yaml");
  if (await pathExists(configPath)) {
    const config = await readConfig(configPath);
    return result("already-initialized", config, [], { unchanged: [".harnix/config.yaml"] }, ["Project is already initialized; run 'harnix update' to reconcile managed files."]);
  }

  const detection = await detectProject(options.root);
  const config = createConfig({
    developer: options.developer,
    languages: options.languages ?? detection.languages,
    technologies: options.technologies ?? detection.technologies,
    packages: detection.packages.map(({ languages, path, technologies }) => ({ languages, path, technologies })),
  });
  const warnings = [
    ...(options.warnings ?? []),
    ...(options.languages === undefined ? [] : ["Language detection was overridden by --languages."]),
    ...(options.technologies === undefined ? [] : ["Technology detection was overridden by --technologies or a legacy alias."]),
  ];
  const manifestPath = await resolveSafeHarnixPath(options.root, ".template-hashes.json");
  const manifestExists = await pathExists(manifestPath);
  const desired = desiredFiles(config);
  await Promise.all(desired.map(({ entry }) => resolveSafeProjectPath(options.root, entry.path)));

  if (options.dryRun) {
    const planned = await classifyDesiredPaths(options.root, desired.map(({ entry }) => entry.path));
    return result("planned", config, detection.matches, { created: [".harnix/config.yaml", ".harnix/cache/repo-map-v1.json", ...(!manifestExists ? [".harnix/.template-hashes.json"] : []), ...planned.created], preserved: [...(manifestExists ? [".harnix/.template-hashes.json"] : []), ...planned.preserved] }, warnings);
  }

  await writeConfig(configPath, config);
  if (!manifestExists) await writeManifest(manifestPath, { generator: "harnix", schemaVersion: 1, entries: [] });
  const reconciled = await updateProject({ root: options.root });
  await refreshRepoMap({ root: options.root });
  return result("initialized", config, detection.matches, { created: [".harnix/cache/repo-map-v1.json", ".harnix/config.yaml", ...(!manifestExists ? [".harnix/.template-hashes.json"] : []), ...reconciled.created], updated: [...(manifestExists ? [".harnix/.template-hashes.json"] : []), ...reconciled.updated], preserved: reconciled.preserved }, warnings);
}

function result(status: InitializeProjectResult["status"], config: { developer: string; languages: LanguageId[]; technologies: TechnologyId[] }, matches: DetectionMatch[], paths: Partial<Pick<InitializeProjectResult, "created" | "updated" | "unchanged" | "preserved">>, warnings: string[]): InitializeProjectResult {
  return { scope: "project", status, developer: config.developer, languages: config.languages, technologies: config.technologies, detection: { matches }, created: sorted(paths.created ?? []), updated: sorted(paths.updated ?? []), unchanged: sorted(paths.unchanged ?? []), preserved: sorted(paths.preserved ?? []), warnings };
}

function csv(value?: string): string[] { return value === undefined || value.trim() === "" ? [] : sorted(value.split(",").map((item) => item.trim()).filter(Boolean)); }
function isLanguageId(value: string): value is LanguageId { return languageIds.has(value); }
function isTechnologyId(value: string): value is TechnologyId { return technologyIds.has(value); }
function isLegacyStackId(value: string): value is LegacyStackId { return legacyIds.has(value); }
function sorted<T extends string>(values: readonly T[]): T[] { return [...new Set(values)].sort(compareCodeUnits); }
async function classifyDesiredPaths(root: string, paths: string[]): Promise<{ created: string[]; preserved: string[] }> { const items = await Promise.all(paths.map(async (path) => ({ exists: await pathExists(await resolveSafeProjectPath(root, path)), path }))); return { created: items.filter(({ exists }) => !exists).map(({ path }) => path), preserved: items.filter(({ exists }) => exists).map(({ path }) => path) }; }
