import type { TaskRecord } from "src/core/tasks/task.js";

/** Milliseconds the newest passing run of a check took, when that run recorded it; undefined otherwise. */
export function latestPassDurationMs(task: TaskRecord, checkId: string): number | undefined {
  let newest: { at: number; durationMs: number } | undefined;
  for (const evidence of task.evidence) {
    if (evidence.checkId !== checkId || evidence.result !== "pass" || !("durationMs" in evidence)) continue;
    const durationMs = evidence.durationMs;
    if (typeof durationMs !== "number") continue;
    const at = Date.parse(evidence.recordedAt);
    if (newest === undefined || at >= newest.at) newest = { at, durationMs };
  }
  return newest?.durationMs;
}
