import { assertTextIntegrity } from "./text-integrity.js";

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

const SEVERITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FIELDS = new Set(["criteria", "checks", "decisions", "risks", "paths", "reason"]);

function hasString(item: unknown, field: string): boolean {
  return typeof item === "object" && item !== null && typeof (item as Record<string, unknown>)[field] === "string";
}

function assertArray(value: unknown, message: string): void {
  if (value !== undefined && !Array.isArray(value)) throw new Error(message);
}

function assertItems(value: unknown, fields: readonly string[], message: string): void {
  if (value === undefined) return;
  for (const item of value as unknown[]) {
    if (!fields.every((field) => hasString(item, field))) throw new Error(message);
  }
}

function assertSeverities(risks: unknown): void {
  if (risks === undefined) return;
  for (const risk of risks as { severity?: unknown }[]) {
    if (risk.severity !== undefined && !(typeof risk.severity === "string" && SEVERITIES.has(risk.severity))) {
      throw new Error("Batch risk severity must be low, medium or high.");
    }
  }
}

export function validateWorkflowBatchEnvelope(input: unknown): WorkflowBatchEnvelope {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Workflow batch mutation requires a valid JSON object envelope.");
  }
  const envelope = input as WorkflowBatchEnvelope & Record<string, unknown>;
  for (const key of Object.keys(envelope)) {
    if (!ALLOWED_FIELDS.has(key)) throw new Error(`Unknown field in batch envelope: ${key}`);
  }
  assertArray(envelope.criteria, "Batch criteria must be an array.");
  assertArray(envelope.checks, "Batch checks must be an array.");
  assertArray(envelope.decisions, "Batch decisions must be an array.");
  assertItems(
    envelope.decisions,
    ["id", "text", "rationale"],
    "Batch decision items require id, text, and rationale strings.",
  );
  assertArray(envelope.risks, "Batch risks must be an array.");
  assertItems(envelope.risks, ["id", "text"], "Batch risk items require id and text strings.");
  assertSeverities(envelope.risks);
  assertTextIntegrity(envelope);
  return envelope;
}
