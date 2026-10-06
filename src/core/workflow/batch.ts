import { type TaskRecordV3 } from "src/core/tasks/task.js";
import { laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import {
  applyBatchChecks,
  applyBatchCriteria,
  applyBatchDecisions,
  applyBatchPaths,
  applyBatchRisks,
  assertBatchReferences,
} from "./batch-apply.js";
import { validateWorkflowBatchEnvelope, type WorkflowBatchEnvelope } from "./batch-validate.js";
import { saveObligationEdit } from "./plan-edit.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";
import { resolveEditableTask } from "./target-task.js";

export {
  validateWorkflowBatchEnvelope,
  type BatchCheckItem,
  type BatchCriterionItem,
  type BatchDecisionItem,
  type BatchPathsItem,
  type BatchRiskItem,
  type WorkflowBatchEnvelope,
} from "./batch-validate.js";

function changesObligations(envelope: WorkflowBatchEnvelope): boolean {
  return (envelope.criteria?.length ?? 0) > 0 || (envelope.checks?.length ?? 0) > 0;
}

export async function batchWorkflow(root: string, input: unknown, injectedNow?: string): Promise<TaskRecordV3> {
  const envelope = validateWorkflowBatchEnvelope(input);
  const now = await currentInstant(root, injectedNow);
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveEditableTask(harnixRoot);
  if (!task) throw new Error("Workflow batch mutation requires an active task.");
  if (task.schemaVersion !== 3)
    throw new Error("Workflow batch mutation requires a TaskRecord schema v3 task; run --migrate first.");

  const clone: TaskRecordV3 = structuredClone(task);
  applyBatchPaths(clone, envelope.paths);
  applyBatchDecisions(clone, envelope.decisions);
  applyBatchRisks(clone, envelope.risks);
  applyBatchChecks(clone, envelope.checks);
  applyBatchCriteria(clone, envelope.criteria);
  assertBatchReferences(clone, envelope);

  // Obligations follow exactly the --set-check rules: editable while planning, one guarded replan save afterwards.
  if (changesObligations(envelope)) return saveObligationEdit(root, task, clone, { reason: envelope.reason }, now);
  clone.updatedAt = laterTimestamp(clone.updatedAt, now);
  return (await saveWorkflow(root, { task: clone })) as TaskRecordV3;
}
