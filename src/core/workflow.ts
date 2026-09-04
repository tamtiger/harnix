import { basename, dirname } from "node:path";
import { inspectContextDrift, loadContextManifest, type ContextDrift } from "./context/context.js";
import type { ContextManifest } from "./context/context.js";
import { inspectContextSelectionChanges, loadContextSelectionSnapshot, type ContextSelectionInput } from "./context/selection-freshness.js";
import { readConfig } from "./config/config.js";
import { readRepoMap } from "./repo-map/store.js";
import { guideOutputPath, selectGuideSources } from "../guides/catalog.js";
import type { Evidence, TaskCancellation, TaskMode, TaskRecord } from "./tasks/task.js";
import { appendJournal, appendJournalIdempotent, searchJournal, type JournalEntry } from "./journal/journal.js";
import { createCapturedLearningCandidate, type LearningCaptureInput } from "./journal/learning.js";
import { analyzeLearningStatement, type LearningRiskKind } from "./journal/learning-safety.js";
import { archiveTask, cancelTask, loadTask, saveTask, selectLatestEvidence, transitionTask } from "./tasks/task.js";
import { resolveActiveTask } from "./tasks/task.js";
import { resolveSafeProjectPath } from "../utils/paths.js";
import { compareCodeUnits } from "../utils/order.js";
import { assertVerificationInputsFresh } from "./verification/input-freshness.js";

export type WorkflowEntry = "bypass" | "create" | "resume" | "wait" | "fail-closed";
export type WorkflowAction = "inspect" | "plan" | "change" | "review" | "research" | "verify";
export type WorkflowWorkKind = "feature" | "bugfix" | "hotfix" | "refactor" | "test" | "docs" | "maintenance" | "migration" | "dependency" | "security" | "performance" | "release";
export type WorkflowRiskSignal = "material-unknown" | "cross-layer" | "security-sensitive" | "migration" | "contract-change" | "architecture-refactor" | "multi-layer" | "complex-rollback";
export type WorkflowStageOwner = "harnix-brainstorm" | "harnix-implement" | "harnix-debug" | "harnix-check" | "harnix-research" | "harnix-finish-work" | "harnix-continue";
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
  searchJournal?: typeof searchJournal;
  archiveTask?: typeof archiveTask;
}
export interface WorkflowLearningResult { entry: JournalEntry; eligible: true; created: boolean; findings: LearningRiskKind[]; }

