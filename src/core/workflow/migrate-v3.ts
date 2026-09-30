import {
  createTaskV3MigrationEvidence,
  resolveActiveTask,
  type TaskRecord,
  type TaskRecordV3,
  type ValidationCheckV3,
} from "src/core/tasks/task.js";
import { assertExactFields, isRecord, laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { compareCodeUnits } from "src/utils/order.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";

const RETIRED_INPUT = "@task-contract";

interface CheckOverride {
  criterionIds?: string[];
  inputs?: string[];
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    throw new Error(`Workflow migration ${label} must be an array of strings.`);
  return value as string[];
}

function parseOverrides(envelope: unknown): Map<string, CheckOverride> {
  const overrides = new Map<string, CheckOverride>();
  if (envelope === undefined) return overrides;
  if (!isRecord(envelope)) throw new Error("Workflow migration envelope must be an object shaped { checks? }.");
  assertExactFields(envelope, new Set(["checks"]), "Workflow migration envelope");
  if (envelope.checks === undefined) return overrides;
  if (!isRecord(envelope.checks)) throw new Error("Workflow migration checks must be an object keyed by check id.");
  for (const [id, raw] of Object.entries(envelope.checks)) {
    if (!isRecord(raw)) throw new Error(`Workflow migration checks.${id} must be an object.`);
    assertExactFields(raw, new Set(["criterionIds", "inputs"]), `Workflow migration checks.${id}`);
    const override: CheckOverride = {};
    if (raw.criterionIds !== undefined)
      override.criterionIds = stringArray(raw.criterionIds, `checks.${id}.criterionIds`);
    if (raw.inputs !== undefined) override.inputs = stringArray(raw.inputs, `checks.${id}.inputs`);
    overrides.set(id, override);
  }
  return overrides;
}

const sortedUnique = (values: readonly string[]): string[] => [...new Set(values)].sort(compareCodeUnits);

function migrateChecks(task: TaskRecord, overrides: Map<string, CheckOverride>): ValidationCheckV3[] {
  const missing: string[] = [];
  const checks = task.validationPlan.map((check): ValidationCheckV3 => {
    const legacy = check as { criterionIds?: string[]; inputs?: string[] };
    const override = overrides.get(check.id);
    const criterionIds = sortedUnique(override?.criterionIds ?? legacy.criterionIds ?? []);
    const inputs = sortedUnique(override?.inputs ?? (legacy.inputs ?? []).filter((input) => input !== RETIRED_INPUT));
    const absent = [criterionIds.length === 0 ? "criterionIds" : "", inputs.length === 0 ? "inputs" : ""].filter(
      Boolean,
    );
    if (check.required && absent.length > 0) missing.push(`${check.id} (${absent.join(", ")})`);
    return {
      id: check.id,
      description: check.description,
      ...(check.command === undefined ? {} : { command: check.command }),
      scope: check.scope,
      required: check.required,
      criterionIds,
      inputs,
    };
  });
  if (missing.length > 0)
    throw new Error(
      `Workflow migration needs criterionIds/inputs for: ${missing.join("; ")}. Provide { "checks": { "<id>": { "criterionIds": [...], "inputs": [...] } } } on stdin.`,
    );
  return checks;
}

/**
 * One-call migration of the active unfinished legacy task to schema v3. It
 * only assembles the candidate the documented migration save already accepts,
 * so every preservation rule is still enforced by the save path.
 */
export async function migrateToV3Workflow(
  root: string,
  envelope: unknown,
  injectedNow?: string,
): Promise<TaskRecordV3> {
  const now = await currentInstant(root, injectedNow);
  const overrides = parseOverrides(envelope);
  const task = await resolveActiveTask(await resolveSafeHarnixPath(root));
  if (!task) throw new Error("Workflow migration requires an active task.");
  if (task.schemaVersion === 3) throw new Error("Task is already TaskRecord schema v3; nothing to migrate.");
  if (task.status === "completed" || task.status === "cancelled" || task.status === "blocked")
    throw new Error("Workflow migration applies only to an unfinished, unblocked task.");
  const validationPlan = migrateChecks(task, overrides);
  const updatedAt = laterTimestamp(task.updatedAt, now);
  const candidate: TaskRecordV3 = {
    ...task,
    schemaVersion: 3,
    validationPlan,
    evidence: [...task.evidence, createTaskV3MigrationEvidence(task.id, updatedAt)],
    updatedAt,
  };
  return (await saveWorkflow(root, { task: candidate })) as TaskRecordV3;
}
