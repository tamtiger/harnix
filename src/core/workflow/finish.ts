import { readConfig } from "src/core/config/config.js";
import { appendJournal, searchJournal } from "src/core/journal/journal.js";
import { captureLearningAtFinish } from "src/core/journal/learning-capture.js";
import { extractObservations, reviewNotes } from "src/core/journal/learning-notes.js";
import { effectiveLearningStatus } from "src/core/journal/learning.js";
import { readLearningStates } from "src/core/journal/learning-store.js";
import { archiveTask, resolveActiveTask, saveTask, transitionTask, type TaskRecord } from "src/core/tasks/task.js";
import { nowInstant } from "src/utils/clock.js";
import { compareCodeUnits } from "src/utils/order.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { assertTaskReadyForFinishing, completionEvidenceIds } from "./completion.js";
import { scanTaskSecrets, type SecretAdvisory } from "./secret-scan.js";
import { authorizedRedBaseline } from "./suite-gate.js";
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
  promotable?: string[];
}

export interface FinishReport {
  task: TaskRecord;
  learning: FinishLearningReport;
  /** Required checks that finished red from before the task under an authorized baseline. */
  baselineAuthorized: string[];
  /** Present only when a file of the task shows a sign of a secret; advice, never a reason to refuse a finish. */
  secretAdvisory?: SecretAdvisory;
}

export async function finishWorkflow(root: string, injectedNow?: string): Promise<TaskRecord> {
  return (await finishWorkflowReport(root, injectedNow)).task;
}

function learningHint(task: TaskRecord, captured: number): string | undefined {
  if (captured > 0) return undefined;
  if (reviewNotes(task).length === 0) return undefined;
  if (extractObservations(task).length === 0) return "No learning captured: every note was filtered as unsafe.";
  return "No learning captured: it already exists.";
}

/** What a test may replace in a finish; production always uses the real learning capture. */
export interface FinishReportDependencies {
  readonly captureLearning?: typeof captureLearningAtFinish;
}

/** Finishes the active task and reports how much project learning that produced, so a zero is never silent. */
export async function finishWorkflowReport(
  root: string,
  injectedNow?: string,
  dependencies: FinishReportDependencies = {},
): Promise<FinishReport> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  return withWorkflowLock(harnixRoot, () => finishLocked(root, harnixRoot, injectedNow, dependencies));
}

async function findPromotableCandidates(root: string, developer: string, nowMs: number): Promise<string[]> {
  try {
    const journalRoot = await resolveSafeHarnixPath(root, `workspace/${developer}/journal`);
    const states = await readLearningStates(journalRoot);
    const promotable: string[] = [];
    for (const [id, state] of states) {
      const status = effectiveLearningStatus(state.candidate.status, state.entry.recordedAt, nowMs);
      if (status === "candidate") {
        promotable.push(id);
      }
    }
    return promotable.sort(compareCodeUnits);
  } catch {
    return [];
  }
}

async function finishLocked(
  root: string,
  harnixRoot: string,
  injectedNow: string | undefined,
  dependencies: FinishReportDependencies,
): Promise<FinishReport> {
  const now = await currentInstant(root, injectedNow);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow finish requires an active task.");
  const config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const journalDate = task.status === "completed" ? task.completedAt! : now;
  const journalPath = await journalFilePath(root, config, journalDate);
  const finished = await finishWorkflowTask(harnixRoot, journalPath, config.developer, task, now);
  await refreshLinkedEpicMarkdown(root, finished);
  const capture = dependencies.captureLearning ?? captureLearningAtFinish;
  const captured = await captureLearning(capture, root, config.developer, finished, journalPath, journalDate);
  const hint = learningHint(finished, captured);
  const promotable = await findPromotableCandidates(root, config.developer, Date.parse(journalDate));
  let learningHintText = hint;
  if (promotable.length > 0) {
    const promoteCmd = `harnix learning --promote ${promotable[0]} --apply`;
    learningHintText = learningHintText ? `${learningHintText} Gợi ý: ${promoteCmd}` : `Gợi ý: ${promoteCmd}`;
  }
  const secretAdvisory = await scanTaskSecrets(root, finished);
  return {
    task: finished,
    ...(secretAdvisory === undefined ? {} : { secretAdvisory }),
    baselineAuthorized: finished.validationPlan
      .filter((check) => authorizedRedBaseline(finished, check))
      .map((check) => check.id),
    learning: {
      notes: reviewNotes(finished).length,
      captured,
      ...(learningHintText === undefined ? {} : { hint: learningHintText }),
      ...(promotable.length > 0 ? { promotable } : {}),
    },
  };
}

/** Best-effort by design: learning is a by-product, so a failure here must never undo or hide a completed task. */
async function captureLearning(
  capture: typeof captureLearningAtFinish,
  root: string,
  developer: string,
  task: TaskRecord,
  journalPath: string,
  instant: string,
): Promise<number> {
  try {
    return await capture(
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
