import { readConfig } from "src/core/config/config.js";
import { detailPublicEpic, type PublicEpicBriefResult } from "src/commands/epic.js";
import { listEpicIds } from "src/core/epics/epic.js";
import { resumeTask, type TaskResumeResultV1 } from "src/core/tasks/task-resume.js";
import { findInitializedProject } from "src/utils/project-discovery.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";

export interface ResumeProjectTaskOptions {
  dryRun?: boolean;
  epic?: string;
  force?: boolean;
  next?: boolean;
}

/** Resumes an exact task, or the next unfinished member of an epic. */
export async function resumeProjectTask(
  cwd: string,
  taskId: string | undefined,
  dryRun = false,
  epicId?: string,
  force = false,
  next = false,
): Promise<TaskResumeResultV1> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw new Error("Resume requires an initialized Harnix project.");
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));

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
    return resumeTask(harnixRoot, nextTask.id, dryRun, undefined, force);
  }

  if (taskId !== undefined && epicId !== undefined)
    throw new Error("resume takes either a task id or --epic, not both.");
  if (taskId === undefined && epicId === undefined) throw new Error("resume requires a task id or --epic <epic-id>.");

  if (epicId === undefined) return resumeTask(harnixRoot, taskId as string, dryRun, undefined, force);
  const { nextTask } = (await detailPublicEpic(project.root, epicId, true)) as PublicEpicBriefResult;
  if (nextTask === null) throw new Error(`Epic ${epicId} has no unfinished task to resume.`);
  return resumeTask(harnixRoot, nextTask.id, dryRun, undefined, force);
}
