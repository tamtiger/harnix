import { isLocalDecisionOnly, lowValueReason } from "src/core/journal/learning-quality.js";
import { foldObservation } from "src/core/journal/learning-similarity.js";
import { analyzeLearningStatement } from "src/core/journal/learning-safety.js";
import type { TaskRecord } from "src/core/tasks/task.js";

export const MAX_OBSERVATIONS_PER_TASK = 5;
export const MAX_OBSERVATION_CHARACTERS = 500;

/** A decision id with this prefix records a measurement or a process step, never a lesson to learn from. */
const TRACE_PREFIX = "trace-";

/**
 * Review notes the agent already wrote into the task (decisions, residual risks, evidence findings), trimmed and
 * de-duplicated by normalized text. Statements that trip a risk check are dropped here: automatic capture never
 * stores content that only a manual, reviewed path may handle.
 */
export function reviewNotes(task: TaskRecord): string[] {
  if (task.schemaVersion === 1) return [];
  return [
    ...(task.decisions ?? [])
      .filter((decision) => !decision.id.startsWith(TRACE_PREFIX))
      .map((decision) => decision.text),
    ...(task.residualRisks ?? []).map((risk) => risk.text),
    ...task.evidence.flatMap((evidence) => (evidence.findings ?? []).map((finding) => finding.text)),
  ];
}

export function extractObservations(task: TaskRecord): string[] {
  const texts = reviewNotes(task);
  const seen = new Set<string>();
  const observations: string[] = [];
  for (const raw of texts) {
    const text = raw.trim();
    const key = foldObservation(text);
    if (
      text.length === 0 ||
      text.length > MAX_OBSERVATION_CHARACTERS ||
      seen.has(key) ||
      lowValueReason(text) !== undefined ||
      isLocalDecisionOnly(text)
    )
      continue;
    const analysis = analyzeLearningStatement(text);
    if (analysis.oversized || analysis.findings.some((kind) => kind !== "url-like")) continue;
    seen.add(key);
    observations.push(text);
    if (observations.length >= MAX_OBSERVATIONS_PER_TASK) break;
  }
  return observations;
}

/**
 * Detects whether a task is a bugfix task based on its ID, title, or goal.
 */
export function isBugfixTask(task: TaskRecord): boolean {
  if (task.schemaVersion === 1) return false;
  const text = `${task.id} ${task.title} ${task.goal}`.toLowerCase().replace(/[-_]/gu, " ");
  return /\b(?:bugfix|fix|hotfix|sửa lỗi|sua loi|khắc phục|khac phuc)\b/iu.test(text);
}

/**
 * Automatically crafts a well-formed learning statement for completed bugfix tasks.
 */
export function autoBugfixObservation(task: TaskRecord): string {
  const statement = `Bài học sửa lỗi: Khi giải quyết ${task.title}, cần lưu ý bảo đảm ${task.goal}`;
  return statement.length > MAX_OBSERVATION_CHARACTERS ? statement.slice(0, MAX_OBSERVATION_CHARACTERS) : statement;
}
