import { mkdir, readFile, readdir, rm, rmdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

import { atomicWriteFile } from "src/utils/atomic-write.js";
import { compareCodeUnits } from "src/utils/order.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";
import { EPICS_DIRECTORY, LEGACY_EPICS_DIRECTORY, epicFolder } from "./epic-location.js";
import { renderEpicMarkdown, validateEpic } from "./epic.js";

export interface EpicMigrationResult {
  /** Repository-relative paths written under `.harnix/epics/`. */
  created: string[];
  /** Legacy `.harnix/roadmaps/` files removed after their content was safely present in `.harnix/epics/`. */
  deleted: string[];
  /** Legacy files left in place: invalid records or a different file already at the destination. */
  preserved: string[];
}

/**
 * Moves `.harnix/roadmaps/<id>.json` and flat `.harnix/epics/<id>.json` to `.harnix/epics/<id>/epic.json`
 * and regenerates the derived page. Idempotent, and never deletes a legacy file until an identical copy exists.
 */
export async function migrateLegacyEpics(root: string): Promise<EpicMigrationResult> {
  const result: EpicMigrationResult = { created: [], deleted: [], preserved: [] };
  const harnixRoot = await resolveSafeHarnixPath(root);

  async function migrateFile(sourceDir: string, name: string): Promise<void> {
    const epicId = name.slice(0, -".json".length);
    const legacyPath = await resolveSafeProjectPath(harnixRoot, `${sourceDir}/${name}`);
    const targetPath = join(await epicFolder(harnixRoot, epicId), "epic.json");
    const legacyRelative = `.harnix/${sourceDir}/${name}`;
    const targetRelative = `.harnix/${relative(harnixRoot, targetPath).replaceAll("\\", "/")}`;

    let content: string;
    let epic;
    try {
      content = await readFile(legacyPath, "utf8");
      epic = validateEpic(JSON.parse(content));
    } catch {
      result.preserved.push(legacyRelative);
      return;
    }

    let targetContent: string | undefined;
    try {
      targetContent = await readFile(targetPath, "utf8");
    } catch {
      targetContent = undefined;
    }
    if (targetContent !== undefined && targetContent !== content) {
      result.preserved.push(legacyRelative);
      return;
    }
    if (targetContent === undefined) {
      await mkdir(dirname(targetPath), { recursive: true });
      await atomicWriteFile(targetPath, content);
      if ((await readFile(targetPath, "utf8")) !== content)
        throw new Error(`Epic migration could not verify ${epicId}.`);
      result.created.push(targetRelative);
    }
    await renderEpicMarkdown(root, epicId, epic);
    await rm(legacyPath);
    result.deleted.push(legacyRelative);
    const legacyPage = await resolveSafeProjectPath(harnixRoot, `${sourceDir}/${epicId}.md`);
    await rm(legacyPage, { force: true });
  }

  // 1. Migrate legacy roadmaps/
  try {
    const legacyDirectory = await resolveSafeProjectPath(harnixRoot, LEGACY_EPICS_DIRECTORY);
    const names = (await readdir(legacyDirectory)).filter((name) => name.endsWith(".json")).sort(compareCodeUnits);
    for (const name of names) {
      await migrateFile(LEGACY_EPICS_DIRECTORY, name);
    }
    try {
      await rmdir(legacyDirectory);
    } catch {
      /* not empty or already gone: keep whatever remains */
    }
  } catch {
    /* missing legacy directory */
  }

  // 2. Migrate flat epics/ files
  try {
    const epicsDirectory = await resolveSafeProjectPath(harnixRoot, EPICS_DIRECTORY);
    const entries = await readdir(epicsDirectory, { withFileTypes: true });
    const flatFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort(compareCodeUnits);
    for (const name of flatFiles) {
      await migrateFile(EPICS_DIRECTORY, name);
    }
  } catch {
    /* missing epics directory */
  }

  return result;
}
