import { readConfig } from "src/core/config/config.js";
import { detailPublicEpic, type PublicEpicBriefResult } from "src/commands/epic.js";
import { resumeTask, type TaskResumeResultV1 } from "src/core/tasks/task-resume.js";
import { findInitializedProject } from "src/utils/project-discovery.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";

/** Resumes an exact task, or with `epicId` the next unfinished member of that epic (exactly one of the two). */
export async function resumeProjectTask(
  cwd: string,
  taskId: string | undefined,
  dryRun = false,
  epicId?: string,
): Promise<TaskResumeResultV1> {
  if (taskId !== undefined && epicId !== undefined)
    throw new Error("resume takes either a task id or --epic, not both.");
  if (taskId === undefined && epicId === undefined) throw new Error("resume requires a task id or --epic <epic-id>.");
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw new Error("Resume requires an initialized Harnix project.");
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));
  if (epicId === undefined) return resumeTask(harnixRoot, taskId as string, dryRun);
  const { nextTask } = (await detailPublicEpic(project.root, epicId, true)) as PublicEpicBriefResult;
  if (nextTask === null) throw new Error(`Epic ${epicId} has no unfinished task to resume.`);
  return resumeTask(harnixRoot, nextTask.id, dryRun);
}
