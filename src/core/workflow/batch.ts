import { resolveActiveTask, type TaskRecordV3, type ValidationCheckV3 } from "src/core/tasks/task.js";
import { laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { compareCodeUnits } from "src/utils/order.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";
import { assertTextIntegrity } from "./text-integrity.js";

const sortedUnique = (values: readonly string[]): string[] => [...new Set(values)].sort(compareCodeUnits);

export interface BatchCriterionItem {
  id: string;
  text?: string;
  checks?: readonly string[];
  status?: "pending" | "met" | "waived";
  waiverReason?: string;
}

export interface BatchCheckItem {
  id: string;
  description?: string;
  command?: string;
  scope?: "focused" | "full";
  required?: boolean;
  criteria?: readonly string[];
  inputs?: readonly string[];
}

export interface BatchDecisionItem {
  id: string;
  text: string;
  rationale: string;
}

export interface BatchRiskItem {
  id: string;
  text: string;
  severity?: "low" | "medium" | "high";
}

export interface BatchPathsItem {
  paths?: readonly string[];
  specs?: readonly string[];
}

export interface WorkflowBatchEnvelope {
  criteria?: readonly BatchCriterionItem[];
  checks?: readonly BatchCheckItem[];
  decisions?: readonly BatchDecisionItem[];
  risks?: readonly BatchRiskItem[];
  paths?: BatchPathsItem;
  reason?: string;
}

export function validateWorkflowBatchEnvelope(input: unknown): WorkflowBatchEnvelope {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Workflow batch mutation requires a valid JSON object envelope.");
  }
  const envelope = input as Record<string, unknown>;
  const allowed = new Set(["criteria", "checks", "decisions", "risks", "paths", "reason"]);
  for (const key of Object.keys(envelope)) {
    if (!allowed.has(key)) throw new Error(`Unknown field in batch envelope: ${key}`);
  }
  if (envelope.criteria !== undefined && !Array.isArray(envelope.criteria)) {
    throw new Error("Batch criteria must be an array.");
  }
  if (envelope.checks !== undefined && !Array.isArray(envelope.checks)) {
    throw new Error("Batch checks must be an array.");
  }
  if (envelope.decisions !== undefined) {
    if (!Array.isArray(envelope.decisions)) throw new Error("Batch decisions must be an array.");
    for (const d of envelope.decisions) {
      if (
        typeof d !== "object" ||
        d === null ||
        typeof (d as { id?: unknown }).id !== "string" ||
        typeof (d as { text?: unknown }).text !== "string" ||
        typeof (d as { rationale?: unknown }).rationale !== "string"
      ) {
        throw new Error("Batch decision items require id, text, and rationale strings.");
      }
    }
  }
  if (envelope.risks !== undefined) {
    if (!Array.isArray(envelope.risks)) throw new Error("Batch risks must be an array.");
    for (const r of envelope.risks) {
      if (
        typeof r !== "object" ||
        r === null ||
        typeof (r as { id?: unknown }).id !== "string" ||
        typeof (r as { text?: unknown }).text !== "string"
      ) {
        throw new Error("Batch risk items require id and text strings.");
      }
    }
  }
  assertTextIntegrity(envelope);
  return envelope as WorkflowBatchEnvelope;
}

