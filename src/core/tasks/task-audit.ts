import { readFile } from "node:fs/promises";

import { inspectRequiredCheckEvidence, type RequiredCheckState } from "../status.js";
import { canCompleteTask } from "../workflow.js";
import { compareCodeUnits } from "../../utils/order.js";
import { resolveSafeProjectPath } from "../../utils/paths.js";
import { auditReadyTrace, type ReadyTraceDiagnosticCode } from "./ready-trace.js";
import type { AcceptanceCriterion, Evidence, TaskMode, TaskRecord, TaskStatus, WorkflowCheckpoint } from "./task.js";

type TaskAuditArtifact = "prd.md" | "plan.md" | "task.json";
type TaskAuditDiagnosticCode = ReadyTraceDiagnosticCode | "artifact-unavailable";

export interface TaskAuditDiagnosticV1 {
  readonly code: TaskAuditDiagnosticCode;
  readonly artifact: TaskAuditArtifact;
  readonly id?: string | undefined;
  readonly line?: number | undefined;
}

export interface TaskAuditResultV1 {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly activeTask: {
    readonly id: string;
    readonly mode: TaskMode;
    readonly status: TaskStatus;
    readonly checkpoint: WorkflowCheckpoint;
    readonly readiness: {
      readonly status: "pass" | "fail" | "not-applicable" | "unavailable";
      readonly diagnostics: readonly TaskAuditDiagnosticV1[];
    };
    readonly completion: {
      readonly status: "pass" | "fail";
      readonly criteria: {
        readonly met: number;
        readonly waived: number;
        readonly pending: number;
        readonly total: number;
        readonly pendingIds: readonly string[];
      };
      readonly requiredChecks: {
        readonly passed: number;
        readonly failed: number;
        readonly stale: number;
        readonly pending: number;
        readonly total: number;
        readonly failedIds: readonly string[];
        readonly staleIds: readonly string[];
        readonly pendingIds: readonly string[];
      };
    };
  } | null;
}

export interface TaskAuditDependencies {
  readArtifact(harnixRoot: string, taskId: string, artifact: "prd.md" | "plan.md"): Promise<string>;
  inspectRequiredChecks(projectRoot: string, harnixRoot: string, task: TaskRecord, now: number): Promise<RequiredCheckState[]>;
}

const defaultDependencies: TaskAuditDependencies = {
  async readArtifact(harnixRoot, taskId, artifact) {
    return readFile(await resolveSafeProjectPath(harnixRoot, `tasks/${taskId}/${artifact}`), "utf8");
  },
  inspectRequiredChecks: inspectRequiredCheckEvidence,
};

export function createNoActiveTaskAudit(): TaskAuditResultV1 {
  return { generator: "harnix", schemaVersion: 1, activeTask: null };
}

export async function createTaskAudit(
  projectRoot: string,
  harnixRoot: string,
  task: TaskRecord,
  now = Date.now(),
  dependencies: TaskAuditDependencies = defaultDependencies,
): Promise<TaskAuditResultV1> {
  const requiredChecks = task.validationPlan.filter((check) => check.required);
  const inspectedStates = await dependencies.inspectRequiredChecks(projectRoot, harnixRoot, task, now);
  const states = requiredChecks.map((_check, index): RequiredCheckState => inspectedStates[index] ?? "pending");
  const stateByCheck = new Map(requiredChecks.map((check, index) => [check.id, states[index]!]));
  const criteria = completionCriteria(task, stateByCheck, now);
  const checks = completionChecks(requiredChecks.map((check) => check.id), states);
  const readiness = await inspectReadiness(harnixRoot, task, dependencies);
  const completionReady = task.acceptanceCriteria.length > 0
    && requiredChecks.length > 0
    && criteria.pending === 0
    && checks.failed + checks.stale + checks.pending === 0
    && canCompleteTask(task, now);

  return {
    generator: "harnix",
    schemaVersion: 1,
    activeTask: {
      id: task.id,
      mode: task.mode,
      status: task.status,
      checkpoint: task.checkpoint,
      readiness,
      completion: { status: completionReady ? "pass" : "fail", criteria, requiredChecks: checks },
    },
  };
}

