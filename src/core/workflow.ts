import type { Evidence, TaskMode, TaskRecord } from "./tasks/task.js";
import { appendJournal } from "./journal/journal.js";
import { archiveTask, saveTask, transitionTask } from "./tasks/task.js";
import { resolveActiveTask } from "./tasks/task.js";

export type WorkflowRoute = "bypass" | TaskMode;
export interface RouteRequest { intent: "question" | "plan" | "implement" | "fix" | "docs"; forceMode?: TaskMode; materialUnknown?: boolean; crossLayer?: boolean; securitySensitive?: boolean; }

export function routeWorkflow(request: RouteRequest): WorkflowRoute {
  if (request.intent === "question") return "bypass";
  if (request.forceMode) return request.forceMode;
  if (request.materialUnknown || request.crossLayer || request.securitySensitive || request.intent === "implement") return "full";
  return "lite";
}
export function nextWorkflowStatus(intent: "plan" | "implement" | "fix", ready: boolean): "planning" | "ready" | "in_progress" {
  if (!ready) return "planning";
  return intent === "plan" ? "ready" : "in_progress";
}
export function validateFullReadyArtifact(value: { acceptanceCriteria: string[]; materialUnknownDecision: string; plan: string }): boolean { return value.acceptanceCriteria.length > 0 && value.materialUnknownDecision.trim().length > 0 && value.plan.trim().length > 0; }

export function canCompleteTask(task: TaskRecord, now = Date.now(), maxEvidenceAgeMs = 60 * 60 * 1000): boolean {
  const required = task.validationPlan.filter((check) => check.required);
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
export async function finishWorkflowTask(harnixRoot: string, journalPath: string, developer: string, task: TaskRecord, now = new Date().toISOString()): Promise<TaskRecord> {
  if (task.status !== "verifying" || !canCompleteTask(task, Date.parse(now))) throw new Error("Task requires fresh complete verification before finishing.");
  const completed = transitionTask(task, "completed", "finishing", now);
  await saveTask(harnixRoot, completed);
  await appendJournal(journalPath, { generator: "harnix", schemaVersion: 1, id: `${completed.id}-completion`, recordedAt: now, developer, taskId: completed.id, kind: "completion", summary: `Completed: ${completed.title}`, evidenceIds: completed.evidence.map((evidence) => evidence.id) });
  await archiveTask(harnixRoot, completed);
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
