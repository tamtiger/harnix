import { assertTextIntegrity } from "src/core/workflow/text-integrity.js";
import { compareCodeUnits } from "src/utils/order.js";
import { type TaskRecord, type TaskCancellation, transitionTask, updateTaskCheckpoint } from "./task.js";
import { unknownFieldsMessage } from "./task-validate-common.js";
import type { LearningCaptureInput } from "src/core/journal/learning.js";

const PLAN_CHECKLIST_ITEM = /^\s*- \[[ xX]\]\s+\S/mu;

/** The only structural expectation on a Full plan.md: at least one checklist item; everything else is free-form. */
export function planHasChecklistItem(plan: string): boolean {
  return PLAN_CHECKLIST_ITEM.test(plan);
}

export function laterTimestamp(previous: string, now: string): string {
  return Date.parse(now) > Date.parse(previous) ? now : previous;
}

export function isMissing(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function canonicalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort(compareCodeUnits)
      .map((key) => [key, canonicalizeJson(value[key])]),
  );
}

export function semanticJsonEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonicalizeJson(left)) === JSON.stringify(canonicalizeJson(right));
}

export function semanticTaskEqual(left: TaskRecord, right: TaskRecord): boolean {
  const normalize = (task: TaskRecord) => ({
    ...task,
    acceptanceCriteria: [...task.acceptanceCriteria].sort((a, b) => compareCodeUnits(a.id, b.id)),
    validationPlan: [...task.validationPlan].sort((a, b) => compareCodeUnits(a.id, b.id)),
  });
  return semanticJsonEqual(normalize(left), normalize(right));
}

export function assertExactFields(value: Record<string, unknown>, allowed: ReadonlySet<string>, label: string): void {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new Error(unknownFieldsMessage(label, unknown));
}

export function sameBytes(left: Uint8Array | undefined, right: Uint8Array | undefined): boolean {
  if (left === undefined || right === undefined) return left === right;
  if (left.byteLength !== right.byteLength) return false;
  return left.every((byte, index) => byte === right[index]);
}

/**
 * A task at checkpoint replan is waiting for its changed contract to pass the ready gate again, so the only ways out
 * are ready/ready, planning/planning while the task never left planning, or being blocked.
 */
function assertReplanExit(previous: TaskRecord, next: TaskRecord): void {
  if (previous.checkpoint !== "replan" || next.checkpoint === "replan") return;
  if (next.status === "blocked") return;
  const readyAgain = next.status === "ready" && next.checkpoint === "ready";
  const stillPlanning = next.status === "planning" && next.checkpoint === "planning";
  if (readyAgain || stillPlanning) return;
  throw new Error(
    `A task at checkpoint replan may only re-enter ready/ready (or planning/planning while planning), not ${next.status}/${next.checkpoint}.`,
  );
}

export function assertLegalTransition(previous: TaskRecord, next: TaskRecord): void {
  assertReplanExit(previous, next);
  if (previous.status === next.status) {
    updateTaskCheckpoint(previous, next.checkpoint, next.updatedAt);
    return;
  }
  const reenteringReadyFromReplan =
    next.status === "ready" &&
    next.checkpoint === "ready" &&
    previous.checkpoint === "replan" &&
    (previous.status === "in_progress" || previous.status === "verifying");
  if (reenteringReadyFromReplan) return;
  transitionTask(previous, next.status, next.checkpoint, next.updatedAt, next.blocker);
}

export function validateCancellationEnvelope(value: unknown): TaskCancellation {
  if (!isRecord(value) || typeof value.reason !== "string" || value.authorizedBy !== "user") {
    throw new Error("Workflow cancellation requires bounded JSON with reason and authorizedBy=user.");
  }
  assertTextIntegrity(value);
  return { reason: value.reason, authorizedBy: "user" };
}

export function validateLearningEnvelope(value: unknown): LearningCaptureInput {
  if (!isRecord(value) || Object.keys(value).length !== 1 || !isRecord(value.candidate)) {
    throw new Error("Workflow learning capture requires bounded JSON with a candidate object.");
  }
  assertTextIntegrity(value);
  return value.candidate as unknown as LearningCaptureInput;
}
