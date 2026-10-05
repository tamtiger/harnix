import { readConfig } from "src/core/config/config.js";
import { appendJournal, searchJournal } from "src/core/journal/journal.js";
import { captureLearningAtFinish } from "src/core/journal/learning-capture.js";
import { extractObservations, reviewNotes } from "src/core/journal/learning-notes.js";
import { archiveTask, resolveActiveTask, saveTask, transitionTask, type TaskRecord } from "src/core/tasks/task.js";
import { nowInstant } from "src/utils/clock.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { assertTaskReadyForFinishing, completionEvidenceIds } from "./completion.js";
import { currentInstant, journalFilePath, refreshLinkedEpicMarkdown } from "./support.js";
import { withWorkflowLock } from "./workflow-lock.js";

export interface WorkflowFinishDependencies {
  saveTask?: typeof saveTask;
  appendJournal?: typeof appendJournal;
  searchJournal?: typeof searchJournal;
  archiveTask?: typeof archiveTask;
}

export interface FinishLearningReport {
  notes: number;
  captured: number;
  hint?: string;
}

export interface FinishReport {
  task: TaskRecord;
  learning: FinishLearningReport;
}

export async function finishWorkflow(root: string, injectedNow?: string): Promise<TaskRecord> {
  return (await finishWorkflowReport(root, injectedNow)).task;
}

function learningHint(task: TaskRecord, captured: number): string | undefined {
  if (captured > 0) return undefined;
  if (reviewNotes(task).length === 0)
    return "No decisions, residual risks or evidence findings were recorded, so no learning was captured; record reusable lessons with --add-risk or --add-decision before --finish.";
  if (extractObservations(task).length === 0)
    return "Every note was filtered (longer than 500 characters, command-like, credential-like or an instruction override), so no learning was captured.";
  return "Learning for this task was already captured or a reviewed decision on it already exists.";
}

/** Finishes the active task and reports how much project learning that produced, so a zero is never silent. */
export async function finishWorkflowReport(root: string, injectedNow?: string): Promise<FinishReport> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  return withWorkflowLock(harnixRoot, () => finishLocked(root, harnixRoot, injectedNow));
}

async function finishLocked(root: string, harnixRoot: string, injectedNow: string | undefined): Promise<FinishReport> {
  const now = await currentInstant(root, injectedNow);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow finish requires an active task.");
  const config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const journalDate = task.status === "completed" ? task.completedAt! : now;
  const journalPath = await journalFilePath(root, config, journalDate);
  const finished = await finishWorkflowTask(harnixRoot, journalPath, config.developer, task, now);
  await refreshLinkedEpicMarkdown(root, finished);
  const captured = await captureLearning(root, config.developer, finished, journalPath, journalDate);
  const hint = learningHint(finished, captured);
  return {
    task: finished,
    learning: { notes: reviewNotes(finished).length, captured, ...(hint === undefined ? {} : { hint }) },
  };
}

/** Best-effort by design: learning is a by-product, so a failure here must never undo or hide a completed task. */
async function captureLearning(
  root: string,
  developer: string,
  task: TaskRecord,
  journalPath: string,
  instant: string,
): Promise<number> {
  try {
    return await captureLearningAtFinish(
      await resolveSafeHarnixPath(root, `workspace/${developer}/journal`),
      journalPath,
      developer,
      task,
      instant,
    );
  } catch {
    // The completion journal entry and task state are already durable; capture is retried on the next finish.
    return 0;
  }
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
