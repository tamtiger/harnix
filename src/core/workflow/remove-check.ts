import type { TaskRecordV3 } from "src/core/tasks/task.js";
import { unknownIdError } from "src/utils/suggest.js";
import { activeV3, saveObligationEdit, type PlanEditOptions } from "./plan-edit.js";
import { currentInstant } from "./support.js";

/**
 * Drops one check that never recorded evidence (for example a duplicate suite check), so it no longer has to run.
 * It refuses a check with evidence (retire it with `--replace-check`) and one whose removal would leave a criterion
 * with no required check. Like every obligation edit it is free in planning and needs `--reason` afterwards.
 */
export async function removeCheckWorkflow(
  root: string,
  id: string,
  options: PlanEditOptions = {},
  injectedNow?: string,
): Promise<TaskRecordV3> {
  const now = await currentInstant(root, injectedNow);
  const task = await activeV3(root);
  const check = task.validationPlan.find((candidate) => candidate.id === id);
  if (check === undefined)
    throw unknownIdError(
      `Workflow check ${id} is not declared.`,
      "check",
      id,
      task.validationPlan.map((candidate) => candidate.id),
    );
  if (task.evidence.some((evidence) => evidence.checkId === id))
    throw new Error(
      `Check ${id} cannot be removed: it already recorded evidence. Retire it with harnix workflow --replace-check ${id} <new-id> --reason "<why>".`,
    );
  const rest = task.validationPlan.filter((candidate) => candidate.id !== id);
  const uncovered = check.required
    ? check.criterionIds.filter((criterionId) => {
        const waived = task.acceptanceCriteria.find((criterion) => criterion.id === criterionId)?.status === "waived";
        return !waived && !rest.some((other) => other.required && other.criterionIds.includes(criterionId));
      })
    : [];
  if (uncovered.length > 0)
    throw new Error(
      `Check ${id} cannot be removed: criterion ${uncovered.join(", ")} would have no required check; add or edit another check first.`,
    );
  return saveObligationEdit(root, task, { ...task, validationPlan: rest }, options, now);
}
