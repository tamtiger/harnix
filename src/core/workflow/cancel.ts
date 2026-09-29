import { readConfig } from "../config/config.js";
import { appendJournal, searchJournal } from "../journal/journal.js";
import {
  archiveTask,
  cancelTask,
  resolveActiveTask,
  saveTask,
  type TaskCancellation,
  type TaskRecord,
} from "../tasks/task.js";
import { validateCancellationEnvelope } from "../tasks/workflow-helpers.js";
import { nowInstant } from "../../utils/clock.js";
import { resolveSafeHarnixPath } from "../../utils/paths.js";
import type { WorkflowFinishDependencies } from "./finish.js";
import { currentInstant, journalFilePath, refreshLinkedEpicMarkdown } from "./support.js";

export async function cancelWorkflow(root: string, envelope: unknown, injectedNow?: string): Promise<TaskRecord> {
  const now = await currentInstant(root, injectedNow);
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow cancellation requires an active task.");
  const recovering = task.status === "cancelled" && task.checkpoint === "cancelling";
  const cancellation = recovering ? undefined : validateCancellationEnvelope(envelope);
  const config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const journalDate = recovering ? task.cancelledAt! : now;
  const journalPath = await journalFilePath(root, config, journalDate);
  const cancelled = await cancelWorkflowTask(harnixRoot, journalPath, config.developer, task, cancellation, now);
  await refreshLinkedEpicMarkdown(root, cancelled);
  return cancelled;
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
