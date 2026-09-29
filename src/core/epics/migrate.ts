import { readFile, readdir, rm, rmdir } from "node:fs/promises";

import { atomicWriteFile } from "../../utils/atomic-write.js";
import { compareCodeUnits } from "../../utils/order.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "../../utils/paths.js";
import { EPICS_DIRECTORY, LEGACY_EPICS_DIRECTORY, renderEpicMarkdown, validateEpic } from "./epic.js";

export interface EpicMigrationResult {
  /** Repository-relative paths written under `.harnix/epics/`. */
  created: string[];
  /** Legacy `.harnix/roadmaps/` files removed after their content was safely present in `.harnix/epics/`. */
  deleted: string[];
  /** Legacy files left in place: invalid records or a different file already at the destination. */
  preserved: string[];
}

/**
 * Moves `.harnix/roadmaps/<id>.json` to `.harnix/epics/<id>.json` and regenerates the derived page.
 * Idempotent, and never deletes a legacy file until an identical copy exists at the destination.
 */
export async function migrateLegacyEpics(root: string): Promise<EpicMigrationResult> {
  const result: EpicMigrationResult = { created: [], deleted: [], preserved: [] };
  const harnixRoot = await resolveSafeHarnixPath(root);
  const legacyDirectory = await resolveSafeProjectPath(harnixRoot, LEGACY_EPICS_DIRECTORY);
  let names: string[];
  try { names = (await readdir(legacyDirectory)).filter((name) => name.endsWith(".json")).sort(compareCodeUnits); }
  catch { return result; }

  for (const name of names) {
    const epicId = name.slice(0, -".json".length);
    const legacyPath = await resolveSafeProjectPath(harnixRoot, `${LEGACY_EPICS_DIRECTORY}/${name}`);
    const targetPath = await resolveSafeProjectPath(harnixRoot, `${EPICS_DIRECTORY}/${name}`);
    const legacyRelative = `.harnix/${LEGACY_EPICS_DIRECTORY}/${name}`;
    let content: string;
    let epic;
    try {
      content = await readFile(legacyPath, "utf8");
      epic = validateEpic(JSON.parse(content));
    } catch {
      result.preserved.push(legacyRelative);
      continue;
    }

    let targetContent: string | undefined;
    try { targetContent = await readFile(targetPath, "utf8"); }
    catch { targetContent = undefined; }
    if (targetContent !== undefined && targetContent !== content) {
      result.preserved.push(legacyRelative);
      continue;
    }
    if (targetContent === undefined) {
      await atomicWriteFile(targetPath, content);
      if (await readFile(targetPath, "utf8") !== content) throw new Error(`Epic migration could not verify ${epicId}.`);
      result.created.push(`.harnix/${EPICS_DIRECTORY}/${name}`);
    }
    await renderEpicMarkdown(root, epicId, epic);
    await rm(legacyPath);
    result.deleted.push(legacyRelative);
    const legacyPage = await resolveSafeProjectPath(harnixRoot, `${LEGACY_EPICS_DIRECTORY}/${epicId}.md`);
    await rm(legacyPage, { force: true });
  }
  try { await rmdir(legacyDirectory); } catch { /* not empty or already gone: keep whatever remains */ }
  return result;
}
