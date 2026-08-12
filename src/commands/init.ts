import { access } from "node:fs/promises";

import { createConfig, readConfig, writeConfig } from "../core/config/config.js";
import { detectProject, type LanguageId } from "../utils/detection.js";
import { writeManifest } from "../utils/managed-files.js";
import { desiredFiles, updateProject } from "./update.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "../utils/paths.js";

export interface InitializeProjectOptions {
  root: string;
  developer: string;
  /** @deprecated Init is non-destructive and no longer needs confirmation. */
  yes?: boolean | undefined;
  dryRun?: boolean | undefined;
  languages?: LanguageId[] | undefined;
}

export interface InitializeProjectResult {
  scope: "project";
  status: "initialized" | "already-initialized" | "planned";
  developer: string;
  languages: LanguageId[];
  created: string[];
  updated: string[];
  unchanged: string[];
  preserved: string[];
  warnings: string[];
}

export async function initializeProject(options: InitializeProjectOptions): Promise<InitializeProjectResult> {
  const configPath = await resolveSafeHarnixPath(options.root, "config.yaml");
  if (await pathExists(configPath)) {
    const config = await readConfig(configPath);
    return {
      scope: "project",
      status: "already-initialized",
      developer: config.developer,
      languages: config.languages,
      created: [],
      updated: [],
      unchanged: [".harnix/config.yaml"],
      preserved: [],
      warnings: ["Project is already initialized; run 'harnix update' to reconcile managed files."],
    };
  }

  const detection = await detectProject(options.root);
  const config = createConfig({
    developer: options.developer,
    languages: options.languages ?? detection.languages,
    packages: detection.packages.map(({ languages, path }) => ({ languages, path })),
  });
  const manifestPath = await resolveSafeHarnixPath(options.root, ".template-hashes.json");
  const manifestExists = await pathExists(manifestPath);
  const desired = desiredFiles(config);
  await Promise.all(desired.map(({ entry }) => resolveSafeProjectPath(options.root, entry.path)));

  if (options.dryRun) {
    const planned = await classifyDesiredPaths(options.root, desired.map(({ entry }) => entry.path));
    return result("planned", config.developer, config.languages, {
      created: [".harnix/config.yaml", ...(!manifestExists ? [".harnix/.template-hashes.json"] : []), ...planned.created],
      preserved: [...(manifestExists ? [".harnix/.template-hashes.json"] : []), ...planned.preserved],
    });
  }

  await writeConfig(configPath, config);
  if (!manifestExists) {
    await writeManifest(manifestPath, { generator: "harnix", schemaVersion: 1, entries: [] });
  }
  const reconciled = await updateProject({ root: options.root });
  return result("initialized", config.developer, config.languages, {
    created: [".harnix/config.yaml", ...(!manifestExists ? [".harnix/.template-hashes.json"] : []), ...reconciled.created],
    updated: [...(manifestExists ? [".harnix/.template-hashes.json"] : []), ...reconciled.updated],
    preserved: reconciled.preserved,
  });
}

function result(
  status: InitializeProjectResult["status"],
  developer: string,
  languages: LanguageId[],
  paths: Partial<Pick<InitializeProjectResult, "created" | "updated" | "unchanged" | "preserved">>,
): InitializeProjectResult {
  return {
    scope: "project",
    status,
    developer,
    languages,
    created: [...(paths.created ?? [])].sort(),
    updated: [...(paths.updated ?? [])].sort(),
    unchanged: [...(paths.unchanged ?? [])].sort(),
    preserved: [...(paths.preserved ?? [])].sort(),
    warnings: [],
  };
}

async function classifyDesiredPaths(root: string, paths: string[]): Promise<{ created: string[]; preserved: string[] }> {
  const classified = await Promise.all(paths.map(async (path) => ({ exists: await pathExists(await resolveSafeProjectPath(root, path)), path })));
  return {
    created: classified.filter(({ exists }) => !exists).map(({ path }) => path),
    preserved: classified.filter(({ exists }) => exists).map(({ path }) => path),
  };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}



