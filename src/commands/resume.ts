import { readConfig } from "../core/config/config.js";
import { resumeTask, type TaskResumeResultV1 } from "../core/tasks/task-resume.js";
import { findInitializedProject } from "../utils/project-discovery.js";
import { resolveSafeHarnixPath } from "../utils/paths.js";

export async function resumeProjectTask(cwd: string, taskId: string, dryRun = false): Promise<TaskResumeResultV1> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw new Error("Resume requires an initialized Harnix project.");
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));
  return resumeTask(harnixRoot, taskId, dryRun);
}
