import type { ContextDrift } from "src/core/context/context.js";
import { resolveActiveTask, type TaskRecord } from "src/core/tasks/task.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { taskContextDrift } from "./context.js";

/** Hidden transport for agents; it preserves TaskRecord state and is deliberately JSON-only. */
export async function inspectWorkflow(
  root: string,
): Promise<{ activeTask: TaskRecord | null; contextDrift: ContextDrift }> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const activeTask = (await resolveActiveTask(harnixRoot)) ?? null;
  return {
    activeTask,
    contextDrift:
      activeTask === null
        ? { state: "not-recorded", changes: [], selectionChanges: [] }
        : await taskContextDrift(root, harnixRoot, activeTask),
  };
}
