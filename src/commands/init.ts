import { access, mkdir } from "node:fs/promises";

import { createConfig, writeConfig } from "../core/config/config.js";
import { detectProject, type LanguageId } from "../utils/detection.js";
import { atomicWriteFile } from "../utils/atomic-write.js";
import { sha256 } from "../utils/hashing.js";
import { workflowTemplate } from "../templates/harnix/workflow.js";
import { updateProject } from "./update.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "../utils/paths.js";
import { packageVersion } from "../version.js";

export interface InitializeProjectOptions {
  root: string;
  developer: string;
  yes: boolean;
  dryRun?: boolean | undefined;
  languages?: LanguageId[] | undefined;
}

export interface InitializeProjectResult {
  created: boolean;
  legacyMarkers: string[];
}

export async function initializeProject(options: InitializeProjectOptions): Promise<InitializeProjectResult> {
  const legacyMarkers: string[] = [];
  if (options.dryRun) {
    return { created: false, legacyMarkers };
  }

  const configPath = await resolveSafeHarnixPath(options.root, "config.yaml");
  if (await pathExists(configPath)) {
    return { created: false, legacyMarkers };
  }

  const detection = await detectProject(options.root);
  const config = createConfig({
    developer: options.developer,
    languages: options.languages ?? detection.languages,
    packages: detection.packages.map(({ languages, path }) => ({ languages, path })),
  });
  await resolveSafeProjectPath(options.root, "AGENTS.md");
  const [guidesPath, tasksPath, workspacePath, developerPath, workflowPath, manifestPath] = await Promise.all([
    resolveSafeHarnixPath(options.root, "spec/guides"),
    resolveSafeHarnixPath(options.root, "tasks"),
    resolveSafeHarnixPath(options.root, `workspace/${options.developer}`),
    resolveSafeHarnixPath(options.root, ".developer"),
    resolveSafeHarnixPath(options.root, "workflow.md"),
    resolveSafeHarnixPath(options.root, ".template-hashes.json"),
  ]);
  await Promise.all([
    mkdir(guidesPath, { recursive: true }),
    mkdir(tasksPath, { recursive: true }),
    mkdir(workspacePath, { recursive: true }),
  ]);
  await Promise.all([
    writeConfig(configPath, config),
    atomicWriteFile(developerPath, `${options.developer}\n`),
    atomicWriteFile(workflowPath, workflowTemplate),
    atomicWriteFile(manifestPath, `${JSON.stringify({ generator: "harnix", schemaVersion: 1, entries: [{ path: ".harnix/workflow.md", sourceId: "harnix-workflow", scope: "project", generatedHash: sha256(workflowTemplate), generatorVersion: packageVersion }] }, null, 2)}\n`),
  ]);
  await updateProject({ root: options.root });
  return { created: true, legacyMarkers };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}



