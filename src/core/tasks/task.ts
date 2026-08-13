import { mkdir, readFile } from "node:fs/promises";
import { atomicWriteFile } from "../../utils/atomic-write.js";
import { normalizeRepositoryPath, resolveSafeProjectPath } from "../../utils/paths.js";

export type TaskMode = "lite" | "full";
export type TaskStatus = "planning" | "ready" | "in_progress" | "verifying" | "blocked" | "completed";
export type WorkflowCheckpoint = "triage" | "planning" | "ready" | "implementing" | "debugging" | "replan" | "verifying" | "finishing";
export interface AcceptanceCriterion { id: string; text: string; status: "pending" | "met" | "waived"; evidenceIds: string[]; waiverReason?: string; }
export interface ValidationCheck { id: string; description: string; command?: string; scope: "focused" | "full"; required: boolean; }
export interface Evidence { id: string; checkId?: string; recordedAt: string; result: "pass" | "fail" | "skipped"; exitCode?: number; summary: string; artifactPaths: string[]; }
export interface TaskBlocker { kind: "decision" | "authority" | "credential" | "external" | "repository"; summary: string; nextAction: string; resumeStatus: "planning" | "ready" | "in_progress" | "verifying"; }
export interface TaskRecord { generator: "harnix"; schemaVersion: 1; id: string; title: string; mode: TaskMode; status: TaskStatus; checkpoint: WorkflowCheckpoint; goal: string; nonGoals: string[]; acceptanceCriteria: AcceptanceCriterion[]; relevantPaths: string[]; relevantSpecs: string[]; validationPlan: ValidationCheck[]; evidence: Evidence[]; blocker?: TaskBlocker; createdAt: string; updatedAt: string; completedAt?: string; }
export interface TaskValidationOptions { allowUnsafeCompletedEvidenceArtifacts?: boolean | undefined; }

export class TaskValidationError extends Error { override name = "TaskValidationError"; }
const taskIdPattern = /^\d{8}-\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const transitions: Record<TaskStatus, TaskStatus[]> = { planning: ["ready", "blocked"], ready: ["in_progress", "blocked"], in_progress: ["verifying", "blocked"], verifying: ["completed", "blocked"], blocked: ["planning", "ready", "in_progress", "verifying"], completed: [] };
const legalCheckpoints: Record<Exclude<TaskStatus, "blocked">, readonly WorkflowCheckpoint[]> = {
  planning: ["triage", "planning", "replan"],
  ready: ["ready", "replan"],
  in_progress: ["implementing", "debugging", "replan"],
  verifying: ["verifying", "debugging", "replan", "finishing"],
  completed: ["finishing"],
};

