import { access, mkdir } from "node:fs/promises";
import { join } from "node:path";

import { createConfig, writeConfig } from "../core/config/config.js";
import { detectProject, type LanguageId } from "../utils/detection.js";
import { atomicWriteFile } from "../utils/atomic-write.js";
import { discoverLegacy } from "../migration/discovery.js";
import { sha256 } from "../utils/hashing.js";
import { workflowTemplate } from "../templates/harnix/workflow.js";
import { migrateLegacyProject } from "../migration/migrate.js";
import { updateProject } from "./update.js";
import { resolveSafeProjectPath } from "../utils/paths.js";
import { packageVersion } from "../version.js";

export interface InitializeProjectOptions {
  root: string;
  developer: string;
  yes: boolean;
  migrate?: boolean | undefined;
  dryRun?: boolean | undefined;
  languages?: LanguageId[] | undefined;
}

export interface InitializeProjectResult {
  created: boolean;
  legacyMarkers: string[];
}

export async function initializeProject(options: InitializeProjectOptions): Promise<InitializeProjectResult> {
  const legacyMarkers = await discoverLegacy(options.root);
  if (legacyMarkers.length > 0 && !options.migrate) {
    return { created: false, legacyMarkers };
  }
  if (options.dryRun) {
    return { created: false, legacyMarkers };
  }
  if (legacyMarkers.length > 0 && options.migrate) {
    const migrated = await migrateLegacyProject({ root: options.root, developer: options.developer, apply: true });
    if (migrated.activated) await updateProject({ root: options.root });
    return { created: migrated.activated, legacyMarkers };
  }

  const harnixRoot = join(options.root, ".harnix");
  const configPath = join(harnixRoot, "config.yaml");
  if (await pathExists(configPath)) {
    return { created: false, legacyMarkers };
  }

  const detection = await detectProject(options.root);
  const config = createConfig({
    developer: options.developer,
    languages: options.languages ?? detection.languages,
    packages: detection.packages.map(({ languages, path }) => ({ languages, path })),
  });
  for (const path of ["AGENTS.md", ".harnix/spec/guides", ".harnix/tasks", `.harnix/workspace/${options.developer}`, ".harnix/config.yaml", ".harnix/.developer", ".harnix/workflow.md", ".harnix/.template-hashes.json"]) await resolveSafeProjectPath(options.root, path);
  await Promise.all([
    mkdir(join(harnixRoot, "spec", "guides"), { recursive: true }),
    mkdir(join(harnixRoot, "tasks"), { recursive: true }),
    mkdir(join(harnixRoot, "workspace", options.developer), { recursive: true }),
  ]);
  await Promise.all([
    writeConfig(configPath, config),
    atomicWriteFile(join(harnixRoot, ".developer"), `${options.developer}\n`),
    atomicWriteFile(join(harnixRoot, "workflow.md"), workflowTemplate),
    atomicWriteFile(join(harnixRoot, ".template-hashes.json"), `${JSON.stringify({ generator: "harnix", schemaVersion: 1, entries: [{ path: ".harnix/workflow.md", sourceId: "harnix-workflow", scope: "project", generatedHash: sha256(workflowTemplate), generatorVersion: packageVersion }] }, null, 2)}\n`),
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



