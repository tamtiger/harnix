import { readConfig } from "src/core/config/config.js";
import { appendJournal, searchJournal } from "src/core/journal/journal.js";
import {
  archiveTask,
  cancelTask,
  resolveActiveTask,
  saveTask,
  type TaskCancellation,
  type TaskRecord,
} from "src/core/tasks/task.js";
import { validateCancellationEnvelope } from "src/core/tasks/workflow-helpers.js";
import { nowInstant } from "src/utils/clock.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import type { WorkflowFinishDependencies } from "./finish.js";
import { currentInstant, journalFilePath, refreshLinkedEpicMarkdown } from "./support.js";
import { resolveEditableTask, targetTaskId } from "./target-task.js";
import { withWorkflowLock } from "./workflow-lock.js";
import { noActiveTaskError } from "src/core/workflow/no-active-task.js";

export async function cancelWorkflow(root: string, envelope: unknown, injectedNow?: string): Promise<TaskRecord> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  return withWorkflowLock(harnixRoot, () => cancelLocked(root, harnixRoot, envelope, injectedNow));
}

async function cancelLocked(
  root: string,
  harnixRoot: string,
  envelope: unknown,
  injectedNow: string | undefined,
): Promise<TaskRecord> {
  const now = await currentInstant(root, injectedNow);
  const task = await cancellationTarget(harnixRoot);
  if (!task) throw noActiveTaskError("Workflow cancellation");
  const recovering = task.status === "cancelled" && task.checkpoint === "cancelling";
  const cancellation = recovering ? undefined : validateCancellationEnvelope(envelope);
  const config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const journalDate = recovering ? task.cancelledAt! : now;
  const journalPath = await journalFilePath(root, config, journalDate);
  const cancelled = await cancelWorkflowTask(harnixRoot, journalPath, config.developer, task, cancellation, now);
  await refreshLinkedEpicMarkdown(root, cancelled);
  return cancelled;
}

/** The `--task` target (unfinished only, hint otherwise) or the active task; the active pointer moves only if it names the target. */
async function cancellationTarget(harnixRoot: string): Promise<TaskRecord | undefined> {
  if (targetTaskId() === undefined) return resolveActiveTask(harnixRoot);
  try {
    return await resolveEditableTask(harnixRoot);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("a terminal task cannot be edited"))
      throw new Error(
        `${error.message}\nGợi ý: --cancel chỉ áp dụng cho task chưa kết thúc; liệt kê bằng harnix tasks --status planning.`,
        {
          cause: error,
        },
      );
    throw error;
  }
}

export async function cancelWorkflowTask(
  harnixRoot: string,
  journalPath: string,
  developer: string,
  task: TaskRecord,
  cancellation: TaskCancellation | undefined,
  now = nowInstant(),
  dependencies: WorkflowFinishDependencies = {},
): Promise<TaskRecord> {
  const recoveringCancelledTask = task.status === "cancelled" && task.checkpoint === "cancelling";
  let cancelled = task;
  if (!recoveringCancelledTask) {
    if (cancellation === undefined)
      throw new Error("Workflow cancellation requires explicit user authority and a reason.");
    cancelled = cancelTask(task, cancellation, now);
    await (dependencies.saveTask ?? saveTask)(harnixRoot, cancelled);
  }
  const cancellationEntry = {
    generator: "harnix" as const,
    schemaVersion: 1 as const,
    id: `${cancelled.id}-cancellation`,
    recordedAt: cancelled.cancelledAt!,
    developer,
    taskId: cancelled.id,
    kind: "cancellation" as const,
    summary: `Cancelled: ${cancelled.title} — ${cancelled.cancellation!.reason}`,
    evidenceIds: cancelled.evidence.map((evidence) => evidence.id),
  };
  if (!recoveringCancelledTask) {
    await (dependencies.appendJournal ?? appendJournal)(journalPath, cancellationEntry);
  } else {
    const journal = await (dependencies.searchJournal ?? searchJournal)(journalPath);
    if (!journal.entries.some((entry) => entry.id === cancellationEntry.id)) {
      await (dependencies.appendJournal ?? appendJournal)(journalPath, cancellationEntry);
    }
  }
  await (dependencies.archiveTask ?? archiveTask)(harnixRoot, cancelled);
  return cancelled;
}