export function routeWorkflow(request: WorkflowRouteFacts): WorkflowRouteDecision {
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
export function nextWorkflowStatus(intent: "plan" | "implement" | "fix", ready: boolean): "planning" | "ready" | "in_progress" {
  if (!ready) return "planning";
  return intent === "plan" ? "ready" : "in_progress";
}
export function validateFullReadyArtifact(value: { acceptanceCriteria: string[]; materialUnknownDecision: string; plan: string }): boolean { return value.acceptanceCriteria.length > 0 && value.materialUnknownDecision.trim().length > 0 && value.plan.trim().length > 0; }

export function canCompleteTask(task: TaskRecord, now = Date.now(), maxEvidenceAgeMs = 60 * 60 * 1000): boolean {
  const required = task.validationPlan.filter((check) => check.required);
  if (task.acceptanceCriteria.length === 0 || required.length === 0) return false;
  const latestByCheck = new Map<string, Evidence>();
  for (const checkId of new Set(task.evidence.map((evidence) => evidence.checkId).filter((id): id is string => Boolean(id)))) {
    const latest = selectLatestEvidence(task.evidence, checkId, now);
    if (latest) latestByCheck.set(checkId, latest);
  }
  const freshPasses = task.evidence.filter((evidence) => evidence.result === "pass" && isFresh(evidence, now, maxEvidenceAgeMs, task.schemaVersion === 1) && (!evidence.checkId || latestByCheck.get(evidence.checkId)?.id === evidence.id) && (task.schemaVersion === 1 || isInputDigest(evidence.inputDigest)));
  if (required.some((check) => !freshPasses.some((evidence) => evidence.checkId === check.id))) return false;
  if (task.schemaVersion === 1) {
    return task.acceptanceCriteria.every((criterion) => criterion.status === "waived" || (criterion.status === "met" && criterion.evidenceIds.some((id) => freshPasses.some((evidence) => evidence.id === id))));
  }
  const checks = new Map(task.validationPlan.map((check) => [check.id, check]));
  return task.acceptanceCriteria.every((criterion) => criterion.status === "waived" || (criterion.status === "met" && criterion.evidenceIds.some((id) => {
    const evidence = freshPasses.find((candidate) => candidate.id === id);
    return evidence?.checkId !== undefined && checks.get(evidence.checkId)?.criterionIds.includes(criterion.id) === true;
  })));
}
export function shouldResearch(materialUnknown: boolean): boolean { return materialUnknown; }
export function shouldReassessArchitecture(failedHypotheses: number): boolean { return failedHypotheses >= 3; }
export type VerificationRetryDisposition = "run" | "debug" | "stop";
export function verificationRetryDisposition(task: TaskRecord, checkId: string, now = Date.now()): VerificationRetryDisposition {
  const attempts = task.evidence
    .map((evidence, index) => ({ evidence, index }))
    .filter(({ evidence }) => evidence.checkId === checkId
      && evidence.result !== "skipped"
      && (evidence.result !== "pass" || isFresh(evidence, now, Number.POSITIVE_INFINITY, false)))
    .sort((left, right) => evidenceTime(left.evidence) === evidenceTime(right.evidence)
      ? left.index - right.index
      : evidenceTime(left.evidence) < evidenceTime(right.evidence) ? -1 : 1)
    .map(({ evidence }) => evidence);
  const latest = attempts.at(-1);
  if (latest?.result !== "fail") return "run";
  const previous = attempts.at(-2);
  if (previous?.result !== "fail") return "debug";
  return "stop";
}
export type ImplementationStrategy = "red-green-refactor" | "documented-exception";
export function implementationStrategy(kind: "behavior" | "docs" | "wiring" | "snapshot", exceptionReason?: string, alternateVerification?: string): ImplementationStrategy {
  if (kind === "behavior") return "red-green-refactor";
  if (!exceptionReason?.trim() || !alternateVerification?.trim()) throw new Error("Non-behavior work requires an exception reason and alternate verification.");
  return "documented-exception";
}
export function evidenceSupportsScope(evidence: Evidence, requiredScope: "focused" | "full", checkScope: "focused" | "full"): boolean { return evidence.result === "pass" && (requiredScope === "focused" || checkScope === "full"); }
export async function finishWorkflowTask(harnixRoot: string, journalPath: string, developer: string, task: TaskRecord, now = new Date().toISOString(), dependencies: WorkflowFinishDependencies = {}): Promise<TaskRecord> {
  const recoveringCompletedTask = task.status === "completed" && task.checkpoint === "finishing";
  if (!recoveringCompletedTask && (task.status !== "verifying" || task.checkpoint !== "finishing")) {
    throw new Error("Task requires the verifying/finishing checkpoint or a completed/finishing recovery state.");
  }
  let completed = task;
  if (!recoveringCompletedTask) {
    await assertTaskReadyForFinishing(harnixRoot, task, now);
    completed = transitionTask(task, "completed", "finishing", now);
    await (dependencies.saveTask ?? saveTask)(harnixRoot, completed);
  }
  const completionEntry = { generator: "harnix" as const, schemaVersion: 1 as const, id: `${completed.id}-completion`, recordedAt: completed.completedAt ?? now, developer, taskId: completed.id, kind: "completion" as const, summary: `Completed: ${completed.title}`, evidenceIds: completionEvidenceIds(completed) };
  if (!recoveringCompletedTask) {
    await (dependencies.appendJournal ?? appendJournal)(journalPath, completionEntry);
  } else {
    const journal = await (dependencies.searchJournal ?? searchJournal)(journalPath);
    if (!journal.entries.some((entry) => entry.id === completionEntry.id)) {
      await (dependencies.appendJournal ?? appendJournal)(journalPath, completionEntry);
    }
  }
  await (dependencies.archiveTask ?? archiveTask)(harnixRoot, completed);
  return completed;
}
export async function recordWorkflowLearning(harnixRoot: string, journalRoot: string, journalPath: string, developer: string, task: TaskRecord, input: LearningCaptureInput, now = new Date().toISOString()): Promise<WorkflowLearningResult> {
  await assertTaskReadyForFinishing(harnixRoot, task, now);
  const candidate = createCapturedLearningCandidate(input);
  const analysis = analyzeLearningStatement(candidate.statement);
  if (analysis.oversized) throw new Error("Learning statement exceeds the 64 KiB review limit.");
  if (!candidate.sourceTaskIds.includes(task.id)) throw new Error("Workflow learning provenance must include the active task.");
  const knownEvidenceIds = new Set<string>();
  for (const sourceTaskId of candidate.sourceTaskIds) {
    let sourceTask: TaskRecord;
    if (sourceTaskId === task.id) sourceTask = task;
    else {
      try { sourceTask = await loadTask(await resolveSafeProjectPath(harnixRoot, `tasks/${sourceTaskId}/task.json`)); }
      catch (error: unknown) { if (isMissing(error)) throw new Error(`Learning source task ${sourceTaskId} does not exist.`); throw error; }
      if (sourceTask.status !== "completed") throw new Error(`Learning source task ${sourceTaskId} is not completed.`);
    }
    const sourceEvidenceIds = new Set(sourceTask.evidence.map((evidence) => evidence.id));
    for (const evidenceId of sourceEvidenceIds) knownEvidenceIds.add(evidenceId);
    if (!candidate.evidenceIds.some((evidenceId) => sourceEvidenceIds.has(evidenceId))) throw new Error(`Learning source task ${sourceTaskId} has no referenced evidence.`);
  }
  if (candidate.evidenceIds.some((evidenceId) => !knownEvidenceIds.has(evidenceId))) throw new Error("Workflow learning provenance contains unknown evidence.");
  const entry: JournalEntry = {
    generator: "harnix",
    schemaVersion: 1,
    id: `${task.id}-${candidate.id}-learning`,
    recordedAt: now,
    developer,
    taskId: task.id,
    kind: "learning",
    summary: `Learning candidate: ${candidate.id}`,
    evidenceIds: candidate.evidenceIds,
    learning: candidate,
  };
  const appended = await appendJournalIdempotent(journalRoot, journalPath, entry);
  return { ...appended, eligible: true, findings: analysis.findings };
}
export async function cancelWorkflowTask(harnixRoot: string, journalPath: string, developer: string, task: TaskRecord, cancellation: TaskCancellation | undefined, now = new Date().toISOString(), dependencies: WorkflowFinishDependencies = {}): Promise<TaskRecord> {
  const recoveringCancelledTask = task.status === "cancelled" && task.checkpoint === "cancelling";
  let cancelled = task;
  if (!recoveringCancelledTask) {
    if (cancellation === undefined) throw new Error("Workflow cancellation requires explicit user authority and a reason.");
    cancelled = cancelTask(task, cancellation, now);
    await (dependencies.saveTask ?? saveTask)(harnixRoot, cancelled);
  }
  const cancellationEntry = {
    generator: "harnix" as const,
    schemaVersion: 1 as const,
    id: `${cancelled.id}-cancellation`,
    recordedAt: cancelled.cancelledAt!,
    developer,
    taskId: cancelled.id,
    kind: "cancellation" as const,
    summary: `Cancelled: ${cancelled.title} — ${cancelled.cancellation!.reason}`,
    evidenceIds: cancelled.evidence.map((evidence) => evidence.id),
  };
  if (!recoveringCancelledTask) {
    await (dependencies.appendJournal ?? appendJournal)(journalPath, cancellationEntry);
  } else {
    const journal = await (dependencies.searchJournal ?? searchJournal)(journalPath);
    if (!journal.entries.some((entry) => entry.id === cancellationEntry.id)) {
      await (dependencies.appendJournal ?? appendJournal)(journalPath, cancellationEntry);
    }
  }
  await (dependencies.archiveTask ?? archiveTask)(harnixRoot, cancelled);
  return cancelled;
}
export async function continueWorkflowTask(harnixRoot: string): Promise<{ task: TaskRecord; contextPaths: string[]; contextDrift: ContextDrift } | undefined> {
  const task = await resolveActiveTask(harnixRoot);
  if (task === undefined) return undefined;
  const projectRoot = basename(harnixRoot) === ".harnix" ? dirname(harnixRoot) : harnixRoot;
  return {
    task,
    contextPaths: [...new Set([...task.relevantPaths, ...task.relevantSpecs])].sort(compareCodeUnits),
    contextDrift: await taskContextDrift(projectRoot, harnixRoot, task),
  };
}
export function verificationStages(): ["compliance", "quality-security"] { return ["compliance", "quality-security"]; }
export function isWithinRequestedScope(requested: string[], proposed: string[]): boolean { const allowed = new Set(requested); return proposed.every((item) => allowed.has(item)); }

function isFresh(evidence: Evidence, now: number, maxAgeMs: number, enforceMaxAge = true): boolean {
  const timestamp = Date.parse(evidence.recordedAt);
  return Number.isFinite(timestamp) && timestamp <= now && (!enforceMaxAge || now - timestamp <= maxAgeMs);
}
function evidenceTime(evidence: Evidence): number { const parsed = Date.parse(evidence.recordedAt); return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY; }
function isInputDigest(value: unknown): value is string { return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value); }
function completionEvidenceIds(task: TaskRecord): string[] {
  const supporting = new Set(task.acceptanceCriteria.filter((criterion) => criterion.status === "met").flatMap((criterion) => criterion.evidenceIds));
  for (const check of task.validationPlan.filter((candidate) => candidate.required)) {
    let latest: Evidence | undefined;
    for (const evidence of task.evidence) {
      if (evidence.checkId === check.id && evidence.result === "pass" && (latest === undefined || evidenceTime(evidence) >= evidenceTime(latest))) latest = evidence;
    }
    if (latest) supporting.add(latest.id);
  }
  return [...supporting].sort(compareCodeUnits);
}
async function assertTaskReadyForFinishing(harnixRoot: string, task: TaskRecord, now: string): Promise<void> {
  if (task.status !== "verifying" || task.checkpoint !== "finishing") throw new Error("Workflow learning capture requires an active verifying/finishing task.");
  if (task.schemaVersion === 2) {
    const projectRoot = basename(harnixRoot) === ".harnix" ? dirname(harnixRoot) : harnixRoot;
    await assertVerificationInputsFresh(projectRoot, harnixRoot, task);
  }
  if (!canCompleteTask(task, Date.parse(now))) throw new Error("Task requires fresh complete verification before finishing.");
}

