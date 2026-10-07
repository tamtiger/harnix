import type { ContextDrift } from "src/core/context/context.js";
import type { TaskRecord } from "src/core/tasks/task.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { taskContextDrift } from "./context.js";
import { resolveEditableTask } from "./target-task.js";

/**
 * Hidden transport for agents; it preserves TaskRecord state and is deliberately JSON-only. With `--task <id>` it reads
 * that unfinished task instead of the active one, without ever touching the active pointer.
 */
export async function inspectWorkflow(
  root: string,
): Promise<{ activeTask: TaskRecord | null; contextDrift: ContextDrift }> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const activeTask = (await resolveEditableTask(harnixRoot)) ?? null;
  return {
    activeTask,
    contextDrift:
      activeTask === null
        ? { state: "not-recorded", changes: [], selectionChanges: [] }
        : await taskContextDrift(root, harnixRoot, activeTask),
  };
}
