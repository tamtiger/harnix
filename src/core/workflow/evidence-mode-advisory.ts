import type { TaskRecord } from "src/core/tasks/task.js";

import { isObservableCriterion } from "./exercise-advisory.js";

/** The `mode:` label an exercise run puts at the start of its evidence summary. */
const MODE_LABEL = /^\s*mode:\s*(full|partial|code-only)\b/iu;

/**
 * Finish advisory (never a blocker): a criterion that describes observable behavior whose newest labeled passing
 * evidence is `partial` or `code-only` was never fully run for real, so the task should carry a residual risk saying
 * so. It reads only the summary label and the task's risk list; evidence without a label is not judged here.
 */
export function evidenceModeAdvisories(task: TaskRecord): string[] {
  if ("residualRisks" in task && (task.residualRisks ?? []).length > 0) return [];
  const flagged: string[] = [];
  for (const criterion of task.acceptanceCriteria) {
    if (criterion.status === "waived" || !isObservableCriterion(criterion.text)) continue;
    const checkIds = new Set(
      task.validationPlan
        .filter((check) => check.required && (check.criterionIds ?? []).includes(criterion.id))
        .map((check) => check.id),
    );
    const newest = task.evidence
      .filter((item) => item.result === "pass" && item.checkId !== undefined && checkIds.has(item.checkId))
      .map((item) => ({ at: Date.parse(item.recordedAt), mode: MODE_LABEL.exec(item.summary)?.[1]?.toLowerCase() }))
      .filter((item) => item.mode !== undefined)
      .sort((left, right) => left.at - right.at)
      .at(-1);
    if (newest !== undefined && newest.mode !== "full") flagged.push(`${criterion.id} (${newest.mode})`);
  }
  if (flagged.length === 0) return [];
  return [
    `Observable criterion ${flagged.join(", ")} reached only a partial or code-only run and the task records no residual risk: run it for real ('harnix skill harnix-exercise') or record the gap with 'harnix workflow --add-risk <id> --text <t>'.`,
  ];
}
