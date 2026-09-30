import { legalCheckpoints } from "src/core/tasks/task-schema.js";
import type { TaskMode, TaskRecord } from "src/core/tasks/task.js";

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
  "harnix-plan" | "harnix-implement" | "harnix-verify" | "harnix-review" | "harnix-research" | "harnix-debug";
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
    if (request.action === "review") return decision("bypass", undefined, "harnix-review", "standalone-review");
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
      "harnix-plan",
      `explicit-${mode}`,
      ...(mode === "lite" && request.riskSignals.length > 0 ? ["explicit-lite-risk-conflict"] : []),
    );
  }
  return decision("create", mode, "harnix-plan", mode === "full" ? "risk-full" : "low-risk-lite");
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

/** Skill that owns a persisted state: exactly one per legal status/checkpoint, `undefined` when the state is not legal. */
export function stageOwnerFor(
  state: Pick<TaskRecord, "status" | "checkpoint" | "blocker">,
): WorkflowStageOwner | undefined {
  if (!isKnownActiveState(state)) return undefined;
  const status = state.status === "blocked" ? (state.blocker?.resumeStatus ?? state.status) : state.status;
  if (state.checkpoint === "replan" || status === "planning") return "harnix-plan";
  if (state.checkpoint === "debugging") return "harnix-debug";
  if (status === "ready" || status === "in_progress") return "harnix-implement";
  return "harnix-verify";
}

function routeActiveTask(
  request: WorkflowRouteFacts,
  active: NonNullable<WorkflowRouteFacts["activeTask"]>,
): WorkflowRouteDecision {
  const owner = stageOwnerFor(active);
  if (owner === undefined) return decision("fail-closed", undefined, undefined, "invalid-active-state");
  if (active.status === "completed") return decision("resume", active.mode, owner, "completed-active");
  if (active.status === "cancelled") return decision("resume", active.mode, owner, "cancelled-active");
  if (active.status === "blocked" || active.status !== "ready") {
    const replan = active.status !== "blocked" && (active.status === "planning" || active.checkpoint === "replan");
    return decision("resume", active.mode, owner, replan ? "active-replan" : "active-stage");
  }
  if (active.checkpoint !== "ready" || request.mutation === "task-artifact" || request.action === "plan")
    return decision("resume", active.mode, "harnix-plan", "active-replan");
  if (request.action === "change" && request.mutation === "project")
    return decision("resume", active.mode, owner, "active-ready-authorized");
  return decision("wait", active.mode, owner, "active-ready-wait");
}

function isKnownActiveState(active: Pick<TaskRecord, "status" | "checkpoint" | "blocker">): boolean {
  if (active.status === "blocked") {
    return active.blocker !== undefined && legalCheckpoints[active.blocker.resumeStatus].includes(active.checkpoint);
  }
  return legalCheckpoints[active.status]?.includes(active.checkpoint) ?? false;
}

function decision(
  entry: WorkflowEntry,
  mode: TaskMode | undefined,
  owner: WorkflowStageOwner | undefined,
  ...reasonCodes: string[]
): WorkflowRouteDecision {
  return { entry, ...(mode === undefined ? {} : { mode }), ...(owner === undefined ? {} : { owner }), reasonCodes };
}
