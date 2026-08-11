import { lstat, readFile, rm } from "node:fs/promises";

import { sha256 } from "../utils/hashing.js";
import { readManifest, writeManifest, type ManagedEntry, type ManagedManifest } from "../utils/managed-files.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "../utils/paths.js";

export interface CleanupLegacyProjectSurfacesOptions {
  root: string;
  yes?: boolean | undefined;
}

export interface CleanupLegacyProjectSurfacesResult {
  scope: "legacy-project-surfaces";
  targets: string[];
  removed: string[];
  preserved: string[];
  confirmationRequired: boolean;
}

type LegacyTargetState = "unchanged" | "modified" | "deleted" | "unsafe" | "non-regular";

interface InspectedLegacyTarget {
  entry: ManagedEntry;
  absolutePath?: string;
  state: LegacyTargetState;
}

/**
 * Removes only legacy project-local files that the project manifest proves
 * Harnix generated. It deliberately never infers ownership from filenames,
 * markers, or hook contents.
 */
export async function cleanupLegacyProjectSurfaces(
  options: CleanupLegacyProjectSurfacesOptions,
): Promise<CleanupLegacyProjectSurfacesResult> {
  const manifestPath = await resolveSafeHarnixPath(options.root, ".template-hashes.json");
  const manifest = await readOptionalManifest(manifestPath);
  const legacyEntries = (manifest?.entries ?? []).filter(isCanonicalLegacyProjectSurface);
  const targets = legacyEntries.map((entry) => entry.path).sort((left, right) => left.localeCompare(right));

  if (!options.yes) {
    return {
      scope: "legacy-project-surfaces",
      targets,
      removed: [],
      preserved: [],
      confirmationRequired: true,
    };
  }

  const inspected = await Promise.all(legacyEntries.map(async (entry) => inspectLegacyTarget(options.root, entry)));
  const removed: string[] = [];
  const preserved: string[] = [];

  for (const target of inspected) {
    if (target.state !== "unchanged") {
      pushUnique(preserved, target.entry.path);
      continue;
    }

    const rechecked = await inspectLegacyTarget(options.root, target.entry);
    if (rechecked.state !== "unchanged" || rechecked.absolutePath === undefined) {
      pushUnique(preserved, target.entry.path);
      continue;
    }
    try {
      await rm(rechecked.absolutePath);
      pushUnique(removed, target.entry.path);
    } catch {
      // An editor, file watcher, or platform process may have changed the path
      // after recheck. Preserve it rather than making a destructive assumption.
      pushUnique(preserved, target.entry.path);
    }
  }

  if (manifest !== undefined && removed.length > 0) {
    const removedPaths = new Set(removed);
    await writeManifest(manifestPath, {
      generator: "harnix",
      schemaVersion: 1,
      entries: manifest.entries.filter((entry) => !removedPaths.has(entry.path)),
    });
  }

  return {
    scope: "legacy-project-surfaces",
    targets,
    removed: removed.sort((left, right) => left.localeCompare(right)),
    preserved: preserved.sort((left, right) => left.localeCompare(right)),
    confirmationRequired: false,
  };
}

/**
 * A project manifest is inventory, not a blanket deletion capability.  Phase
 * 1–5 only owned these standalone platform files outright.  Shared surfaces
 * such as root AGENTS.md, GEMINI.md, .codex/hooks.json, and
 * .codex/config.toml were merged structurally (or are an init bootstrap), so
 * a whole-file hash must never authorize deleting them here.
 *
 * Keep the scope-to-root mapping explicit as well: an otherwise valid-looking
 * Codex entry cannot claim a Kiro path, and a non-project entry cannot expand
 * legacy cleanup to arbitrary project files.
 */
function isCanonicalLegacyProjectSurface(entry: ManagedEntry): boolean {
  switch (entry.scope) {
    case "kiro":
      return isLegacySkill(entry, ".kiro/skills")
        || (entry.path === ".kiro/steering/harnix.md" && entry.sourceId === "kiro-steering")
        || (entry.path === ".kiro/hooks/harnix-context.kiro.hook" && entry.sourceId === "kiro-context-hook");
    case "antigravity":
      return isLegacySkill(entry, ".gemini/skills");
    case "codex":
      return isLegacySkill(entry, ".agents/skills");
    case "project":
      return false;
  }
}

function isLegacySkill(entry: ManagedEntry, root: ".kiro/skills" | ".gemini/skills" | ".agents/skills"): boolean {
  return entry.sourceId.startsWith("harnix-")
    && entry.path === `${root}/${entry.sourceId}/SKILL.md`;
}

async function readOptionalManifest(path: string): Promise<ManagedManifest | undefined> {
  try {
    return await readManifest(path);
  } catch (error: unknown) {
    if (isMissingPathError(error)) {
      return undefined;
    }
    throw error;
  }
}

async function inspectLegacyTarget(root: string, entry: ManagedEntry): Promise<InspectedLegacyTarget> {
  let absolutePath: string;
  try {
    absolutePath = await resolveSafeProjectPath(root, entry.path);
  } catch {
    return { entry, state: "unsafe" };
  }
  try {
    const metadata = await lstat(absolutePath);
    if (!metadata.isFile()) {
      return { entry, absolutePath, state: "non-regular" };
    }
    const content = await readFile(absolutePath, "utf8");
    return { entry, absolutePath, state: sha256(content) === entry.generatedHash ? "unchanged" : "modified" };
  } catch (error: unknown) {
    if (isMissingPathError(error)) {
      return { entry, absolutePath, state: "deleted" };
    }
    return { entry, absolutePath, state: "unsafe" };
  }
}

function isMissingPathError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function pushUnique(values: string[], value: string): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}
