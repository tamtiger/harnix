import { readConfig } from "../core/config/config.js";
import { pauseTask, type TaskPauseResultV1 } from "../core/tasks/task-pause.js";
import { findInitializedProject } from "../utils/project-discovery.js";
import { resolveSafeHarnixPath } from "../utils/paths.js";

export async function pauseProjectTask(cwd: string, dryRun = false): Promise<TaskPauseResultV1> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw new Error("Pause requires an initialized Harnix project.");
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));
  return pauseTask(harnixRoot, dryRun);
}
