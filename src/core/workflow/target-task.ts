import { AsyncLocalStorage } from "node:async_hooks";
import { loadTask, resolveActiveTask, type TaskRecord } from "src/core/tasks/task.js";
import { isMissing } from "src/core/tasks/workflow-helpers.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";

const TASK_ID = /^\d{8}-\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const targets = new AsyncLocalStorage<{ id: string }>();

/**
 * Runs `run` with `--task <id>` selected: every edit transport and `saveWorkflow` called inside then act on that task
 * instead of the active one, through the same code and rules, and the active pointer is never written.
 */
export function withTargetTask<T>(id: string | undefined, run: () => Promise<T>): Promise<T> {
  return id === undefined ? run() : targets.run({ id }, run);
}

export const targetTaskId = (): string | undefined => targets.getStore()?.id;

/** The `--task` target when one is selected (it must exist and not be terminal), otherwise the active task. */
export async function resolveEditableTask(harnixRoot: string): Promise<TaskRecord | undefined> {
  const id = targetTaskId();
  if (id === undefined) return resolveActiveTask(harnixRoot);
  if (!TASK_ID.test(id)) throw new Error(`--task must be a task id (YYYYMMDD-HHMMSS-slug), not ${id}.`);
  let task: TaskRecord;
  try {
    task = await loadTask(await resolveSafeProjectPath(harnixRoot, `tasks/${id}/task.json`));
  } catch (error: unknown) {
    if (isMissing(error)) throw new Error(`--task ${id}: task not found.`, { cause: error });
    throw error;
  }
  if (task.status === "completed" || task.status === "cancelled")
    throw new Error(`--task ${id} is ${task.status}; a terminal task cannot be edited.`);
  return task;
}
