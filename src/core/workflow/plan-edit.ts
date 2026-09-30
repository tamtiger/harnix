import { resolveActiveTask, type TaskRecordV3, type ValidationCheckV3 } from "src/core/tasks/task.js";
import { laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { compareCodeUnits } from "src/utils/order.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";

const REASON_MIN = 10;
const REASON_MAX = 1000;

export interface CheckEdit {
  id: string;
  description?: string | undefined;
  command?: string | undefined;
  scope?: string | undefined;
  required?: boolean | undefined;
  criteria?: readonly string[] | undefined;
  inputs?: readonly string[] | undefined;
}

export interface PlanEditOptions {
  reason?: string | undefined;
}

const sortedUnique = (values: readonly string[]): string[] => [...new Set(values)].sort(compareCodeUnits);

async function activeV3(root: string): Promise<TaskRecordV3> {
  const task = await resolveActiveTask(await resolveSafeHarnixPath(root));
  if (!task) throw new Error("Workflow plan edit requires an active task.");
  if (task.schemaVersion !== 3)
    throw new Error("Workflow plan edit requires a TaskRecord schema v3 task; run --migrate first.");
  return task;
}

const FROZEN_HINT = /contractRevision|freeze/iu;

function revisionReason(options: PlanEditOptions): string | undefined {
  const reason = options.reason?.trim();
  if (reason === undefined || reason === "") return undefined;
  if (reason.length < REASON_MIN || reason.length > REASON_MAX)
    throw new Error(`--reason must be ${REASON_MIN}-${REASON_MAX} characters.`);
  return reason;
}

/**
 * Saves an obligation edit. A draft still in planning is an ordinary save; once
 * obligations are frozen (past planning, or a migrated legacy task) it becomes
 * the single guarded replan save (checkpoint replan plus contractRevision), so a
 * caller never builds that envelope by hand and only supplies --reason.
 */
async function saveObligationEdit(
  root: string,
  task: TaskRecordV3,
  edited: TaskRecordV3,
  options: PlanEditOptions,
  now: string,
): Promise<TaskRecordV3> {
  const updatedAt = laterTimestamp(task.updatedAt, now);
  const reason = revisionReason(options);
  const revise = async (contractReason: string): Promise<TaskRecordV3> =>
    (await saveWorkflow(root, {
      task: { ...edited, checkpoint: "replan", updatedAt },
      contractRevision: { reason: contractReason },
    })) as TaskRecordV3;
  if (task.status !== "planning") {
    if (reason === undefined)
      throw new Error(
        `--reason (${REASON_MIN}-${REASON_MAX} characters) is required to revise obligations after planning.`,
      );
    return revise(reason);
  }
  try {
    return (await saveWorkflow(root, { task: { ...edited, updatedAt } })) as TaskRecordV3;
  } catch (error: unknown) {
    if (!(error instanceof Error) || !FROZEN_HINT.test(error.message)) throw error;
    if (reason === undefined)
      throw new Error(
        `${error.message} Provide --reason (${REASON_MIN}-${REASON_MAX} characters) to revise frozen obligations.`,
      );
    return revise(reason);
  }
}

function resolveScope(existing: ValidationCheckV3 | undefined, edit: CheckEdit): ValidationCheckV3["scope"] {
  const scope = edit.scope ?? existing?.scope;
  if (scope === undefined) throw new Error("--scope is required for a new check.");
  if (scope !== "focused" && scope !== "full") throw new Error("--scope must be focused or full.");
  return scope;
}

function resolveDescription(existing: ValidationCheckV3 | undefined, edit: CheckEdit): string {
  const description = edit.description ?? existing?.description;
  if (description === undefined || description.trim() === "")
    throw new Error("--description is required for a new check.");
  return description;
}

function mergeCheck(existing: ValidationCheckV3 | undefined, edit: CheckEdit): ValidationCheckV3 {
  const scope = resolveScope(existing, edit);
  const description = resolveDescription(existing, edit);
  const required = edit.required ?? existing?.required ?? true;
  const criterionIds = sortedUnique(edit.criteria ?? existing?.criterionIds ?? []);
  const inputs = sortedUnique(edit.inputs ?? existing?.inputs ?? []);
  if (required && (criterionIds.length === 0 || inputs.length === 0))
    throw new Error(`Check ${edit.id} is required: --criteria and at least one --input are needed.`);
  const command = edit.command ?? existing?.command;
  return {
    id: edit.id,
    description,
    ...(command === undefined ? {} : { command }),
    scope,
    required,
    criterionIds,
    inputs,
  };
}

export async function setCheckWorkflow(
  root: string,
  edit: CheckEdit,
  options: PlanEditOptions = {},
  injectedNow?: string,
): Promise<TaskRecordV3> {
  const now = await currentInstant(root, injectedNow);
  const task = await activeV3(root);
  const existing = task.validationPlan.find((check) => check.id === edit.id);
  const merged = mergeCheck(existing, edit);
  const validationPlan =
    existing === undefined
      ? [...task.validationPlan, merged]
      : task.validationPlan.map((check) => (check.id === edit.id ? merged : check));
  return saveObligationEdit(root, task, { ...task, validationPlan }, options, now);
}

export async function addCriterionWorkflow(
  root: string,
  input: { id: string; text: string; checks: readonly string[] },
  options: PlanEditOptions = {},
  injectedNow?: string,
): Promise<TaskRecordV3> {
  const now = await currentInstant(root, injectedNow);
  const task = await activeV3(root);
  const text = input.text.trim();
  if (text === "") throw new Error("--text must not be empty.");
  if (task.acceptanceCriteria.some((criterion) => criterion.id === input.id))
    throw new Error(`Acceptance criterion ${input.id} already exists.`);
  if (input.checks.length === 0)
    throw new Error("workflow --add-criterion requires --check <check-id> so the criterion is covered.");
  for (const checkId of input.checks)
    if (!task.validationPlan.some((check) => check.id === checkId))
      throw new Error(`Workflow check ${checkId} is not declared.`);
  const validationPlan = task.validationPlan.map((check) =>
    input.checks.includes(check.id)
      ? { ...check, criterionIds: sortedUnique([...check.criterionIds, input.id]) }
      : check,
  );
  const acceptanceCriteria = [
    ...task.acceptanceCriteria,
    { id: input.id, text, status: "pending" as const, evidenceIds: [] },
  ];
  return saveObligationEdit(root, task, { ...task, acceptanceCriteria, validationPlan }, options, now);
}

export async function setPathsWorkflow(
  root: string,
  input: { paths?: readonly string[] | undefined; specs?: readonly string[] | undefined },
  injectedNow?: string,
): Promise<TaskRecordV3> {
  if (input.paths === undefined && input.specs === undefined)
    throw new Error("workflow --set-paths requires --relevant-path and/or --relevant-spec.");
  const now = await currentInstant(root, injectedNow);
  const task = await activeV3(root);
  const edited: TaskRecordV3 = {
    ...task,
    relevantPaths: input.paths === undefined ? task.relevantPaths : sortedUnique(input.paths),
    relevantSpecs: input.specs === undefined ? task.relevantSpecs : sortedUnique(input.specs),
    updatedAt: laterTimestamp(task.updatedAt, now),
  };
  return (await saveWorkflow(root, { task: edited })) as TaskRecordV3;
}
