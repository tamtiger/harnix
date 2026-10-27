import { loadTask } from "src/core/tasks/task.js";
import { taskFilePath } from "src/core/tasks/task-location.js";

/**
 * Relevant paths of the tasks a learning came from, read from their records. A task that is missing or unreadable adds
 * nothing, so a lesson from a deleted task simply ranks as unrelated.
 */
export function createSourcePathsLoader(harnixRoot: string): (taskIds: readonly string[]) => Promise<string[]> {
  const cache = new Map<string, string[]>();
  const pathsOf = async (taskId: string): Promise<string[]> => {
    const cached = cache.get(taskId);
    if (cached !== undefined) return cached;
    let paths: string[] = [];
    try {
      const task = await loadTask(await taskFilePath(harnixRoot, taskId, "task.json"));
      paths = task.relevantPaths;
    } catch {
      paths = [];
    }
    cache.set(taskId, paths);
    return paths;
  };
  return async (taskIds) => (await Promise.all(taskIds.map(pathsOf))).flat();
}
