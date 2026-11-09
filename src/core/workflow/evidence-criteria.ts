import { unknownIdError } from "src/utils/suggest.js";
import type { AcceptanceCriterion, TaskRecord, ValidationCheck } from "src/core/tasks/task.js";

/** Refuses, before anything is written, a request to mark criteria met that the evidence just recorded cannot back. */
export function assertMarkableBy(
  task: TaskRecord,
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

/** The criteria with `ids` met from the one evidence item, in the same save that records it. */
export function markMetBy(
  criteria: readonly AcceptanceCriterion[],
  ids: readonly string[],
  evidenceId: string,
): AcceptanceCriterion[] {
  const marked = new Set(ids);
  return criteria.map((criterion) =>
    marked.has(criterion.id) ? { ...criterion, status: "met", evidenceIds: [evidenceId] } : criterion,
  );
}
