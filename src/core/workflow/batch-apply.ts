import type { TaskRecordV3, ValidationCheckV3 } from "src/core/tasks/task.js";
import { compareCodeUnits } from "src/utils/order.js";
import type { BatchCheckItem, BatchCriterionItem, WorkflowBatchEnvelope } from "./batch-validate.js";

const sortedUnique = (values: readonly string[]): string[] => [...new Set(values)].sort(compareCodeUnits);

export function applyBatchPaths(task: TaskRecordV3, paths: WorkflowBatchEnvelope["paths"]): void {
  if (!paths) return;
  if (paths.paths) task.relevantPaths = sortedUnique(paths.paths);
  if (paths.specs) task.relevantSpecs = sortedUnique(paths.specs);
}

function requireText(value: string, field: string): string {
  const text = value.trim();
  if (text === "") throw new Error(`Batch ${field} must not be empty.`);
  return text;
}

/** Review notes are append-only like --add-decision and --add-risk: a repeated id is an error, never an overwrite. */
export function applyBatchDecisions(task: TaskRecordV3, decisions: WorkflowBatchEnvelope["decisions"]): void {
  if (!decisions || decisions.length === 0) return;
  const next = [...(task.decisions ?? [])];
  for (const item of decisions) {
    if (next.some((decision) => decision.id === item.id)) throw new Error(`Decision ${item.id} already exists.`);
    next.push({
      id: item.id,
      text: requireText(item.text, "decision text"),
      rationale: requireText(item.rationale, "decision rationale"),
    });
  }
  task.decisions = next;
}

export function applyBatchRisks(task: TaskRecordV3, risks: WorkflowBatchEnvelope["risks"]): void {
  if (!risks || risks.length === 0) return;
  const next = [...(task.residualRisks ?? [])];
  for (const item of risks) {
    if (next.some((risk) => risk.id === item.id)) throw new Error(`Residual risk ${item.id} already exists.`);
    next.push({ id: item.id, text: requireText(item.text, "risk text"), severity: item.severity ?? "low" });
  }
  task.residualRisks = next;
}

function newCheck(item: BatchCheckItem): ValidationCheckV3 {
  return {
    id: item.id,
    description: item.description ?? item.id,
    scope: item.scope ?? "focused",
    required: item.required ?? true,
    criterionIds: sortedUnique(item.criteria ?? []),
    inputs: sortedUnique(item.inputs ?? []),
    ...(item.command ? { command: item.command } : {}),
  };
}

function mergeCheck(base: ValidationCheckV3, item: BatchCheckItem): ValidationCheckV3 {
  return {
    ...base,
    ...(item.description !== undefined ? { description: item.description } : {}),
    ...(item.command !== undefined ? { command: item.command } : {}),
    ...(item.scope !== undefined ? { scope: item.scope } : {}),
    ...(item.required !== undefined ? { required: item.required } : {}),
    ...(item.criteria !== undefined ? { criterionIds: sortedUnique(item.criteria) } : {}),
    ...(item.inputs !== undefined ? { inputs: sortedUnique(item.inputs) } : {}),
  };
}

export function applyBatchChecks(task: TaskRecordV3, checks: WorkflowBatchEnvelope["checks"]): void {
  for (const item of checks ?? []) {
    const index = task.validationPlan.findIndex((c) => c.id === item.id);
    const existing = index >= 0 ? task.validationPlan[index] : undefined;
    if (existing) task.validationPlan[index] = mergeCheck(existing, item);
    else task.validationPlan.push(mergeCheck(newCheck(item), item));
  }
}

function upsertCriterion(task: TaskRecordV3, item: BatchCriterionItem): void {
  const index = task.acceptanceCriteria.findIndex((c) => c.id === item.id);
  const existing = index >= 0 ? task.acceptanceCriteria[index] : undefined;
  if (existing) {
    task.acceptanceCriteria[index] = {
      ...existing,
      ...(item.text !== undefined ? { text: item.text } : {}),
      ...(item.status !== undefined ? { status: item.status } : {}),
      ...(item.waiverReason !== undefined ? { waiverReason: item.waiverReason } : {}),
    };
    return;
  }
  task.acceptanceCriteria.push({
    id: item.id,
    text: item.text ?? item.id,
    status: item.status ?? "pending",
    evidenceIds: [],
    ...(item.waiverReason ? { waiverReason: item.waiverReason } : {}),
  });
}

function mapCriterionToChecks(task: TaskRecordV3, item: BatchCriterionItem): void {
  for (const checkId of item.checks ?? []) {
    const check = task.validationPlan.find((c) => c.id === checkId);
    if (check && !check.criterionIds.includes(item.id)) {
      check.criterionIds = sortedUnique([...check.criterionIds, item.id]);
    }
  }
}

export function applyBatchCriteria(task: TaskRecordV3, criteria: WorkflowBatchEnvelope["criteria"]): void {
  for (const item of criteria ?? []) {
    upsertCriterion(task, item);
    mapCriterionToChecks(task, item);
  }
}

/**
 * Cross references are resolved after every item is applied, so their order in the envelope never matters; a
 * reference that still points nowhere is reported with every other one at once.
 */
export function assertBatchReferences(task: TaskRecordV3, envelope: WorkflowBatchEnvelope): void {
  const checkIds = new Set(task.validationPlan.map((check) => check.id));
  const criterionIds = new Set(task.acceptanceCriteria.map((criterion) => criterion.id));
  const problems: string[] = [];
  for (const item of envelope.criteria ?? [])
    for (const checkId of item.checks ?? [])
      if (!checkIds.has(checkId)) problems.push(`criterion ${item.id} names unknown check ${checkId}`);
  for (const item of envelope.checks ?? [])
    for (const criterionId of item.criteria ?? [])
      if (!criterionIds.has(criterionId)) problems.push(`check ${item.id} names unknown criterion ${criterionId}`);
  if (problems.length > 0)
    throw new Error(`Batch references do not resolve (order does not matter): ${problems.join("; ")}.`);
}