export function validateTask(value: unknown, options: TaskValidationOptions = {}): TaskRecord {
  if (!isRecord(value) || value.generator !== "harnix" || value.schemaVersion !== 1) throw new TaskValidationError("Invalid or unsupported task record.");
  for (const key of ["id", "title", "goal", "createdAt", "updatedAt"]) if (typeof value[key] !== "string") throw new TaskValidationError(`Task ${key} is required.`);
  if (!taskIdPattern.test(String(value.id)) || !["lite", "full"].includes(String(value.mode)) || !Object.keys(transitions).includes(String(value.status)) || !["triage", "planning", "ready", "implementing", "debugging", "replan", "verifying", "finishing"].includes(String(value.checkpoint))) throw new TaskValidationError("Task identity, mode, status, or checkpoint is invalid.");
  if (!Array.isArray(value.nonGoals) || !Array.isArray(value.acceptanceCriteria) || !Array.isArray(value.relevantPaths) || !Array.isArray(value.relevantSpecs) || !Array.isArray(value.validationPlan) || !Array.isArray(value.evidence)) throw new TaskValidationError("Task arrays are required.");
  if (!isIsoTimestamp(value.createdAt) || !isIsoTimestamp(value.updatedAt) || Date.parse(value.updatedAt) < Date.parse(value.createdAt)) throw new TaskValidationError("Task timestamp is invalid.");
  if (!(value.nonGoals as unknown[]).every((item) => typeof item === "string") || !(value.relevantPaths as unknown[]).every((item) => typeof item === "string") || !(value.relevantSpecs as unknown[]).every((item) => typeof item === "string")) throw new TaskValidationError("Task path and goal arrays are invalid.");
  if (!(value.validationPlan as unknown[]).every((item) => isRecord(item) && validId(item.id) && typeof item.description === "string" && ["focused", "full"].includes(String(item.scope)) && typeof item.required === "boolean" && (item.command === undefined || typeof item.command === "string"))) throw new TaskValidationError("Validation plan is invalid.");
  const allowUnsafeCompletedEvidenceArtifacts = options.allowUnsafeCompletedEvidenceArtifacts === true && value.status === "completed";
  if (!(value.evidence as unknown[]).every((item) => isRecord(item) && validId(item.id) && (item.checkId === undefined || validId(item.checkId)) && typeof item.recordedAt === "string" && isIsoTimestamp(item.recordedAt) && ["pass", "fail", "skipped"].includes(String(item.result)) && (item.exitCode === undefined || Number.isInteger(item.exitCode)) && typeof item.summary === "string" && Array.isArray(item.artifactPaths) && (allowUnsafeCompletedEvidenceArtifacts || (item.artifactPaths as unknown[]).every(isSafeRepositoryPath)))) throw new TaskValidationError("Evidence is invalid.");
  if (!(value.acceptanceCriteria as unknown[]).every((item) => isRecord(item) && typeof item.id === "string" && typeof item.text === "string" && ["pending", "met", "waived"].includes(String(item.status)) && Array.isArray(item.evidenceIds) && (item.evidenceIds as unknown[]).every((id) => typeof id === "string"))) throw new TaskValidationError("Acceptance criteria are invalid.");
  ensureUnique((value.acceptanceCriteria as AcceptanceCriterion[]).map((item) => item.id), "acceptance criterion");
  ensureUnique((value.validationPlan as ValidationCheck[]).map((item) => item.id), "validation check");
  ensureUnique((value.evidence as Evidence[]).map((item) => item.id), "evidence");
  if (!(value.relevantPaths as unknown[]).every(isSafeRepositoryPath) || !(value.relevantSpecs as unknown[]).every(isSafeRepositoryPath)) throw new TaskValidationError("Task path is unsafe.");
  const checks = new Map((value.validationPlan as ValidationCheck[]).map((check) => [check.id, check]));
  for (const evidence of value.evidence as Evidence[]) {
    if (evidence.checkId === undefined) continue;
    const check = checks.get(evidence.checkId);
    if (check === undefined) throw new TaskValidationError("Evidence check reference is invalid.");
    if (check.command !== undefined && !Number.isInteger(evidence.exitCode)) throw new TaskValidationError("Command evidence requires an integer exit code.");
  }
  const evidenceIds = new Set((value.evidence as Evidence[]).map((e) => e.id));
  for (const criterion of value.acceptanceCriteria as AcceptanceCriterion[]) {
    if ((criterion.status === "met" && !criterion.evidenceIds.some((id) => evidenceIds.has(id))) || (criterion.status === "waived" && !criterion.waiverReason?.trim())) throw new TaskValidationError("Acceptance criterion evidence/waiver is invalid.");
  }
  if (value.status === "blocked" && (!isRecord(value.blocker) || !["decision", "authority", "credential", "external", "repository"].includes(String(value.blocker.kind)) || typeof value.blocker.summary !== "string" || typeof value.blocker.nextAction !== "string" || !["planning", "ready", "in_progress", "verifying"].includes(String(value.blocker.resumeStatus)))) throw new TaskValidationError("Blocked task blocker is invalid.");
  if (value.status === "blocked" && !value.blocker) throw new TaskValidationError("Blocked tasks require a blocker.");
  if (value.status !== "blocked" && value.blocker !== undefined) throw new TaskValidationError("Only blocked tasks may retain a blocker.");
  const checkpointOwner: Exclude<TaskStatus, "blocked"> = value.status === "blocked" ? (value.blocker as TaskBlocker).resumeStatus : value.status as Exclude<TaskStatus, "blocked">;
  if (!legalCheckpoints[checkpointOwner].includes(value.checkpoint as WorkflowCheckpoint)) throw new TaskValidationError("Task status/checkpoint combination is invalid.");
  if (value.status === "completed" && (!value.completedAt || !isIsoTimestamp(value.completedAt) || Date.parse(value.completedAt) < Date.parse(value.updatedAt) || (value.acceptanceCriteria as AcceptanceCriterion[]).some((criterion) => criterion.status === "pending"))) throw new TaskValidationError("Completed task is missing completion requirements.");
  return value as unknown as TaskRecord;
}

export function transitionTask(task: TaskRecord, status: TaskStatus, checkpoint: WorkflowCheckpoint, now = new Date().toISOString(), blocker?: TaskBlocker): TaskRecord {
  if (!transitions[task.status].includes(status)) throw new TaskValidationError(`Illegal task transition ${task.status} -> ${status}.`);
  if (task.status === "blocked" && task.blocker?.resumeStatus !== status) throw new TaskValidationError("Blocked task must resume to its recorded status.");
  if (status === "blocked" && blocker === undefined) throw new TaskValidationError("Transitioning to blocked requires a blocker.");
  const withoutBlocker = { ...task };
  delete withoutBlocker.blocker;
  return validateTask({ ...withoutBlocker, ...(status === "blocked" ? { blocker } : {}), status, checkpoint, updatedAt: now, ...(status === "completed" ? { completedAt: now } : {}) });
}