async function inspectReadiness(
  harnixRoot: string,
  task: TaskRecord,
  dependencies: TaskAuditDependencies,
): Promise<NonNullable<TaskAuditResultV1["activeTask"]>["readiness"]> {
  if (task.mode === "lite") return { status: "not-applicable", diagnostics: [] };
  const contents = new Map<"prd.md" | "plan.md", string>();
  const unavailable: TaskAuditDiagnosticV1[] = [];
  for (const artifact of ["prd.md", "plan.md"] as const) {
    try { contents.set(artifact, await dependencies.readArtifact(harnixRoot, task.id, artifact)); }
    catch { unavailable.push({ code: "artifact-unavailable", artifact }); }
  }
  if (unavailable.length > 0) return { status: "unavailable", diagnostics: unavailable };
  const report = auditReadyTrace({ task, prd: contents.get("prd.md")!, plan: contents.get("plan.md")! });
  return {
    status: report.status,
    diagnostics: report.diagnostics.map((diagnostic) => ({
      code: diagnostic.code,
      artifact: diagnostic.artifact,
      ...(diagnostic.id === undefined ? {} : { id: diagnostic.id }),
      ...(diagnostic.line === undefined ? {} : { line: diagnostic.line }),
    })),
  };
}

function completionCriteria(
  task: TaskRecord,
  stateByCheck: ReadonlyMap<string, RequiredCheckState>,
  now: number,
): NonNullable<TaskAuditResultV1["activeTask"]>["completion"]["criteria"] {
  const counts = { met: 0, waived: 0, pending: 0, total: task.acceptanceCriteria.length, pendingIds: [] as string[] };
  for (const criterion of task.acceptanceCriteria) {
    if (criterion.status === "waived") counts.waived += 1;
    else if (criterion.status === "met" && criterionHasFreshSupport(task, criterion, stateByCheck, now)) counts.met += 1;
    else {
      counts.pending += 1;
      counts.pendingIds.push(criterion.id);
    }
  }
  counts.pendingIds.sort(compareCodeUnits);
  return counts;
}

function completionChecks(
  checkIds: readonly string[],
  states: readonly RequiredCheckState[],
): NonNullable<TaskAuditResultV1["activeTask"]>["completion"]["requiredChecks"] {
  const result = {
    passed: 0,
    failed: 0,
    stale: 0,
    pending: 0,
    total: checkIds.length,
    failedIds: [] as string[],
    staleIds: [] as string[],
    pendingIds: [] as string[],
  };
  for (const [index, id] of checkIds.entries()) {
    const state = states[index] ?? "pending";
    result[state] += 1;
    if (state === "failed") result.failedIds.push(id);
    if (state === "stale") result.staleIds.push(id);
    if (state === "pending") result.pendingIds.push(id);
  }
  result.failedIds.sort(compareCodeUnits);
  result.staleIds.sort(compareCodeUnits);
  result.pendingIds.sort(compareCodeUnits);
  return result;
}

function criterionHasFreshSupport(
  task: TaskRecord,
  criterion: AcceptanceCriterion,
  stateByCheck: ReadonlyMap<string, RequiredCheckState>,
  now: number,
): boolean {
  const evidenceById = new Map(task.evidence.map((evidence) => [evidence.id, evidence]));
  const latestByCheck = new Map<string, Evidence>();
  for (const evidence of task.evidence) {
    if (evidence.checkId === undefined) continue;
    const previous = latestByCheck.get(evidence.checkId);
    if (previous === undefined || Date.parse(evidence.recordedAt) >= Date.parse(previous.recordedAt)) latestByCheck.set(evidence.checkId, evidence);
  }
  const checks = new Map(task.validationPlan.map((check) => [check.id, check]));
  return criterion.evidenceIds.some((id) => {
    const evidence = evidenceById.get(id);
    if (evidence === undefined || evidence.result !== "pass" || !isFreshEvidence(evidence, now)) return false;
    if (evidence.checkId !== undefined && latestByCheck.get(evidence.checkId)?.id !== evidence.id) return false;
    if (evidence.checkId !== undefined && stateByCheck.has(evidence.checkId) && stateByCheck.get(evidence.checkId) !== "passed") return false;
    if (task.schemaVersion === 1) return true;
    if (!/^[a-f0-9]{64}$/u.test(evidence.inputDigest ?? "") || evidence.checkId === undefined) return false;
    return checks.get(evidence.checkId)?.criterionIds?.includes(criterion.id) === true;
  });
}

function isFreshEvidence(evidence: Evidence, now: number, maxAgeMs = 60 * 60 * 1_000): boolean {
  const recordedAt = Date.parse(evidence.recordedAt);
  return Number.isFinite(recordedAt) && recordedAt <= now && now - recordedAt <= maxAgeMs;
}
