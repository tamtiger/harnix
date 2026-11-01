import { readConfig } from "src/core/config/config.js";
import { createTaskIndex, type TaskIndexOptions, type TaskIndexResultV1 } from "src/core/tasks/task-index.js";
import { findInitializedProject, missingProjectError } from "src/utils/project-discovery.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";

export async function listProjectTasks(cwd: string, options: TaskIndexOptions): Promise<TaskIndexResultV1> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw await missingProjectError("Tasks", cwd);
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));
  return createTaskIndex(harnixRoot, options);
}
