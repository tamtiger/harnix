import { readConfig } from "src/core/config/config.js";
import { detailPublicEpic, findNextEpic, type PublicEpicBriefResult } from "src/commands/epic.js";
import { resumeTask, type TaskResumeResultV1 } from "src/core/tasks/task-resume.js";
import { loadTask } from "src/core/tasks/task.js";
import { findInitializedProject, missingProjectError } from "src/utils/project-discovery.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";

import { withWorkflowLock } from "src/core/workflow/workflow-lock.js";
import { briefTask, type BriefTask } from "src/core/workflow/brief.js";
import { taskFilePath } from "src/core/tasks/task-location.js";

export interface ResumeProjectTaskOptions {
  dryRun?: boolean;
  epic?: string;
  force?: boolean;
  next?: boolean;
  brief?: boolean;
}

/** Resumes an exact task, or the next unfinished member of an epic. */
export async function resumeProjectTask(
  cwd: string,
  taskId: string | undefined,
  dryRun = false,
  epicId?: string,
  force = false,
  next = false,
  brief = false,
): Promise<TaskResumeResultV1 | BriefTask> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw await missingProjectError("Resume", cwd);
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));

  // Activating a task rewrites the one active pointer, so it takes the same lock as every other task-state write.
  const locked = <T>(section: () => Promise<T>): Promise<T> =>
    dryRun ? section() : withWorkflowLock(harnixRoot, section);

  const returnResult = async (res: TaskResumeResultV1): Promise<TaskResumeResultV1 | BriefTask> => {
    if (!brief) return res;
    const taskPath = await taskFilePath(harnixRoot, res.task.id, "task.json");
    const task = await loadTask(taskPath);
    return briefTask(task);
  };

  if (next) {
    if (taskId !== undefined) throw new Error("resume --next does not accept a task id.");
    let targetEpic = epicId;
    if (targetEpic === undefined) {
      targetEpic = (await findNextEpic(project.root))?.id;
      if (targetEpic === undefined) throw new Error("No unfinished epic task found to resume with --next.");
    }
    const { nextTask } = (await detailPublicEpic(project.root, targetEpic, true)) as PublicEpicBriefResult;
    if (nextTask === null) throw new Error(`Epic ${targetEpic} has no unfinished task to resume.`);
    return returnResult(await locked(() => resumeTask(harnixRoot, nextTask.id, dryRun, undefined, force)));
  }

  if (taskId !== undefined && epicId !== undefined)
    throw new Error("resume takes either a task id or --epic, not both.");
  if (taskId === undefined && epicId === undefined) throw new Error("resume requires a task id or --epic <epic-id>.");

  if (epicId === undefined)
    return returnResult(await locked(() => resumeTask(harnixRoot, taskId as string, dryRun, undefined, force)));
  const { nextTask } = (await detailPublicEpic(project.root, epicId, true)) as PublicEpicBriefResult;
  if (nextTask === null) throw new Error(`Epic ${epicId} has no unfinished task to resume.`);
  return returnResult(await locked(() => resumeTask(harnixRoot, nextTask.id, dryRun, undefined, force)));
}