export async function taskContextDrift(projectRoot: string, harnixRoot: string, task: TaskRecord): Promise<ContextDrift> {
  try {
    const taskDirectory = await resolveSafeProjectPath(harnixRoot, `tasks/${task.id}`);
    const path = await resolveSafeProjectPath(taskDirectory, "context.json");
    const manifest = await loadContextManifest(path);
    const contentDrift = await inspectContextDrift(projectRoot, manifest);
    let snapshot;
    try { snapshot = await loadContextSelectionSnapshot(await resolveSafeProjectPath(taskDirectory, "context-selection.json")); }
    catch (error: unknown) {
      if (isMissing(error)) return { ...contentDrift, state: contentDrift.state === "stale" ? "stale" : "not-recorded" };
      throw new Error("Context selection snapshot is unreadable or invalid.");
    }
    const input = await contextSelectionInput(projectRoot, harnixRoot, task, manifest, false);
    const selectionChanges = inspectContextSelectionChanges(snapshot, input);
    return {
      changes: contentDrift.changes,
      selectionChanges,
      state: contentDrift.state === "stale" || selectionChanges.length > 0
        ? "stale"
        : contentDrift.state === "not-recorded" ? "not-recorded" : "current",
    };
  } catch (error: unknown) {
    if (isMissing(error)) return inspectContextDrift(projectRoot, undefined);
    throw error;
  }
}

