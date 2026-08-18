import { Buffer } from "node:buffer";

import { compareCodeUnits } from "../../utils/order.js";
import type { TaskRecord } from "./task.js";

export type ReadyTraceDiagnosticCode =
  | "artifact-too-large"
  | "line-too-long"
  | "placeholder"
  | "criterion-missing"
  | "criterion-duplicate"
  | "slice-checklist-missing"
  | "slice-duplicate"
  | "slice-detail-missing"
  | "slice-metadata-missing"
  | "unknown-criterion"
  | "unknown-check"
  | "unsafe-path"
  | "orphan-criterion"
  | "orphan-required-check";

export interface ReadyTraceDiagnosticV1 {
  code: ReadyTraceDiagnosticCode;
  artifact: "prd.md" | "plan.md" | "task.json";
  id?: string;
  line?: number;
  message: string;
}

export interface ReadyTraceReportV1 {
  generator: "harnix";
  schemaVersion: 1;
  taskId: string;
  status: "pass" | "fail";
  diagnostics: ReadyTraceDiagnosticV1[];
}

export interface ReadyTraceInput {
  task: TaskRecord;
  prd: string;
  plan: string;
}

const MAX_ARTIFACT_BYTES = 1_048_576;
const MAX_LINE_LENGTH = 4_096;
const MAX_SLICES = 256;
const MAX_REFERENCES = 1_024;
const sliceIdPattern = /^[A-Z][A-Z0-9-]*$/u;
const placeholderPattern = /(?:\b(?:TBD|TODO|PLACEHOLDER)\b|\?\?\?|<fill-me>)/iu;

interface ParsedArtifact {
  lines: Array<{ text: string; line: number }>;
  bounded: boolean;
}

interface SliceDetail {
  id: string;
  line: number;
  criteria: string[];
  checks: string[];
  paths: string[];
  metadataComplete: boolean;
}

