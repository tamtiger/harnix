import type { TaskRecordV3 } from "src/core/tasks/task.js";
import { laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { activeV3 } from "./plan-edit.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";

type CheckBaselineWaiver = NonNullable<TaskRecordV3["validationPlan"][number]["baseline"]>;
const CLASSIFICATIONS = ["pre-existing", "introduced", "environment", "unknown"] as const;
const RESULTS = ["pass", "fail"] as const;

export interface BaselineInput {
  checkId: string;
  result: string;
  classification: string;
  authorizedBy: string;
  scope: string;
}

function oneOf<T extends string>(values: readonly T[], value: string, flag: string): T {
  if (!values.includes(value as T)) throw new Error(`${flag} must be ${values.join(", ")}.`);
  return value as T;
}

function requireText(value: string, flag: string): string {
  const text = value.trim();
  if (text === "") throw new Error(`${flag} must not be empty.`);
  return text;
}

/** Review data (outside the contract hash and every check digest), so it needs no reason and no replan. */
export async function setBaselineWorkflow(
  root: string,
  input: BaselineInput,
  injectedNow?: string,
): Promise<TaskRecordV3> {
  const now = await currentInstant(root, injectedNow);
  const task = await activeV3(root);
  const baseline: CheckBaselineWaiver = {
    result: oneOf(RESULTS, input.result, "--result"),
    classification: oneOf(CLASSIFICATIONS, input.classification, "--classification"),
    authorizedBy: requireText(input.authorizedBy, "--authorized-by"),
    scope: requireText(input.scope, "--scope"),
  };
  if (!task.validationPlan.some((check) => check.id === input.checkId))
    throw new Error(`Workflow check ${input.checkId} is not declared.`);
  const validationPlan = task.validationPlan.map((check) =>
    check.id === input.checkId ? { ...check, baseline } : check,
  );
  return (await saveWorkflow(root, {
    task: { ...task, validationPlan, updatedAt: laterTimestamp(task.updatedAt, now) },
  })) as TaskRecordV3;
}
