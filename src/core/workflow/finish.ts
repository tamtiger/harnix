import { readConfig } from "../config/config.js";
import { appendJournal, searchJournal } from "../journal/journal.js";
import { archiveTask, resolveActiveTask, saveTask, transitionTask, type TaskRecord } from "../tasks/task.js";
import { nowInstant } from "../../utils/clock.js";
import { resolveSafeHarnixPath } from "../../utils/paths.js";
import { assertTaskReadyForFinishing, completionEvidenceIds } from "./completion.js";
import { currentInstant, journalFilePath, refreshLinkedEpicMarkdown } from "./support.js";

export interface WorkflowFinishDependencies {
  saveTask?: typeof saveTask;
  appendJournal?: typeof appendJournal;
  searchJournal?: typeof searchJournal;
  archiveTask?: typeof archiveTask;
}

export async function finishWorkflow(root: string, injectedNow?: string): Promise<TaskRecord> {
  const now = await currentInstant(root, injectedNow);
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow finish requires an active task.");
  const config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const journalDate = task.status === "completed" ? task.completedAt! : now;
  const journalPath = await journalFilePath(root, config, journalDate);
  const finished = await finishWorkflowTask(harnixRoot, journalPath, config.developer, task, now);
  await refreshLinkedEpicMarkdown(root, finished);
  return finished;
}

export async function finishWorkflowTask(
  harnixRoot: string,
  journalPath: string,
  developer: string,
  task: TaskRecord,
  now = nowInstant(),
  dependencies: WorkflowFinishDependencies = {},
): Promise<TaskRecord> {
  const recoveringCompletedTask = task.status === "completed" && task.checkpoint === "finishing";
  if (!recoveringCompletedTask && (task.status !== "verifying" || task.checkpoint !== "finishing")) {
    throw new Error("Task requires the verifying/finishing checkpoint or a completed/finishing recovery state.");
  }
  let completed = task;
  if (!recoveringCompletedTask) {
    await assertTaskReadyForFinishing(harnixRoot, task, now);
    completed = transitionTask(task, "completed", "finishing", now);
    await (dependencies.saveTask ?? saveTask)(harnixRoot, completed);
  }
  const completionEntry = {
    generator: "harnix" as const,
    schemaVersion: 1 as const,
    id: `${completed.id}-completion`,
    recordedAt: completed.completedAt ?? now,
    developer,
    taskId: completed.id,
    kind: "completion" as const,
    summary: `Completed: ${completed.title}`,
    evidenceIds: completionEvidenceIds(completed),
  };
  if (!recoveringCompletedTask) {
    await (dependencies.appendJournal ?? appendJournal)(journalPath, completionEntry);
  } else {
    const journal = await (dependencies.searchJournal ?? searchJournal)(journalPath);
    if (!journal.entries.some((entry) => entry.id === completionEntry.id)) {
      await (dependencies.appendJournal ?? appendJournal)(journalPath, completionEntry);
    }
  }
  await (dependencies.archiveTask ?? archiveTask)(harnixRoot, completed);
  return completed;
}
