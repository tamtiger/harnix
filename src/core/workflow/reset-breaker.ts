import { resolveActiveTask, type TaskRecordV3 } from "src/core/tasks/task.js";
import { laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";

const REASON_MIN = 10;
const REASON_MAX = 1000;

export interface ResetBreakerOptions {
  reason: string;
  injectedNow?: string | undefined;
}

/**
 * Thao tác reset circuit breaker cho một check đã fail >= 2 lần liên tiếp.
 * Yêu cầu lý do (--reason) từ 10 đến 1000 ký tự giải thích tại sao breaker được reset.
 * Ghi nhận một entry 'skipped' mang cờ reset để phá vỡ chuỗi fail liên tiếp một cách an toàn.
 */
export async function resetBreakerWorkflow(
  root: string,
  checkId: string,
  options: ResetBreakerOptions,
): Promise<TaskRecordV3> {
  const reason = options.reason?.trim();
  if (!reason || reason.length < REASON_MIN || reason.length > REASON_MAX) {
    throw new Error(`workflow --reset-breaker requires --reason between ${REASON_MIN}-${REASON_MAX} characters.`);
  }

  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow reset-breaker requires an active task.");
  if (task.schemaVersion !== 3) {
    throw new Error("Workflow reset-breaker requires a TaskRecord schema v3 task.");
  }

  const declared = task.validationPlan.find((c) => c.id === checkId);
  if (!declared) {
    throw new Error(`Check ${checkId} is not declared in the active task validationPlan.`);
  }

  const now = await currentInstant(root, options.injectedNow);
  const resetEvidenceId = `ev-reset-${checkId}-${Date.now()}`;

  const resetEvidence = {
    id: resetEvidenceId,
    checkId,
    recordedAt: now,
    result: "skipped" as const,
    exitCode: 0,
    summary: `Circuit breaker reset: ${reason}`,
    artifactPaths: [],
  };

  const updatedTask: TaskRecordV3 = {
    ...task,
    evidence: [...task.evidence, resetEvidence],
    updatedAt: laterTimestamp(task.updatedAt, now),
  };

  return (await saveWorkflow(root, { task: updatedTask })) as TaskRecordV3;
}