export async function batchWorkflow(
  root: string,
  input: unknown,
  injectedNow?: string,
): Promise<TaskRecordV3> {
  const envelope = validateWorkflowBatchEnvelope(input);
  const now = await currentInstant(root, injectedNow);
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow batch mutation requires an active task.");
  if (task.schemaVersion !== 3)
    throw new Error("Workflow batch mutation requires a TaskRecord schema v3 task; run --migrate first.");

  const clone: TaskRecordV3 = structuredClone(task);
  clone.updatedAt = laterTimestamp(clone.updatedAt, now);

  if (envelope.paths) {
    if (envelope.paths.paths) clone.relevantPaths = sortedUnique(envelope.paths.paths);
    if (envelope.paths.specs) clone.relevantSpecs = sortedUnique(envelope.paths.specs);
  }

  if (envelope.decisions && envelope.decisions.length > 0) {
    const existing = new Map((clone.decisions ?? []).map((d) => [d.id, d]));
    for (const item of envelope.decisions) {
      existing.set(item.id, { id: item.id, text: item.text, rationale: item.rationale });
    }
    clone.decisions = [...existing.values()];
  }

  if (envelope.risks && envelope.risks.length > 0) {
    const existing = new Map((clone.residualRisks ?? []).map((r) => [r.id, r]));
    for (const item of envelope.risks) {
      existing.set(item.id, { id: item.id, text: item.text, severity: item.severity ?? "medium" });
    }
    clone.residualRisks = [...existing.values()];
  }

  if (envelope.checks && envelope.checks.length > 0) {
    for (const check of envelope.checks) {
      const idx = clone.validationPlan.findIndex((c) => c.id === check.id);
      const base: ValidationCheckV3 = idx >= 0
        ? clone.validationPlan[idx]!
        : {
            id: check.id,
            description: check.description ?? check.id,
            scope: (check.scope as "focused" | "full") ?? "focused",
            required: check.required ?? true,
            criterionIds: sortedUnique(check.criteria ?? []),
            inputs: sortedUnique(check.inputs ?? []),
            ...(check.command ? { command: check.command } : {}),
          };

      const updatedCheck: ValidationCheckV3 = {
        ...base,
        ...(check.description !== undefined ? { description: check.description } : {}),
        ...(check.command !== undefined ? { command: check.command } : {}),
        ...(check.scope !== undefined ? { scope: check.scope } : {}),
        ...(check.required !== undefined ? { required: check.required } : {}),
        ...(check.criteria !== undefined ? { criterionIds: sortedUnique(check.criteria) } : {}),
        ...(check.inputs !== undefined ? { inputs: sortedUnique(check.inputs) } : {}),
      };

      if (idx >= 0) {
        clone.validationPlan[idx] = updatedCheck;
      } else {
        clone.validationPlan.push(updatedCheck);
      }
    }
  }

  if (envelope.criteria && envelope.criteria.length > 0) {
    for (const item of envelope.criteria) {
      const idx = clone.acceptanceCriteria.findIndex((c) => c.id === item.id);
      if (idx >= 0) {
        clone.acceptanceCriteria[idx] = {
          ...clone.acceptanceCriteria[idx]!,
          ...(item.text !== undefined ? { text: item.text } : {}),
          ...(item.status !== undefined ? { status: item.status } : {}),
          ...(item.waiverReason !== undefined ? { waiverReason: item.waiverReason } : {}),
        };
      } else {
        clone.acceptanceCriteria.push({
          id: item.id,
          text: item.text ?? item.id,
          status: item.status ?? "pending",
          evidenceIds: [],
          ...(item.waiverReason ? { waiverReason: item.waiverReason } : {}),
        });
      }

      if (item.checks && item.checks.length > 0) {
        for (const checkId of item.checks) {
          const check = clone.validationPlan.find((c) => c.id === checkId);
          if (check && !check.criterionIds.includes(item.id)) {
            check.criterionIds = sortedUnique([...check.criterionIds, item.id]);
          }
        }
      }
    }
  }

  const isObligationChange = (envelope.criteria?.length ?? 0) > 0 || (envelope.checks?.length ?? 0) > 0;
  const isPastPlanning = clone.checkpoint !== "planning";
  if (isObligationChange && isPastPlanning) {
    if (!envelope.reason || envelope.reason.length < 10) {
      throw new Error("Modifying obligations past planning requires envelope.reason (at least 10 characters).");
    }
    clone.checkpoint = "replan";
    const saved = await saveWorkflow(root, {
      task: clone,
      contractRevision: { reason: envelope.reason },
    });
    return saved as TaskRecordV3;
  }

  const saved = await saveWorkflow(root, { task: clone });
  return saved as TaskRecordV3;
}
