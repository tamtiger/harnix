import type { TaskRecordV3, ValidationCheckV3 } from "src/core/tasks/task.js";
import { compareCodeUnits } from "src/utils/order.js";
import { equivalentCommand } from "./command-match.js";
import {
  activeV3,
  resolveDescription,
  resolveScope,
  saveObligationEdit,
  sortedUnique,
  type PlanEditOptions,
} from "./plan-edit.js";
import { currentInstant } from "./support.js";

export interface ReplaceCheckInput {
  oldId: string;
  newId: string;
  description?: string | undefined;
  command?: string | undefined;
  cwd?: string | undefined;
  scope?: string | undefined;
  inputs?: readonly string[] | undefined;
  criteria?: readonly string[] | undefined;
}

/** What a check runs and over what: the part a replacement must change for the retired failure to be a new attempt. */
function sameCheckDefinition(left: ValidationCheckV3, right: ValidationCheckV3): boolean {
  const sameCommandText =
    left.command === undefined || right.command === undefined
      ? left.command === right.command
      : equivalentCommand(left.command, right.command);
  return (
    sameCommandText &&
    (left.cwd ?? ".") === (right.cwd ?? ".") &&
    left.inputs.length === right.inputs.length &&
    left.inputs.every((input, index) => input === right.inputs[index])
  );
}

function updateReplacementCheck(
  existingNew: ValidationCheckV3,
  oldCheck: ValidationCheckV3,
  input: ReplaceCheckInput,
): ValidationCheckV3 {
  const scope =
    input.scope !== undefined ? resolveScope(existingNew, { id: input.newId, scope: input.scope }) : existingNew.scope;
  const description =
    input.description !== undefined
      ? resolveDescription(existingNew, { id: input.newId, description: input.description })
      : existingNew.description;
  const command = input.command !== undefined ? input.command : existingNew.command;
  const cwd = input.cwd !== undefined ? input.cwd : existingNew.cwd;
  const inputs = input.inputs !== undefined ? sortedUnique(input.inputs) : existingNew.inputs;
  const criteria = sortedUnique([...(input.criteria ?? existingNew.criterionIds), ...oldCheck.criterionIds]);
  return {
    ...existingNew,
    description,
    scope,
    required: true,
    inputs,
    criterionIds: criteria,
    ...(command === undefined ? {} : { command }),
    ...(cwd === undefined ? {} : { cwd }),
  };
}

function createReplacementCheck(oldCheck: ValidationCheckV3, input: ReplaceCheckInput): ValidationCheckV3 {
  const scope = resolveScope(undefined, { id: input.newId, scope: input.scope ?? oldCheck.scope });
  const description = resolveDescription(undefined, {
    id: input.newId,
    description: input.description ?? `Replacement for ${input.oldId}`,
  });
  const inputs = sortedUnique(input.inputs ?? oldCheck.inputs);
  const criteria = sortedUnique(input.criteria ?? oldCheck.criterionIds);
  const cwd = input.cwd !== undefined ? input.cwd : oldCheck.cwd;
  const command = input.command ?? oldCheck.command;
  if (inputs.length === 0) throw new Error(`Replacement check ${input.newId} requires at least one --input.`);
  return {
    id: input.newId,
    description,
    scope,
    required: true,
    criterionIds: criteria,
    inputs,
    ...(command === undefined ? {} : { command }),
    ...(cwd === undefined ? {} : { cwd }),
  };
}

export async function replaceCheckWorkflow(
  root: string,
  input: ReplaceCheckInput,
  options: PlanEditOptions = {},
  injectedNow?: string,
): Promise<TaskRecordV3> {
  const now = await currentInstant(root, injectedNow);
  const task = await activeV3(root);
  const oldCheck = task.validationPlan.find((check) => check.id === input.oldId);
  if (oldCheck === undefined) throw new Error(`Workflow check to replace ${input.oldId} is not declared.`);
  if (input.oldId === input.newId) throw new Error("Replacement check ID must differ from the check being replaced.");
  if (!oldCheck.required) throw new Error(`Workflow check ${input.oldId} is not a required check.`);
  if (task.evidence.some((evidence) => evidence.checkId === input.oldId && evidence.result === "pass"))
    throw new Error(`Workflow cannot replace check ${input.oldId} after passing evidence.`);

  const retiredOld: ValidationCheckV3 = { ...oldCheck, required: false };
  const existingNew = task.validationPlan.find((check) => check.id === input.newId);

  const newCheck =
    existingNew !== undefined
      ? updateReplacementCheck(existingNew, oldCheck, input)
      : createReplacementCheck(oldCheck, input);

  if (sameCheckDefinition(oldCheck, newCheck)) {
    throw new Error(
      `Replacement check ${input.newId} must differ from the retired check ${input.oldId} in command, inputs or cwd; a renamed copy cannot reset the retry limit.`,
    );
  }
  const missing = oldCheck.criterionIds.filter((cid) => !newCheck.criterionIds.includes(cid));
  if (missing.length > 0) {
    throw new Error(
      `Replacement check ${input.newId} must cover all criteria of ${input.oldId} (missing: ${missing.join(", ")}).`,
    );
  }

  const otherChecks = task.validationPlan.filter((check) => check.id !== input.oldId && check.id !== input.newId);
  const validationPlan = [...otherChecks, retiredOld, newCheck].sort((left, right) =>
    compareCodeUnits(left.id, right.id),
  );

  return saveObligationEdit(root, task, { ...task, validationPlan }, options, now);
}
