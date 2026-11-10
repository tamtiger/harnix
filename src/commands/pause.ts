import { withWorkflowLock } from "src/core/workflow/workflow-lock.js";
import { readConfig } from "src/core/config/config.js";
import { pauseTask, type TaskPauseResultV1 } from "src/core/tasks/task-pause.js";
import { findInitializedProject, missingProjectError } from "src/utils/project-discovery.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";

export async function pauseProjectTask(cwd: string, dryRun = false): Promise<TaskPauseResultV1> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw await missingProjectError("Pause", cwd);
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));
  return dryRun ? pauseTask(harnixRoot, dryRun) : withWorkflowLock(harnixRoot, () => pauseTask(harnixRoot, dryRun));
}
