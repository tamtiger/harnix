import type { Evidence, TaskMode, TaskRecord } from "./tasks/task.js";
import { appendJournal } from "./journal/journal.js";
import { archiveTask, saveTask, transitionTask } from "./tasks/task.js";
import { resolveActiveTask } from "./tasks/task.js";

export type WorkflowEntry = "bypass" | "create" | "resume" | "wait" | "fail-closed";
export type WorkflowAction = "inspect" | "plan" | "change" | "review" | "verify";
export type WorkflowWorkKind = "feature" | "bugfix" | "hotfix" | "refactor" | "test" | "docs" | "maintenance" | "migration" | "dependency" | "security" | "performance" | "release";
export type WorkflowRiskSignal = "material-unknown" | "cross-layer" | "security-sensitive" | "migration" | "contract-change" | "architecture-refactor" | "multi-layer" | "complex-rollback";
export type WorkflowStageOwner = "harnix-brainstorm" | "harnix-implement" | "harnix-debug" | "harnix-check" | "harnix-finish-work" | "harnix-continue";
export interface WorkflowRouteFacts {
  mutation: "none" | "task-artifact" | "project";
  action: WorkflowAction;
  workKind: WorkflowWorkKind;
  explicitMode?: TaskMode;
  riskSignals: readonly WorkflowRiskSignal[];
  activeTask?: Pick<TaskRecord, "mode" | "status" | "checkpoint" | "blocker">;
}
export interface WorkflowRouteDecision { entry: WorkflowEntry; mode?: TaskMode; owner?: WorkflowStageOwner; reasonCodes: readonly string[]; }
export interface WorkflowFinishDependencies {
  saveTask?: typeof saveTask;
  appendJournal?: typeof appendJournal;
  archiveTask?: typeof archiveTask;
}

export function routeWorkflow(request: WorkflowRouteFacts): WorkflowRouteDecision {
  const active = request.activeTask;
  if (active) return routeActiveTask(request, active);
  if (request.mutation === "none") {
    return request.action === "review"
      ? decision("bypass", undefined, "harnix-check", "standalone-review")
      : decision("bypass", undefined, undefined, "read-only");
  }
  const mode = request.explicitMode ?? (request.riskSignals.length > 0 ? "full" : "lite");
  if (request.explicitMode) {
    return decision(
      "create",
      mode,
      "harnix-brainstorm",
      `explicit-${mode}`,
      ...(mode === "lite" && request.riskSignals.length > 0 ? ["explicit-lite-risk-conflict"] : []),
    );
  }
  return decision("create", mode, "harnix-brainstorm", mode === "full" ? "risk-full" : "low-risk-lite");
}
export function nextWorkflowStatus(intent: "plan" | "implement" | "fix", ready: boolean): "planning" | "ready" | "in_progress" {
  if (!ready) return "planning";
  return intent === "plan" ? "ready" : "in_progress";
}
export function validateFullReadyArtifact(value: { acceptanceCriteria: string[]; materialUnknownDecision: string; plan: string }): boolean { return value.acceptanceCriteria.length > 0 && value.materialUnknownDecision.trim().length > 0 && value.plan.trim().length > 0; }

export function canCompleteTask(task: TaskRecord, now = Date.now(), maxEvidenceAgeMs = 60 * 60 * 1000): boolean {
  const required = task.validationPlan.filter((check) => check.required);
  if (task.acceptanceCriteria.length === 0 || required.length === 0) return false;
  const latestByCheck = new Map<string, Evidence>();
  for (const evidence of task.evidence) {
    if (!evidence.checkId) continue;
    const previous = latestByCheck.get(evidence.checkId);
    if (!previous || evidenceTime(evidence) >= evidenceTime(previous)) latestByCheck.set(evidence.checkId, evidence);
  }
  const freshPasses = task.evidence.filter((evidence) => evidence.result === "pass" && isFresh(evidence, now, maxEvidenceAgeMs) && (!evidence.checkId || latestByCheck.get(evidence.checkId)?.id === evidence.id));
  if (required.some((check) => !freshPasses.some((evidence) => evidence.checkId === check.id))) return false;
  return task.acceptanceCriteria.every((criterion) => criterion.status === "waived" || (criterion.status === "met" && criterion.evidenceIds.some((id) => freshPasses.some((evidence) => evidence.id === id))));
}
export function shouldResearch(materialUnknown: boolean): boolean { return materialUnknown; }
export function shouldReassessArchitecture(failedHypotheses: number): boolean { return failedHypotheses >= 3; }
export type ImplementationStrategy = "red-green-refactor" | "documented-exception";
export function implementationStrategy(kind: "behavior" | "docs" | "wiring" | "snapshot", exceptionReason?: string, alternateVerification?: string): ImplementationStrategy {
  if (kind === "behavior") return "red-green-refactor";
  if (!exceptionReason?.trim() || !alternateVerification?.trim()) throw new Error("Non-behavior work requires an exception reason and alternate verification.");
  return "documented-exception";
}
export function evidenceSupportsScope(evidence: Evidence, requiredScope: "focused" | "full", checkScope: "focused" | "full"): boolean { return evidence.result === "pass" && (requiredScope === "focused" || checkScope === "full"); }
export async function finishWorkflowTask(harnixRoot: string, journalPath: string, developer: string, task: TaskRecord, now = new Date().toISOString(), dependencies: WorkflowFinishDependencies = {}): Promise<TaskRecord> {
  if (task.status !== "verifying" || task.checkpoint !== "finishing") throw new Error("Task requires the verifying/finishing checkpoint before completion persistence.");
  if (!canCompleteTask(task, Date.parse(now))) throw new Error("Task requires fresh complete verification before finishing.");
  const completed = transitionTask(task, "completed", "finishing", now);
  await (dependencies.saveTask ?? saveTask)(harnixRoot, completed);
  await (dependencies.appendJournal ?? appendJournal)(journalPath, { generator: "harnix", schemaVersion: 1, id: `${completed.id}-completion`, recordedAt: now, developer, taskId: completed.id, kind: "completion", summary: `Completed: ${completed.title}`, evidenceIds: completionEvidenceIds(completed) });
  await (dependencies.archiveTask ?? archiveTask)(harnixRoot, completed);
  return completed;
}
export async function continueWorkflowTask(harnixRoot: string): Promise<{ task: TaskRecord; contextPaths: string[] } | undefined> {
  const task = await resolveActiveTask(harnixRoot);
  return task === undefined ? undefined : { task, contextPaths: [...new Set([...task.relevantPaths, ...task.relevantSpecs])].sort((left, right) => left.localeCompare(right)) };
}
export function verificationStages(): ["compliance", "quality-security"] { return ["compliance", "quality-security"]; }
export function isWithinRequestedScope(requested: string[], proposed: string[]): boolean { const allowed = new Set(requested); return proposed.every((item) => allowed.has(item)); }

