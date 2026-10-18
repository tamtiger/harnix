import { readConfig } from "src/core/config/config.js";
import { detailPublicEpic, type PublicEpicBriefResult } from "src/commands/epic.js";
import { listEpicIds } from "src/core/epics/epic.js";
import { resumeTask, type TaskResumeResultV1 } from "src/core/tasks/task-resume.js";
import { loadTask } from "src/core/tasks/task.js";
import { findInitializedProject } from "src/utils/project-discovery.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";

import { briefTask, type BriefTask } from "src/core/workflow/brief.js";

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
  if (project.kind !== "ready") throw new Error("Resume requires an initialized Harnix project.");
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));

  const returnResult = async (res: TaskResumeResultV1): Promise<TaskResumeResultV1 | BriefTask> => {
    if (!brief) return res;
    const taskPath = await resolveSafeProjectPath(harnixRoot, `tasks/${res.task.id}/task.json`);
    const task = await loadTask(taskPath);
    return briefTask(task);
  };

  if (next) {
    if (taskId !== undefined) throw new Error("resume --next does not accept a task id.");
    let targetEpic = epicId;
    if (targetEpic === undefined) {
      const epics = await listEpicIds(harnixRoot);
      for (const id of epics) {
        const detail = (await detailPublicEpic(project.root, id, true)) as PublicEpicBriefResult;
        if (detail.nextTask !== null) {
          targetEpic = id;
          break;
        }
      }
      if (targetEpic === undefined) throw new Error("No unfinished epic task found to resume with --next.");
    }
    const { nextTask } = (await detailPublicEpic(project.root, targetEpic, true)) as PublicEpicBriefResult;
    if (nextTask === null) throw new Error(`Epic ${targetEpic} has no unfinished task to resume.`);
    return returnResult(await resumeTask(harnixRoot, nextTask.id, dryRun, undefined, force));
  }

  if (taskId !== undefined && epicId !== undefined)
    throw new Error("resume takes either a task id or --epic, not both.");
  if (taskId === undefined && epicId === undefined) throw new Error("resume requires a task id or --epic <epic-id>.");

  if (epicId === undefined) return returnResult(await resumeTask(harnixRoot, taskId as string, dryRun, undefined, force));
  const { nextTask } = (await detailPublicEpic(project.root, epicId, true)) as PublicEpicBriefResult;
  if (nextTask === null) throw new Error(`Epic ${epicId} has no unfinished task to resume.`);
  return returnResult(await resumeTask(harnixRoot, nextTask.id, dryRun, undefined, force));
}
