import { nowInstant } from "src/utils/clock.js";
import { cancellableStatuses, transitions } from "./task-schema.js";
import type {
  Evidence,
  TaskBlocker,
  TaskCancellation,
  TaskRecord,
  TaskStatus,
  WorkflowCheckpoint,
} from "./task-schema.js";
import { validateTask } from "./task-validate.js";
import { TaskValidationError, isCancellationReason } from "./task-validate-common.js";

// Selects the representative evidence for a check. Time-valid evidence (finite
// timestamp not in the future relative to `now`) is preferred over invalid or
// future-dated evidence so an immutable future-dated record cannot mask a later
// legitimate pass. Within the same validity class the newer `recordedAt` wins,
// and exact ties keep append order (the later array element wins).
export function selectLatestEvidence(
  evidence: readonly Evidence[],
  checkId: string,
  now = Date.now(),
): Evidence | undefined {
  let latest: Evidence | undefined;
  let latestTime = Number.NaN;
  let latestValid = false;
  for (const candidate of evidence) {
    if (candidate.checkId !== checkId) continue;
    const time = Date.parse(candidate.recordedAt);
    const valid = Number.isFinite(time) && time <= now;
    if (latest === undefined || (valid && !latestValid) || (valid === latestValid && time >= latestTime)) {
      latest = candidate;
      latestTime = time;
      latestValid = valid;
    }
  }
  return latest;
}

export function transitionTask(
  task: TaskRecord,
  status: TaskStatus,
  checkpoint: WorkflowCheckpoint,
  now = nowInstant(),
  blocker?: TaskBlocker,
): TaskRecord {
  if (!transitions[task.status].includes(status)) {
    const legal = transitions[task.status];
    const hint =
      legal.length === 0
        ? `${task.status} is terminal and has no further transitions`
        : `legal next statuses from ${task.status}: ${legal.join(", ")}`;
    throw new TaskValidationError(`Illegal task transition ${task.status} -> ${status}. ${hint}.`);
  }
  if (task.status === "blocked" && task.blocker?.resumeStatus !== status)
    throw new TaskValidationError("Blocked task must resume to its recorded status.");
  if (status === "blocked" && blocker === undefined)
    throw new TaskValidationError("Transitioning to blocked requires a blocker.");
  const withoutBlocker = { ...task };
  delete withoutBlocker.blocker;
  return validateTask({
    ...withoutBlocker,
    ...(status === "blocked" ? { blocker } : {}),
    status,
    checkpoint,
    updatedAt: now,
    ...(status === "completed" ? { completedAt: now } : {}),
  });
}

export function cancelTask(task: TaskRecord, cancellation: TaskCancellation, now = nowInstant()): TaskRecord {
  if (!cancellableStatuses.has(task.status))
    throw new TaskValidationError(`Cannot cancel terminal ${task.status} task.`);
  const reason = cancellation.reason.trim();
  if (!isCancellationReason(reason)) throw new TaskValidationError("Task cancellation reason is invalid.");
  const withoutBlocker = { ...task };
  delete withoutBlocker.blocker;
  return validateTask({
    ...withoutBlocker,
    status: "cancelled",
    checkpoint: "cancelling",
    cancellation: { reason, authorizedBy: cancellation.authorizedBy },
    updatedAt: now,
    cancelledAt: now,
  });
}

export function updateTaskCheckpoint(task: TaskRecord, checkpoint: WorkflowCheckpoint, now = nowInstant()): TaskRecord {
  if (task.status === "blocked" || task.status === "completed" || task.status === "cancelled")
    throw new TaskValidationError("Cannot update the checkpoint for blocked or terminal tasks.");
  return validateTask({ ...task, checkpoint, updatedAt: now });
}
