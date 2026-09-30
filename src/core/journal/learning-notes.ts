import { normalizeObservation } from "src/core/journal/learning.js";
import { analyzeLearningStatement } from "src/core/journal/learning-safety.js";
import type { TaskRecord } from "src/core/tasks/task.js";

export const MAX_OBSERVATIONS_PER_TASK = 5;
export const MAX_OBSERVATION_CHARACTERS = 500;

/**
 * Review notes the agent already wrote into the task (decisions, residual risks, evidence findings), trimmed and
 * de-duplicated by normalized text. Statements that trip a risk check are dropped here: automatic capture never
 * stores content that only a manual, reviewed path may handle.
 */
export function reviewNotes(task: TaskRecord): string[] {
  if (task.schemaVersion === 1) return [];
  return [
    ...(task.decisions ?? []).map((decision) => decision.text),
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
    const key = normalizeObservation(text);
    if (text.length === 0 || text.length > MAX_OBSERVATION_CHARACTERS || seen.has(key)) continue;
    const analysis = analyzeLearningStatement(text);
    if (analysis.oversized || analysis.findings.some((kind) => kind !== "url-like")) continue;
    seen.add(key);
    observations.push(text);
    if (observations.length >= MAX_OBSERVATIONS_PER_TASK) break;
  }
  return observations;
}