export async function contextSelectionInput(
  projectRoot: string,
  harnixRoot: string,
  task: TaskRecord,
  manifest: ContextManifest,
  requireInventory: boolean,
): Promise<ContextSelectionInput> {
  const config = await readConfig(await resolveSafeProjectPath(harnixRoot, "config.yaml"));
  const selectedGuidePaths = selectGuideSources({
    activePaths: task.relevantPaths,
    languages: config.languages,
    technologies: config.technologies,
    topics: [...new Set(`${task.title} ${task.goal}`.toLowerCase().match(/[a-z0-9-]+/gu) ?? [])].sort(compareCodeUnits),
  }).map(guideOutputPath);
  let inventoryFingerprint = "";
  try { inventoryFingerprint = (await readRepoMap(projectRoot)).inventoryFingerprint; }
  catch (error: unknown) { if (requireInventory) throw error; }
  return { config, inventoryFingerprint, manifest, selectedGuidePaths, task };
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
  if (active.status === "completed") return decision("resume", active.mode, "harnix-continue", "completed-active");
  if (active.status === "cancelled") return decision("resume", active.mode, "harnix-continue", "cancelled-active");
  return decision("fail-closed", undefined, "harnix-continue", "invalid-active-state");
}

function isKnownActiveState(active: NonNullable<WorkflowRouteFacts["activeTask"]>): boolean {
  const legal: Record<TaskRecord["status"], readonly TaskRecord["checkpoint"][]> = {
    planning: ["triage", "planning", "replan"], ready: ["ready", "replan"], in_progress: ["implementing", "debugging", "replan"], verifying: ["verifying", "debugging", "replan", "finishing"], completed: ["finishing"], cancelled: ["cancelling"], blocked: ["triage", "planning", "ready", "implementing", "debugging", "replan", "verifying", "finishing"],
  };
  if (active.status === "blocked") {
    return active.blocker !== undefined && legal[active.blocker.resumeStatus].includes(active.checkpoint);
  }
  return legal[active.status]?.includes(active.checkpoint) ?? false;
}

function decision(entry: WorkflowEntry, mode: TaskMode | undefined, owner: WorkflowStageOwner | undefined, ...reasonCodes: string[]): WorkflowRouteDecision {
  return { entry, ...(mode === undefined ? {} : { mode }), ...(owner === undefined ? {} : { owner }), reasonCodes };
}

function isMissing(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"; }
