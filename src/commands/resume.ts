import { readConfig } from "src/core/config/config.js";
import { resumeTask, type TaskResumeResultV1 } from "src/core/tasks/task-resume.js";
import { findInitializedProject } from "src/utils/project-discovery.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";

export async function resumeProjectTask(cwd: string, taskId: string, dryRun = false): Promise<TaskResumeResultV1> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw new Error("Resume requires an initialized Harnix project.");
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));
  return resumeTask(harnixRoot, taskId, dryRun);
}