function isFresh(evidence: Evidence, now: number, maxAgeMs: number): boolean { const timestamp = Date.parse(evidence.recordedAt); return Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= maxAgeMs; }
function evidenceTime(evidence: Evidence): number { const parsed = Date.parse(evidence.recordedAt); return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY; }
function completionEvidenceIds(task: TaskRecord): string[] {
  const supporting = new Set(task.acceptanceCriteria.filter((criterion) => criterion.status === "met").flatMap((criterion) => criterion.evidenceIds));
  for (const check of task.validationPlan.filter((candidate) => candidate.required)) {
    const latest = task.evidence.filter((evidence) => evidence.checkId === check.id && evidence.result === "pass").sort((left, right) => evidenceTime(right) - evidenceTime(left))[0];
    if (latest) supporting.add(latest.id);
  }
  return [...supporting].sort((left, right) => left.localeCompare(right));
}

function routeActiveTask(request: WorkflowRouteFacts, active: NonNullable<WorkflowRouteFacts["activeTask"]>): WorkflowRouteDecision {
  if (!isKnownActiveState(active)) return decision("fail-closed", undefined, "harnix-continue", "invalid-active-state");
  if (active.status === "blocked") return decision("resume", active.mode, "harnix-continue", "active-stage");
  if (active.status === "planning" || active.checkpoint === "replan") return decision("resume", active.mode, "harnix-brainstorm", "active-replan");
  if (active.status === "ready") {
    if (active.checkpoint !== "ready") return decision("resume", active.mode, "harnix-brainstorm", "active-replan");
    if (request.mutation === "task-artifact" || request.action === "plan") return decision("resume", active.mode, "harnix-brainstorm", "active-replan");
    if (request.action === "change" && request.mutation === "project") return decision("resume", active.mode, "harnix-implement", "active-ready-authorized");
    return decision("wait", active.mode, "harnix-continue", "active-ready-wait");
  }
  if (active.status === "in_progress") return active.checkpoint === "debugging" ? decision("resume", active.mode, "harnix-debug", "active-stage") : decision("resume", active.mode, "harnix-implement", "active-stage");
  if (active.status === "verifying") {
    if (active.checkpoint === "debugging") return decision("resume", active.mode, "harnix-debug", "active-stage");
    return active.checkpoint === "finishing" ? decision("resume", active.mode, "harnix-finish-work", "active-stage") : decision("resume", active.mode, "harnix-check", "active-stage");
  }
  return decision("fail-closed", undefined, "harnix-continue", "invalid-active-state");
}

function isKnownActiveState(active: NonNullable<WorkflowRouteFacts["activeTask"]>): boolean {
  const legal: Record<TaskRecord["status"], readonly TaskRecord["checkpoint"][]> = {
    planning: ["triage", "planning", "replan"], ready: ["ready", "replan"], in_progress: ["implementing", "debugging", "replan"], verifying: ["verifying", "debugging", "replan", "finishing"], completed: ["finishing"], blocked: ["triage", "planning", "ready", "implementing", "debugging", "replan", "verifying", "finishing"],
  };
  if (active.status === "blocked") {
    return active.blocker !== undefined && legal[active.blocker.resumeStatus].includes(active.checkpoint);
  }
  return legal[active.status]?.includes(active.checkpoint) ?? false;
}

function decision(entry: WorkflowEntry, mode: TaskMode | undefined, owner: WorkflowStageOwner | undefined, ...reasonCodes: string[]): WorkflowRouteDecision {
  return { entry, ...(mode === undefined ? {} : { mode }), ...(owner === undefined ? {} : { owner }), reasonCodes };
}
