import { readConfig } from "../core/config/config.js";
import { createTaskIndex, type TaskIndexOptions, type TaskIndexResultV1 } from "../core/tasks/task-index.js";
import { findInitializedProject } from "../utils/project-discovery.js";
import { resolveSafeHarnixPath } from "../utils/paths.js";

export async function listProjectTasks(cwd: string, options: TaskIndexOptions): Promise<TaskIndexResultV1> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw new Error("Tasks requires an initialized Harnix project.");
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));
  return createTaskIndex(harnixRoot, options);
}
