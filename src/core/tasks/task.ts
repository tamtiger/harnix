import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { atomicWriteFile } from "../../utils/atomic-write.js";

export type TaskMode = "lite" | "full";
export type TaskStatus = "planning" | "ready" | "in_progress" | "verifying" | "blocked" | "completed";
export type WorkflowCheckpoint = "triage" | "planning" | "ready" | "implementing" | "debugging" | "replan" | "verifying" | "finishing";
export interface AcceptanceCriterion { id: string; text: string; status: "pending" | "met" | "waived"; evidenceIds: string[]; waiverReason?: string; }
export interface ValidationCheck { id: string; description: string; command?: string; scope: "focused" | "full"; required: boolean; }
export interface Evidence { id: string; checkId?: string; recordedAt: string; result: "pass" | "fail" | "skipped"; exitCode?: number; summary: string; artifactPaths: string[]; }
export interface TaskRecord { generator: "harnix"; schemaVersion: 1; id: string; title: string; mode: TaskMode; status: TaskStatus; checkpoint: WorkflowCheckpoint; goal: string; nonGoals: string[]; acceptanceCriteria: AcceptanceCriterion[]; relevantPaths: string[]; relevantSpecs: string[]; validationPlan: ValidationCheck[]; evidence: Evidence[]; blocker?: { kind: "decision" | "authority" | "credential" | "external" | "repository"; summary: string; nextAction: string; resumeStatus: "planning" | "ready" | "in_progress" | "verifying" }; createdAt: string; updatedAt: string; completedAt?: string; }

export class TaskValidationError extends Error { override name = "TaskValidationError"; }
const transitions: Record<TaskStatus, TaskStatus[]> = { planning: ["ready", "blocked"], ready: ["in_progress", "blocked"], in_progress: ["verifying", "blocked"], verifying: ["completed", "blocked"], blocked: ["planning", "ready", "in_progress", "verifying"], completed: [] };

export function validateTask(value: unknown): TaskRecord {
  if (!isRecord(value) || value.generator !== "harnix" || value.schemaVersion !== 1) throw new TaskValidationError("Invalid or unsupported task record.");
  for (const key of ["id", "title", "goal", "createdAt", "updatedAt"]) if (typeof value[key] !== "string") throw new TaskValidationError(`Task ${key} is required.`);
  if (!/^[a-z0-9]{8}-[0-9]{6}-[a-z0-9]+(?:-[0-9]+)?$/u.test(String(value.id)) || !["lite", "full"].includes(String(value.mode)) || !Object.keys(transitions).includes(String(value.status)) || !["triage", "planning", "ready", "implementing", "debugging", "replan", "verifying", "finishing"].includes(String(value.checkpoint))) throw new TaskValidationError("Task identity, mode, status, or checkpoint is invalid.");
  if (!Array.isArray(value.nonGoals) || !Array.isArray(value.acceptanceCriteria) || !Array.isArray(value.relevantPaths) || !Array.isArray(value.relevantSpecs) || !Array.isArray(value.validationPlan) || !Array.isArray(value.evidence)) throw new TaskValidationError("Task arrays are required.");
  if (!(value.nonGoals as unknown[]).every((item) => typeof item === "string") || !(value.relevantPaths as unknown[]).every((item) => typeof item === "string") || !(value.relevantSpecs as unknown[]).every((item) => typeof item === "string")) throw new TaskValidationError("Task path and goal arrays are invalid.");
  if (!(value.validationPlan as unknown[]).every((item) => isRecord(item) && typeof item.id === "string" && typeof item.description === "string" && ["focused", "full"].includes(String(item.scope)) && typeof item.required === "boolean")) throw new TaskValidationError("Validation plan is invalid.");
  if (!(value.evidence as unknown[]).every((item) => isRecord(item) && typeof item.id === "string" && typeof item.recordedAt === "string" && ["pass", "fail", "skipped"].includes(String(item.result)) && typeof item.summary === "string" && Array.isArray(item.artifactPaths) && (item.artifactPaths as unknown[]).every((path) => typeof path === "string"))) throw new TaskValidationError("Evidence is invalid.");
  if (!(value.acceptanceCriteria as unknown[]).every((item) => isRecord(item) && typeof item.id === "string" && typeof item.text === "string" && ["pending", "met", "waived"].includes(String(item.status)) && Array.isArray(item.evidenceIds) && (item.evidenceIds as unknown[]).every((id) => typeof id === "string"))) throw new TaskValidationError("Acceptance criteria are invalid.");
  const evidenceIds = new Set((value.evidence as Evidence[]).map((e) => e.id));
  for (const criterion of value.acceptanceCriteria as AcceptanceCriterion[]) {
    if ((criterion.status === "met" && !criterion.evidenceIds.some((id) => evidenceIds.has(id))) || (criterion.status === "waived" && !criterion.waiverReason?.trim())) throw new TaskValidationError("Acceptance criterion evidence/waiver is invalid.");
  }
  if (value.status === "blocked" && (!isRecord(value.blocker) || !["decision", "authority", "credential", "external", "repository"].includes(String(value.blocker.kind)) || typeof value.blocker.summary !== "string" || typeof value.blocker.nextAction !== "string" || !["planning", "ready", "in_progress", "verifying"].includes(String(value.blocker.resumeStatus)))) throw new TaskValidationError("Blocked task blocker is invalid.");
  if (value.status === "blocked" && !value.blocker) throw new TaskValidationError("Blocked tasks require a blocker.");
  if (value.status === "completed" && (!value.completedAt || value.blocker || (value.acceptanceCriteria as AcceptanceCriterion[]).some((c) => c.status === "pending" && (value.validationPlan as ValidationCheck[]).some((v) => v.required)))) throw new TaskValidationError("Completed task is missing completion requirements.");
  return value as unknown as TaskRecord;
}

