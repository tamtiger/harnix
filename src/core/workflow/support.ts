import { effectiveTimezone, readProjectTimezone, type HarnixConfigV2 } from "src/core/config/config.js";
import { loadEpicRecord, renderEpicMarkdown } from "src/core/epics/epic.js";
import type { TaskRecord } from "src/core/tasks/task.js";
import { localDate, nowInstant } from "src/utils/clock.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";

/** Current time in the project's configured zone unless the caller injects one. */
export async function currentInstant(root: string, now: string | undefined): Promise<string> {
  return now ?? nowInstant(await readProjectTimezone(await resolveSafeHarnixPath(root)));
}

/** Journal file for an instant: partitioned by the local calendar date of the configured zone. */
export async function journalFilePath(
  root: string,
  config: Pick<HarnixConfigV2, "developer" | "timezone">,
  instant: string,
): Promise<string> {
  return resolveSafeHarnixPath(
    root,
    `workspace/${config.developer}/journal/${localDate(instant, effectiveTimezone(config))}.jsonl`,
  );
}

/**
 * `finishWorkflowTask`/`cancelWorkflowTask` persist the terminal record via
 * the low-level `saveTask`, not `saveWorkflowLocked`, so they never go
 * through the epic-refresh step that a normal `--save` triggers. Without
 * this, a task's epic entry would freeze at its last pre-terminal status.
 */
export async function refreshLinkedEpicMarkdown(root: string, task: TaskRecord): Promise<void> {
  if (task.schemaVersion === 1 || task.epicId === undefined) return;
  const epic = await loadEpicRecord(root, task.epicId);
  await renderEpicMarkdown(root, task.epicId, epic);
}
