import { unknownIdError } from "src/utils/suggest.js";
import { compareCodeUnits } from "src/utils/order.js";
import type { AcceptanceCriterion, TaskRecordV3, ValidationCheck } from "src/core/tasks/task.js";
import { freshEvidence } from "./criterion.js";

/** Refuses, before anything is written, a request to mark criteria met that the evidence just recorded cannot back. */
export function assertMarkableBy(
  task: TaskRecordV3,
  check: ValidationCheck,
  result: string,
  ids: readonly string[],
): void {
  if (result !== "pass") throw new Error("--criterion --met with --evidence needs --result pass.");
  for (const id of ids) {
    const criterion = task.acceptanceCriteria.find((candidate) => candidate.id === id);
    if (criterion === undefined)
      throw unknownIdError(
        `Workflow criterion ${id} is not declared.`,
        "criterion",
        id,
        task.acceptanceCriteria.map((candidate) => candidate.id),
      );
    if (criterion.status === "waived") throw new Error(`Workflow criterion ${id} is waived and cannot be marked met.`);
    if (!(check.criterionIds ?? []).includes(id))
      throw new Error(`Workflow criterion ${id}: check ${check.id} does not cover it, so its pass cannot back it.`);
  }
}

/**
 * The criteria with `ids` met in the same save that records the evidence, by the rule of `--criterion --met`: every
 * required check covering a criterion needs a fresh pass (the one just recorded counts) or an accepted baseline, and
 * the criterion links all of those passes. Throws before any write when one check is not fresh.
 */
export async function markMetFresh(
  root: string,
  candidate: TaskRecordV3,
  ids: readonly string[],
): Promise<AcceptanceCriterion[]> {
  const marked = new Map<string, string[]>();
  for (const id of new Set(ids)) marked.set(id, (await freshEvidence(root, candidate, id)).sort(compareCodeUnits));
  return candidate.acceptanceCriteria.map((criterion) =>
    marked.has(criterion.id) ? { ...criterion, status: "met", evidenceIds: marked.get(criterion.id) ?? [] } : criterion,
  );
}
