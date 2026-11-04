import { readFile } from "node:fs/promises";

import { validateTask } from "src/core/tasks/task.js";
import { listTaskIds, taskFilePath } from "src/core/tasks/task-location.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";

type ValidTask = ReturnType<typeof validateTask>;

/**
 * Valid task records of the read-only `_archive` store, keyed by id. Doctor only needs them to tell a journal that
 * points at an archived task from one that points at nothing, so an unreadable or invalid archived record is skipped
 * (the journal is then reported as unlinked) and nothing is ever written.
 */
export async function readArchivedTasks(root: string): Promise<Map<string, ValidTask>> {
  const archived = new Map<string, ValidTask>();
  const harnixRoot = await resolveSafeHarnixPath(root);
  let ids: string[];
  try {
    ids = await listTaskIds(harnixRoot, { scope: "archive" });
  } catch {
    return archived;
  }
  for (const id of ids) {
    try {
      const path = await taskFilePath(harnixRoot, id, "task.json");
      const task = validateTask(JSON.parse(await readFile(path, "utf8")) as unknown, {
        allowUnsafeCompletedEvidenceArtifacts: true,
      });
      archived.set(task.id, task);
    } catch {
      continue;
    }
  }
  return archived;
}