export function transitionTask(task: TaskRecord, status: TaskStatus, checkpoint: WorkflowCheckpoint, now = new Date().toISOString()): TaskRecord {
  if (!transitions[task.status].includes(status)) throw new TaskValidationError(`Illegal task transition ${task.status} -> ${status}.`);
  if (task.status === "blocked" && task.blocker?.resumeStatus !== status) throw new TaskValidationError("Blocked task must resume to its recorded status.");
  return validateTask({ ...task, status, checkpoint, updatedAt: now, ...(status === "completed" ? { completedAt: now } : {}) });
}

export async function saveTask(root: string, task: TaskRecord): Promise<void> { const valid = validateTask(task); await mkdir(join(root, "tasks", valid.id), { recursive: true }); await atomicWriteFile(join(root, "tasks", valid.id, "task.json"), JSON.stringify(valid, null, 2) + "\n"); }
export interface TaskArtifacts { prd?: string; plan?: string; design?: string; research?: Record<string, string>; }
export async function saveTaskWithArtifacts(root: string, task: TaskRecord, artifacts: TaskArtifacts = {}): Promise<void> {
  await saveTask(root, task);
  const directory = join(root, "tasks", task.id);
  if (task.mode === "full") {
    if (!artifacts.prd?.trim() || !artifacts.plan?.trim()) throw new TaskValidationError("Full tasks require prd.md and plan.md.");
    await atomicWriteFile(join(directory, "prd.md"), artifacts.prd);
    await atomicWriteFile(join(directory, "plan.md"), artifacts.plan);
  } else if (artifacts.prd || artifacts.plan) throw new TaskValidationError("Lite tasks must not create full ceremony artifacts.");
  if (artifacts.design?.trim()) await atomicWriteFile(join(directory, "design.md"), artifacts.design);
  if (artifacts.research) for (const [name, content] of Object.entries(artifacts.research)) {
    if (!/^[a-z0-9][a-z0-9._-]*\.md$/u.test(name) || !content.trim()) throw new TaskValidationError("Research artifact name or content is invalid.");
    await atomicWriteFile(join(directory, "research", name), content);
  }
}
export async function loadTask(path: string): Promise<TaskRecord> { return validateTask(JSON.parse(await readFile(path, "utf8")) as unknown); }
export async function setActiveTask(harnixRoot: string, taskId: string): Promise<void> {
  validateTaskId(taskId);
  await atomicWriteFile(join(harnixRoot, "tasks", ".active"), `${taskId}\n`);
}
export async function resolveActiveTask(harnixRoot: string): Promise<TaskRecord | undefined> {
  try {
    const taskId = (await readFile(join(harnixRoot, "tasks", ".active"), "utf8")).trim();
    if (taskId.length === 0) return undefined;
    validateTaskId(taskId);
    return await loadTask(join(harnixRoot, "tasks", taskId, "task.json"));
  } catch (error: unknown) {
    if (isMissing(error)) return undefined;
    throw error;
  }
}
export async function clearActiveTask(harnixRoot: string, taskId: string): Promise<void> {
  const activePath = join(harnixRoot, "tasks", ".active");
  try { if ((await readFile(activePath, "utf8")).trim() === taskId) await atomicWriteFile(activePath, ""); } catch (error: unknown) { if (!isMissing(error)) throw error; }
}
export async function archiveTask(harnixRoot: string, task: TaskRecord): Promise<void> {
  const valid = validateTask(task);
  if (valid.status !== "completed") throw new TaskValidationError("Only completed tasks can be archived.");
  await clearActiveTask(harnixRoot, valid.id);
}
function validateTaskId(value: string): void { if (!/^\d{8}-\d{6}-[a-z0-9]+(?:-\d+)?$/u.test(value)) throw new TaskValidationError("Task ID is unsafe."); }
function isMissing(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