export function auditReadyTrace(input: ReadyTraceInput): ReadyTraceReportV1 {
  const diagnostics: ReadyTraceDiagnosticV1[] = [];
  const prd = parseArtifact("prd.md", input.prd, diagnostics);
  const plan = parseArtifact("plan.md", input.plan, diagnostics);
  const taskCriteria = new Map(input.task.acceptanceCriteria.map((criterion) => [criterion.id, criterion]));
  const taskChecks = new Map(input.task.validationPlan.map((check) => [check.id, check]));

  const criterionHeadings = new Map<string, number[]>();
  if (prd.bounded) {
    for (const entry of prd.lines) {
      const match = /^### AC `([^`]+)`\s*$/u.exec(entry.text);
      if (match) addLine(criterionHeadings, match[1]!, entry.line);
    }
    for (const criterion of input.task.acceptanceCriteria) {
      const lines = criterionHeadings.get(criterion.id) ?? [];
      if (lines.length === 0) diagnostics.push(diagnostic("criterion-missing", "prd.md", "Acceptance criterion heading is missing.", criterion.id));
      if (lines.length > 1) diagnostics.push(diagnostic("criterion-duplicate", "prd.md", "Acceptance criterion heading is duplicated.", criterion.id, lines[1]));
    }
    for (const [id, lines] of criterionHeadings) {
      if (!taskCriteria.has(id)) diagnostics.push(diagnostic("unknown-criterion", "prd.md", "PRD references an unknown acceptance criterion.", safeId(id), lines[0]));
    }
  }

  const checklist = new Map<string, number[]>();
  const details = new Map<string, SliceDetail[]>();
  if (plan.bounded) {
    for (const entry of plan.lines) {
      const match = /^- \[[ xX]\] `([^`]+)` — .+$/u.exec(entry.text);
      if (match) addLine(checklist, match[1]!, entry.line);
    }
    for (let index = 0; index < plan.lines.length; index += 1) {
      const heading = /^### Slice `([^`]+)`\s*$/u.exec(plan.lines[index]!.text);
      if (!heading) continue;
      const id = heading[1]!;
      const block: Array<{ text: string; line: number }> = [];
      for (let cursor = index + 1; cursor < plan.lines.length && !/^### Slice `/u.test(plan.lines[cursor]!.text); cursor += 1) block.push(plan.lines[cursor]!);
      const criteria = metadata(block, "Criteria");
      const checks = metadata(block, "Checks");
      const paths = metadata(block, "Paths");
      const detail: SliceDetail = {
        id,
        line: plan.lines[index]!.line,
        criteria: criteria.values,
        checks: checks.values,
        paths: paths.values,
        metadataComplete: criteria.present && checks.present && paths.present && criteria.values.length > 0 && checks.values.length > 0 && paths.values.length > 0,
      };
      const existing = details.get(id) ?? [];
      existing.push(detail);
      details.set(id, existing);
    }

    const sliceIds = new Set([...checklist.keys(), ...details.keys()]);
    if (sliceIds.size > MAX_SLICES) diagnostics.push(diagnostic("artifact-too-large", "plan.md", "Ready trace exceeds the slice bound."));
    let references = 0;
    for (const id of [...sliceIds].sort(compareCodeUnits).slice(0, MAX_SLICES)) {
      const checklistLines = checklist.get(id) ?? [];
      const sliceDetails = details.get(id) ?? [];
      if (!sliceIdPattern.test(id)) diagnostics.push(diagnostic("slice-metadata-missing", "plan.md", "Slice ID is invalid.", safeId(id), checklistLines[0] ?? sliceDetails[0]?.line));
      if (checklistLines.length === 0) diagnostics.push(diagnostic("slice-checklist-missing", "plan.md", "Slice checklist item is missing.", safeId(id), sliceDetails[0]?.line));
      if (sliceDetails.length === 0) diagnostics.push(diagnostic("slice-detail-missing", "plan.md", "Slice detail block is missing.", safeId(id), checklistLines[0]));
      if (checklistLines.length > 1 || sliceDetails.length > 1) diagnostics.push(diagnostic("slice-duplicate", "plan.md", "Slice checklist or detail is duplicated.", safeId(id), checklistLines[1] ?? sliceDetails[1]?.line));
      const detail = sliceDetails[0];
      if (!detail) continue;
      if (!detail.metadataComplete) diagnostics.push(diagnostic("slice-metadata-missing", "plan.md", "Slice Criteria, Checks, and Paths metadata is required.", safeId(id), detail.line));
      references += detail.criteria.length + detail.checks.length + detail.paths.length;
      for (const criterionId of detail.criteria) if (!taskCriteria.has(criterionId)) diagnostics.push(diagnostic("unknown-criterion", "plan.md", "Slice references an unknown acceptance criterion.", safeId(criterionId), detail.line));
      for (const checkId of detail.checks) if (!taskChecks.has(checkId)) diagnostics.push(diagnostic("unknown-check", "plan.md", "Slice references an unknown validation check.", safeId(checkId), detail.line));
      for (const path of detail.paths) if (!isSafeTracePath(path)) diagnostics.push(diagnostic("unsafe-path", "plan.md", "Slice references an unsafe repository path.", safePathId(path), detail.line));
    }
    if (references > MAX_REFERENCES) diagnostics.push(diagnostic("artifact-too-large", "plan.md", "Ready trace exceeds the reference bound."));

    const referencedCriteria = new Set([...details.values()].flatMap((items) => items[0]?.criteria ?? []).filter((id) => taskCriteria.has(id)));
    const referencedChecks = new Set([...details.values()].flatMap((items) => items[0]?.checks ?? []).filter((id) => taskChecks.has(id)));
    for (const criterion of input.task.acceptanceCriteria) {
      if (criterion.status !== "waived" && !referencedCriteria.has(criterion.id)) diagnostics.push(diagnostic("orphan-criterion", "plan.md", "Acceptance criterion is not owned by a slice.", criterion.id));
    }
    for (const check of input.task.validationPlan) {
      if (check.required && !referencedChecks.has(check.id)) diagnostics.push(diagnostic("orphan-required-check", "plan.md", "Required validation check is not owned by a slice.", check.id));
    }
  }

  diagnostics.sort(compareDiagnostics);
  return {
    generator: "harnix",
    schemaVersion: 1,
    taskId: input.task.id,
    status: diagnostics.length === 0 ? "pass" : "fail",
    diagnostics,
  };
}

function parseArtifact(artifact: "prd.md" | "plan.md", source: string, diagnostics: ReadyTraceDiagnosticV1[]): ParsedArtifact {
  if (Buffer.byteLength(source, "utf8") > MAX_ARTIFACT_BYTES) {
    diagnostics.push(diagnostic("artifact-too-large", artifact, "Ready trace artifact exceeds the byte bound."));
    return { lines: [], bounded: false };
  }
  const output: ParsedArtifact["lines"] = [];
  let fence: "`" | "~" | undefined;
  for (const [index, text] of source.split(/\r?\n/u).entries()) {
    const line = index + 1;
    if (text.length > MAX_LINE_LENGTH) {
      diagnostics.push(diagnostic("line-too-long", artifact, "Ready trace line exceeds the length bound.", undefined, line));
      continue;
    }
    const fenceMatch = /^\s*(`{3,}|~{3,})/u.exec(text);
    if (fenceMatch) {
      const marker = fenceMatch[1]![0] as "`" | "~";
      if (fence === undefined) fence = marker;
      else if (fence === marker) fence = undefined;
      continue;
    }
    if (fence !== undefined) continue;
    if (placeholderPattern.test(text)) diagnostics.push(diagnostic("placeholder", artifact, "Ready trace contains an unresolved placeholder.", undefined, line));
    output.push({ text, line });
  }
  return { lines: output, bounded: true };
}

function metadata(block: Array<{ text: string; line: number }>, label: "Criteria" | "Checks" | "Paths"): { present: boolean; values: string[] } {
  const rows = block.filter(({ text }) => text.startsWith(`${label}:`));
  if (rows.length !== 1) return { present: false, values: [] };
  const values = [...rows[0]!.text.matchAll(/`([^`]+)`/gu)].map((match) => match[1]!).filter(Boolean);
  return { present: true, values: [...new Set(values)].sort(compareCodeUnits) };
}

function addLine(map: Map<string, number[]>, id: string, line: number): void {
  const values = map.get(id) ?? [];
  values.push(line);
  map.set(id, values);
}

function diagnostic(code: ReadyTraceDiagnosticCode, artifact: ReadyTraceDiagnosticV1["artifact"], message: string, id?: string, line?: number): ReadyTraceDiagnosticV1 {
  return { code, artifact, message, ...(id === undefined ? {} : { id }), ...(line === undefined ? {} : { line }) };
}

function compareDiagnostics(left: ReadyTraceDiagnosticV1, right: ReadyTraceDiagnosticV1): number {
  return compareCodeUnits(left.artifact, right.artifact)
    || compareCodeUnits(left.code, right.code)
    || compareCodeUnits(left.id ?? "", right.id ?? "")
    || (left.line ?? 0) - (right.line ?? 0);
}

function isSafeTracePath(value: string): boolean {
  if (value.length === 0 || value.startsWith("!") || value.includes("\\") || value.startsWith("/") || /^[A-Za-z]:/u.test(value) || value.includes("\0")) return false;
  return value.split("/").every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
}

function safeId(value: string): string | undefined {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(value) ? value : undefined;
}

function safePathId(value: string): string | undefined {
  return value.length <= 128 && !/^(?:[A-Za-z]:|[/\\])/u.test(value) && !value.includes("\0") ? value : undefined;
}
