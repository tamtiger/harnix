import { blockerKeys, cancellationKeys, decisionKeys, legalCheckpoints, residualRiskKeys } from "./task-schema.js";
import type { AcceptanceCriterion, TaskBlocker, TaskStatus, WorkflowCheckpoint } from "./task-schema.js";
import {
  TaskValidationError,
  assertExactKeys,
  ensureUnique,
  isBoundedText,
  isCancellationReason,
  isIsoTimestamp,
  isRecord,
  validId,
} from "./task-validate-common.js";

function validateRationale(
  value: unknown,
  allowed: ReadonlySet<string>,
  label: string,
  isValidItem: (item: Record<string, unknown>) => boolean,
): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) throw new TaskValidationError(`${label} list must be an array.`);
  for (const item of value) {
    if (!isRecord(item)) throw new TaskValidationError(`${label} must be an object.`);
    assertExactKeys(item, allowed, label);
    if (!validId(item.id) || !isBoundedText(item.text) || !isValidItem(item))
      throw new TaskValidationError(`${label} is invalid.`);
  }
  ensureUnique(
    value.map((item: Record<string, unknown>) => String(item.id)),
    label.toLowerCase(),
  );
}

export function assertBlocker(value: Record<string, unknown>): void {
  if (
    value.status === "blocked" &&
    (!isRecord(value.blocker) ||
      !["decision", "authority", "credential", "external", "repository"].includes(String(value.blocker.kind)) ||
      typeof value.blocker.summary !== "string" ||
      typeof value.blocker.nextAction !== "string" ||
      !["planning", "ready", "in_progress", "verifying"].includes(String(value.blocker.resumeStatus)))
  )
    throw new TaskValidationError("Blocked task blocker is invalid.");
  validateRationale(
    value.decisions,
    decisionKeys,
    "Task decision",
    (item) => typeof item.rationale === "string" && isBoundedText(item.rationale),
  );
  validateRationale(value.residualRisks, residualRiskKeys, "Task residual risk", (item) =>
    ["low", "medium", "high"].includes(String(item.severity)),
  );
  if (isRecord(value.blocker)) assertExactKeys(value.blocker, blockerKeys, "Task blocker");
  if (value.status === "blocked" && !value.blocker) throw new TaskValidationError("Blocked tasks require a blocker.");
  if (value.status !== "blocked" && value.blocker !== undefined)
    throw new TaskValidationError("Only blocked tasks may retain a blocker.");
}

export function assertCancellation(value: Record<string, unknown>): void {
  if (value.status !== "cancelled") {
    if (value.cancellation !== undefined || value.cancelledAt !== undefined)
      throw new TaskValidationError("Only cancelled tasks may retain cancellation metadata.");
    return;
  }
  if (isRecord(value.cancellation)) assertExactKeys(value.cancellation, cancellationKeys, "Task cancellation");
  if (
    !isRecord(value.cancellation) ||
    !isCancellationReason(value.cancellation.reason) ||
    value.cancellation.authorizedBy !== "user" ||
    !isIsoTimestamp(value.cancelledAt) ||
    Date.parse(value.cancelledAt) < Date.parse(String(value.updatedAt)) ||
    value.completedAt !== undefined
  ) {
    throw new TaskValidationError("Cancelled task is missing cancellation requirements.");
  }
}

export function assertStatusCheckpointAndCompletion(value: Record<string, unknown>): void {
  const checkpointOwner: Exclude<TaskStatus, "blocked"> =
    value.status === "blocked"
      ? (value.blocker as TaskBlocker).resumeStatus
      : (value.status as Exclude<TaskStatus, "blocked">);
  if (!legalCheckpoints[checkpointOwner].includes(value.checkpoint as WorkflowCheckpoint))
    throw new TaskValidationError(
      `Task status/checkpoint combination is invalid. Legal checkpoints for status ${checkpointOwner}: ${legalCheckpoints[checkpointOwner].join(", ")}.`,
    );
  if (
    value.status === "completed" &&
    (!value.completedAt ||
      !isIsoTimestamp(value.completedAt) ||
      Date.parse(value.completedAt) < Date.parse(String(value.updatedAt)) ||
      (value.acceptanceCriteria as AcceptanceCriterion[]).some((criterion) => criterion.status === "pending"))
  )
    throw new TaskValidationError("Completed task is missing completion requirements.");
}
