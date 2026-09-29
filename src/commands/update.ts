import { access } from "src/utils/fs-access.js";

import { migrateLegacyEpics } from "src/core/epics/migrate.js";
import { migrateConfig, readConfig, type HarnixConfigV2 } from "src/core/config/config.js";
import { guideOutputPath, selectGuideSources } from "src/guides/catalog.js";
import { workflowTemplate } from "src/templates/harnix/workflow.js";
import {
  reconcileManagedFiles,
  readManifest,
  writeManifest,
  type DesiredManagedFile,
  type ManagedManifest,
} from "src/utils/managed-files.js";
import { sha256 } from "src/utils/hashing.js";
import { packageVersion } from "src/version.js";
import { renderAgentsTemplate } from "src/templates/harnix/agents.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { compareCodeUnits } from "src/utils/order.js";

export interface UpdateProjectOptions {
  root: string;
  restoreDeleted?: boolean | undefined;
}
export interface UpdateProjectResult {
  created: string[];
  updated: string[];
  metadataUpdated: string[];
  preserved: string[];
  deleted: string[];
  obsolete: string[];
}

/** Reconciles complete, Harnix-owned files only. Injection surfaces stay user-owned. */
export async function updateProject(options: UpdateProjectOptions): Promise<UpdateProjectResult> {
  const configPath = await resolveSafeHarnixPath(options.root, "config.yaml");
  const manifestPath = await resolveSafeHarnixPath(options.root, ".template-hashes.json");
  const config = (await migrateConfig(configPath)).config;
  const manifest = await loadManifest(manifestPath);
  const desired = desiredFiles(config);
  const legacyEntries = manifest.entries.filter((entry) => entry.scope !== "project");
  const reconciled = await reconcileManagedFiles(
    options.root,
    { ...manifest, entries: manifest.entries.filter((entry) => entry.scope === "project") },
    desired,
    {
      generatorVersion: packageVersion,
      removeObsolete: true,
      restoreDeleted: options.restoreDeleted,
    },
  );
  await writeManifest(manifestPath, mergeManifestEntries(reconciled.manifest, legacyEntries));
  const epics = await migrateLegacyEpics(options.root);
  return {
    ...reconciled.result,
    created: [...reconciled.result.created, ...epics.created],
    deleted: [...reconciled.result.deleted, ...epics.deleted],
    preserved: [...reconciled.result.preserved, ...epics.preserved],
  };
}

/** Records files immediately after setup has written the exact packaged templates. */
export async function baselineManagedTemplates(root: string): Promise<void> {
  const configPath = await resolveSafeHarnixPath(root, "config.yaml");
  const manifestPath = await resolveSafeHarnixPath(root, ".template-hashes.json");
  const config = await readConfig(configPath);
  const current = await loadManifest(manifestPath);
  const desired = desiredFiles(config);
  const paths = new Set(desired.map((file) => file.entry.path));
  const entries = [
    ...current.entries.filter((entry) => entry.scope !== "project" || !paths.has(entry.path)),
    ...desired.map(({ entry, content }) => ({
      ...entry,
      generatedHash: sha256(content),
      generatorVersion: packageVersion,
    })),
  ].sort((left, right) => compareCodeUnits(left.path, right.path));
  await writeManifest(manifestPath, { generator: "harnix", schemaVersion: 1, entries });
}

/**
 * Phase 6 deliberately ignores platform selection: project update owns project
 * data and the root AGENTS bootstrap, never legacy project-local platform surfaces.
 */
export function desiredFiles(
  config: Pick<HarnixConfigV2, "languages" | "technologies" | "packages">,
): DesiredManagedFile[] {
  return [
    managed("AGENTS.md", "agents-bootstrap", "project", renderAgentsTemplate(config)),
    managed(".harnix/workflow.md", "workflow", "project", workflowTemplate),
    ...selectGuideSources(config).map((source) =>
      managed(guideOutputPath(source), `guide-${source.descriptor.id}`, "project", source.content),
    ),
  ];
}

function managed(
  path: string,
  sourceId: string,
  scope: "project" | "kiro" | "antigravity" | "codex",
  content: string,
): DesiredManagedFile {
  return { entry: { path, sourceId, scope, generatedHash: "0".repeat(64), generatorVersion: packageVersion }, content };
}

function mergeManifestEntries(
  projectManifest: ManagedManifest,
  legacyEntries: ManagedManifest["entries"],
): ManagedManifest {
  return {
    generator: "harnix",
    schemaVersion: 1,
    entries: [...projectManifest.entries, ...legacyEntries].sort((left, right) =>
      compareCodeUnits(left.path, right.path),
    ),
  };
}

async function loadManifest(path: string): Promise<ManagedManifest> {
  try {
    await access(path);
    return await readManifest(path);
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT")
      return { generator: "harnix", schemaVersion: 1, entries: [] };
    throw error;
  }
}
