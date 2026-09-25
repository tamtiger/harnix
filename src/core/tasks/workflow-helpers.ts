import { compareCodeUnits } from "../../utils/order.js";
import {
  type TaskRecord,
  type TaskCancellation,
  transitionTask,
  updateTaskCheckpoint,
} from "./task.js";
import type { LearningCaptureInput } from "../journal/learning.js";

export function laterTimestamp(previous: string, now: string): string {
  return Date.parse(now) > Date.parse(previous) ? now : previous;
}

export function isMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT";
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function canonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort(compareCodeUnits)
      .map((key) => [key, canonicalJson(value[key])])
  );
}

export function semanticJsonEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonicalJson(left)) === JSON.stringify(canonicalJson(right));
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
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new Error(`${label} contains an unknown schema field.`);
  }
}

export function sameBytes(left: Uint8Array | undefined, right: Uint8Array | undefined): boolean {
  if (left === undefined || right === undefined) return left === right;
  if (left.byteLength !== right.byteLength) return false;
  return left.every((byte, index) => byte === right[index]);
}

export function assertLegalTransition(previous: TaskRecord, next: TaskRecord): void {
  if (previous.status === next.status) {
    updateTaskCheckpoint(previous, next.checkpoint, next.updatedAt);
    return;
  }
  const reenteringReadyFromReplan = next.status === "ready"
    && next.checkpoint === "ready"
    && previous.checkpoint === "replan"
    && (previous.status === "in_progress" || previous.status === "verifying");
  if (reenteringReadyFromReplan) return;
  transitionTask(previous, next.status, next.checkpoint, next.updatedAt, next.blocker);
}

export function validateCancellationEnvelope(value: unknown): TaskCancellation {
  if (!isRecord(value) || typeof value.reason !== "string" || value.authorizedBy !== "user") {
    throw new Error("Workflow cancellation requires bounded JSON with reason and authorizedBy=user.");
  }
  return { reason: value.reason, authorizedBy: "user" };
}

export function validateLearningEnvelope(value: unknown): LearningCaptureInput {
  if (!isRecord(value) || Object.keys(value).length !== 1 || !isRecord(value.candidate)) {
    throw new Error("Workflow learning capture requires bounded JSON with a candidate object.");
  }
  return value.candidate as unknown as LearningCaptureInput;
}
