import type { TaskMode, TaskRecord } from "../tasks/task.js";

export type WorkflowEntry = "bypass" | "create" | "resume" | "wait" | "fail-closed";
export type WorkflowAction = "inspect" | "plan" | "change" | "review" | "research" | "verify";
export type WorkflowWorkKind =
  | "feature"
  | "bugfix"
  | "hotfix"
  | "refactor"
  | "test"
  | "docs"
  | "maintenance"
  | "migration"
  | "dependency"
  | "security"
  | "performance"
  | "release";
export type WorkflowRiskSignal =
  | "material-unknown"
  | "cross-layer"
  | "security-sensitive"
  | "migration"
  | "contract-change"
  | "architecture-refactor"
  | "multi-layer"
  | "complex-rollback";
export type WorkflowStageOwner =
  | "harnix-brainstorm"
  | "harnix-implement"
  | "harnix-debug"
  | "harnix-check"
  | "harnix-research"
  | "harnix-finish-work"
  | "harnix-continue";
export interface WorkflowRouteFacts {
  mutation: "none" | "task-artifact" | "project" | "docs-only" | "literal-value";
  action: WorkflowAction;
  workKind: WorkflowWorkKind;
  explicitMode?: TaskMode;
  riskSignals: readonly WorkflowRiskSignal[];
  activeTask?: Pick<TaskRecord, "mode" | "status" | "checkpoint" | "blocker">;
}
export interface WorkflowRouteDecision {
  entry: WorkflowEntry;
  mode?: TaskMode;
  owner?: WorkflowStageOwner;
  reasonCodes: readonly string[];
}

export function routeWorkflow(request: WorkflowRouteFacts): WorkflowRouteDecision {
  if (request.mutation === "docs-only" || request.mutation === "literal-value") {
    const forcesTracked =
      request.riskSignals.includes("contract-change") || request.riskSignals.includes("material-unknown");
    if (!forcesTracked)
      return decision(
        "bypass",
        undefined,
        undefined,
        request.mutation === "docs-only" ? "docs-only-bypass" : "literal-value-bypass",
      );
    request = { ...request, mutation: "project" };
  }
  if (request.mutation === "none") {
    if (request.action === "review") return decision("bypass", undefined, "harnix-check", "standalone-review");
    if (request.action === "research") return decision("bypass", undefined, "harnix-research", "standalone-research");
    if (request.action === "inspect") return decision("bypass", undefined, undefined, "read-only");
  }
  const active = request.activeTask;
  if (active) return routeActiveTask(request, active);
  if (request.mutation === "none") return decision("bypass", undefined, undefined, "read-only");
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
export function nextWorkflowStatus(
  intent: "plan" | "implement" | "fix",
  ready: boolean,
): "planning" | "ready" | "in_progress" {
  if (!ready) return "planning";
  return intent === "plan" ? "ready" : "in_progress";
}
export function validateFullReadyArtifact(value: {
  acceptanceCriteria: string[];
  materialUnknownDecision: string;
  plan: string;
}): boolean {
  return (
    value.acceptanceCriteria.length > 0 &&
    value.materialUnknownDecision.trim().length > 0 &&
    value.plan.trim().length > 0
  );
}
export function shouldResearch(materialUnknown: boolean): boolean {
  return materialUnknown;
}
export function shouldReassessArchitecture(failedHypotheses: number): boolean {
  return failedHypotheses >= 3;
}
export type ImplementationStrategy = "red-green-refactor" | "documented-exception";
export function implementationStrategy(
  kind: "behavior" | "docs" | "wiring" | "snapshot",
  exceptionReason?: string,
  alternateVerification?: string,
): ImplementationStrategy {
  if (kind === "behavior") return "red-green-refactor";
  if (!exceptionReason?.trim() || !alternateVerification?.trim())
    throw new Error("Non-behavior work requires an exception reason and alternate verification.");
  return "documented-exception";
}
export function verificationStages(): ["compliance", "quality-security"] {
  return ["compliance", "quality-security"];
}
export function isWithinRequestedScope(requested: string[], proposed: string[]): boolean {
  const allowed = new Set(requested);
  return proposed.every((item) => allowed.has(item));
}

function routeActiveTask(
  request: WorkflowRouteFacts,
  active: NonNullable<WorkflowRouteFacts["activeTask"]>,
): WorkflowRouteDecision {
  if (!isKnownActiveState(active)) return decision("fail-closed", undefined, "harnix-continue", "invalid-active-state");
  if (active.status === "blocked") return decision("resume", active.mode, "harnix-continue", "active-stage");
  if (active.status === "planning" || active.checkpoint === "replan")
    return decision("resume", active.mode, "harnix-brainstorm", "active-replan");
  if (active.status === "ready") {
    if (active.checkpoint !== "ready") return decision("resume", active.mode, "harnix-brainstorm", "active-replan");
    if (request.mutation === "task-artifact" || request.action === "plan")
      return decision("resume", active.mode, "harnix-brainstorm", "active-replan");
    if (request.action === "change" && request.mutation === "project")
      return decision("resume", active.mode, "harnix-implement", "active-ready-authorized");
    return decision("wait", active.mode, "harnix-continue", "active-ready-wait");
  }
  if (active.status === "in_progress")
    return active.checkpoint === "debugging"
      ? decision("resume", active.mode, "harnix-debug", "active-stage")
      : decision("resume", active.mode, "harnix-implement", "active-stage");
  if (active.status === "verifying") {
    if (active.checkpoint === "debugging") return decision("resume", active.mode, "harnix-debug", "active-stage");
    return active.checkpoint === "finishing"
      ? decision("resume", active.mode, "harnix-finish-work", "active-stage")
      : decision("resume", active.mode, "harnix-check", "active-stage");
  }
  if (active.status === "completed") return decision("resume", active.mode, "harnix-continue", "completed-active");
  if (active.status === "cancelled") return decision("resume", active.mode, "harnix-continue", "cancelled-active");
  return decision("fail-closed", undefined, "harnix-continue", "invalid-active-state");
}

function isKnownActiveState(active: NonNullable<WorkflowRouteFacts["activeTask"]>): boolean {
  const legal: Record<TaskRecord["status"], readonly TaskRecord["checkpoint"][]> = {
    planning: ["triage", "planning", "replan"],
    ready: ["ready", "replan"],
    in_progress: ["implementing", "debugging", "replan"],
    verifying: ["verifying", "debugging", "replan", "finishing"],
    completed: ["finishing"],
    cancelled: ["cancelling"],
    blocked: ["triage", "planning", "ready", "implementing", "debugging", "replan", "verifying", "finishing"],
  };
  if (active.status === "blocked") {
    return active.blocker !== undefined && legal[active.blocker.resumeStatus].includes(active.checkpoint);
  }
  return legal[active.status]?.includes(active.checkpoint) ?? false;
}

function decision(
  entry: WorkflowEntry,
  mode: TaskMode | undefined,
  owner: WorkflowStageOwner | undefined,
  ...reasonCodes: string[]
): WorkflowRouteDecision {
  return { entry, ...(mode === undefined ? {} : { mode }), ...(owner === undefined ? {} : { owner }), reasonCodes };
}