export function updateTaskCheckpoint(task: TaskRecord, checkpoint: WorkflowCheckpoint, now = new Date().toISOString()): TaskRecord {
  if (task.status === "blocked" || task.status === "completed") throw new TaskValidationError("Cannot update the checkpoint for blocked or completed tasks.");
  return validateTask({ ...task, checkpoint, updatedAt: now });
}

export async function saveTask(root: string, task: TaskRecord): Promise<void> { const valid = validateTask(task); const directory = await resolveSafeProjectPath(root, `tasks/${valid.id}`); const path = await resolveSafeProjectPath(root, `tasks/${valid.id}/task.json`); await mkdir(directory, { recursive: true }); await atomicWriteFile(path, JSON.stringify(valid, null, 2) + "\n"); }
export interface TaskArtifacts { prd?: string; plan?: string; design?: string; research?: Record<string, string>; }
export async function saveTaskWithArtifacts(root: string, task: TaskRecord, artifacts: TaskArtifacts = {}): Promise<void> {
  if (task.mode === "full") {
    if (!artifacts.prd?.trim() || !artifacts.plan?.trim()) throw new TaskValidationError("Full tasks require prd.md and plan.md.");
  } else if (artifacts.prd || artifacts.plan) throw new TaskValidationError("Lite tasks must not create full ceremony artifacts.");
  if (artifacts.research) for (const [name, content] of Object.entries(artifacts.research)) if (!/^[a-z0-9][a-z0-9._-]*\.md$/u.test(name) || !content.trim()) throw new TaskValidationError("Research artifact name or content is invalid.");
  await saveTask(root, task);
  const directory = await resolveSafeProjectPath(root, `tasks/${task.id}`);
  if (task.mode === "full") {
    await atomicWriteFile(await resolveSafeProjectPath(directory, "prd.md"), artifacts.prd!);
    await atomicWriteFile(await resolveSafeProjectPath(directory, "plan.md"), artifacts.plan!);
  }
  if (artifacts.design?.trim()) await atomicWriteFile(await resolveSafeProjectPath(directory, "design.md"), artifacts.design);
  if (artifacts.research) for (const [name, content] of Object.entries(artifacts.research)) {
    await atomicWriteFile(await resolveSafeProjectPath(directory, `research/${name}`), content);
  }
}
export async function loadTask(path: string): Promise<TaskRecord> { return validateTask(JSON.parse(await readFile(path, "utf8")) as unknown); }
export async function setActiveTask(harnixRoot: string, taskId: string): Promise<void> {
  validateTaskId(taskId);
  await atomicWriteFile(await resolveSafeProjectPath(harnixRoot, "tasks/.active"), `${taskId}\n`);
}
export async function resolveActiveTask(harnixRoot: string): Promise<TaskRecord | undefined> {
  try {
    const taskId = (await readFile(await resolveSafeProjectPath(harnixRoot, "tasks/.active"), "utf8")).trim();
    if (taskId.length === 0) return undefined;
    validateTaskId(taskId);
    return await loadTask(await resolveSafeProjectPath(harnixRoot, `tasks/${taskId}/task.json`));
  } catch (error: unknown) {
    if (isMissing(error)) return undefined;
    throw error;
  }
}
export async function clearActiveTask(harnixRoot: string, taskId: string): Promise<void> {
  const activePath = await resolveSafeProjectPath(harnixRoot, "tasks/.active");
  try { if ((await readFile(activePath, "utf8")).trim() === taskId) await atomicWriteFile(activePath, ""); } catch (error: unknown) { if (!isMissing(error)) throw error; }
}
export async function archiveTask(harnixRoot: string, task: TaskRecord): Promise<void> {
  const valid = validateTask(task);
  if (valid.status !== "completed") throw new TaskValidationError("Only completed tasks can be archived.");
  await clearActiveTask(harnixRoot, valid.id);
}
function validateTaskId(value: string): void { if (!taskIdPattern.test(value)) throw new TaskValidationError("Task ID is unsafe."); }
function isMissing(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isIsoTimestamp(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value) && Number.isFinite(Date.parse(value)); }
function validId(value: unknown): value is string { return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value); }
function isSafeRepositoryPath(value: unknown): value is string { if (typeof value !== "string") return false; try { return normalizeRepositoryPath(value, { allowRoot: true }) === value; } catch { return false; } }
function ensureUnique(ids: readonly string[], label: string): void { if (new Set(ids).size !== ids.length) throw new TaskValidationError(`Duplicate ${label} ID.`); }
