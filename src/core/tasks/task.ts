import { mkdir, readFile } from "node:fs/promises";
import { atomicWriteFile } from "../../utils/atomic-write.js";
import { normalizeRepositoryPath, resolveSafeProjectPath } from "../../utils/paths.js";
import { contextSelectionResultHash, saveContextSelectionSnapshot, validateContextSelectionSnapshot, type ContextSelectionSnapshotV1 } from "../context/selection-freshness.js";
import { saveContextManifest, validateContextManifest, type ContextManifest } from "../context/context.js";

export type TaskMode = "lite" | "full";
export type TaskStatus = "planning" | "ready" | "in_progress" | "verifying" | "blocked" | "completed" | "cancelled";
export type WorkflowCheckpoint = "triage" | "planning" | "ready" | "implementing" | "debugging" | "replan" | "verifying" | "finishing" | "cancelling";
export interface AcceptanceCriterion { id: string; text: string; status: "pending" | "met" | "waived"; evidenceIds: string[]; waiverReason?: string; }
interface ValidationCheckBase { id: string; description: string; command?: string; scope: "focused" | "full"; required: boolean; }
export interface ValidationCheckV1 extends ValidationCheckBase { criterionIds?: never; inputs?: never; }
export interface ValidationCheckV2 extends ValidationCheckBase { criterionIds: string[]; inputs: string[]; }
export type ValidationCheck = ValidationCheckV1 | ValidationCheckV2;
interface EvidenceBase { id: string; checkId?: string; recordedAt: string; result: "pass" | "fail" | "skipped"; exitCode?: number; summary: string; artifactPaths: string[]; }
export interface EvidenceV1 extends EvidenceBase { inputDigest?: never; }
export interface EvidenceV2 extends EvidenceBase { inputDigest?: string; }
export type Evidence = EvidenceV1 | EvidenceV2;
export interface TaskBlocker { kind: "decision" | "authority" | "credential" | "external" | "repository"; summary: string; nextAction: string; resumeStatus: "planning" | "ready" | "in_progress" | "verifying"; }
export interface TaskCancellation { reason: string; authorizedBy: "user"; }
interface TaskRecordBase { generator: "harnix"; id: string; title: string; mode: TaskMode; status: TaskStatus; checkpoint: WorkflowCheckpoint; goal: string; nonGoals: string[]; acceptanceCriteria: AcceptanceCriterion[]; relevantPaths: string[]; relevantSpecs: string[]; blocker?: TaskBlocker; cancellation?: TaskCancellation; createdAt: string; updatedAt: string; completedAt?: string; cancelledAt?: string; }
export interface TaskRecordV1 extends TaskRecordBase { schemaVersion: 1; validationPlan: ValidationCheckV1[]; evidence: EvidenceV1[]; }
export interface TaskRecordV2 extends TaskRecordBase { schemaVersion: 2; validationPlan: ValidationCheckV2[]; evidence: EvidenceV2[]; }
export type TaskRecord = TaskRecordV1 | TaskRecordV2;
export interface TaskValidationOptions { allowUnsafeCompletedEvidenceArtifacts?: boolean | undefined; }

export const TASK_V2_MIGRATION_EVIDENCE_ID = "task-schema-v1-to-v2";
export const TASK_V2_MIGRATION_SUMMARY = "Migrated TaskRecord schema from v1 to v2 with explicit authorization at replan.";

export function createTaskV2MigrationEvidence(taskId: string, recordedAt: string): EvidenceV2 {
  return {
    id: TASK_V2_MIGRATION_EVIDENCE_ID,
    recordedAt,
    result: "pass",
    summary: TASK_V2_MIGRATION_SUMMARY,
    artifactPaths: [`.harnix/tasks/${taskId}/task.json`],
  };
}

// Selects the representative evidence for a check. Time-valid evidence (finite
// timestamp not in the future relative to `now`) is preferred over invalid or
// future-dated evidence so an immutable future-dated record cannot mask a later
// legitimate pass. Within the same validity class the newer `recordedAt` wins,
// and exact ties keep append order (the later array element wins).
export function selectLatestEvidence(evidence: readonly Evidence[], checkId: string, now = Date.now()): Evidence | undefined {
  let latest: Evidence | undefined;
  let latestTime = Number.NaN;
  let latestValid = false;
  for (const candidate of evidence) {
    if (candidate.checkId !== checkId) continue;
    const time = Date.parse(candidate.recordedAt);
    const valid = Number.isFinite(time) && time <= now;
    if (latest === undefined || (valid && !latestValid) || (valid === latestValid && time >= latestTime)) {
      latest = candidate;
      latestTime = time;
      latestValid = valid;
    }
  }
  return latest;
}

export class TaskValidationError extends Error { override name = "TaskValidationError"; }
const taskIdPattern = /^\d{8}-\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const taskRecordKeys = new Set(["acceptanceCriteria", "blocker", "cancellation", "cancelledAt", "checkpoint", "completedAt", "createdAt", "evidence", "generator", "goal", "id", "mode", "nonGoals", "relevantPaths", "relevantSpecs", "schemaVersion", "status", "title", "updatedAt", "validationPlan"]);
const acceptanceCriterionKeys = new Set(["evidenceIds", "id", "status", "text", "waiverReason"]);
const validationCheckV1Keys = new Set(["command", "description", "id", "required", "scope"]);
const validationCheckV2Keys = new Set([...validationCheckV1Keys, "criterionIds", "inputs"]);
const evidenceV1Keys = new Set(["artifactPaths", "checkId", "exitCode", "id", "recordedAt", "result", "summary"]);
const evidenceV2Keys = new Set([...evidenceV1Keys, "inputDigest"]);
const blockerKeys = new Set(["kind", "nextAction", "resumeStatus", "summary"]);
const cancellationKeys = new Set(["authorizedBy", "reason"]);
const transitions: Record<TaskStatus, TaskStatus[]> = {
  planning: ["ready", "blocked"],
  ready: ["in_progress", "blocked"],
  in_progress: ["verifying", "blocked"],
  verifying: ["completed", "blocked"],
  blocked: ["planning", "ready", "in_progress", "verifying"],
  completed: [],
  cancelled: [],
};
const cancellableStatuses = new Set<TaskStatus>(["planning", "ready", "in_progress", "verifying", "blocked"]);
const legalCheckpoints: Record<Exclude<TaskStatus, "blocked">, readonly WorkflowCheckpoint[]> = {
  planning: ["triage", "planning", "replan"],
  ready: ["ready", "replan"],
  in_progress: ["implementing", "debugging", "replan"],
  verifying: ["verifying", "debugging", "replan", "finishing"],
  completed: ["finishing"],
  cancelled: ["cancelling"],
};

export function validateTask(value: unknown, options: TaskValidationOptions = {}): TaskRecord {
  if (!isRecord(value) || value.generator !== "harnix" || (value.schemaVersion !== 1 && value.schemaVersion !== 2)) throw new TaskValidationError("Invalid or unsupported task record.");
  assertExactKeys(value, taskRecordKeys, "TaskRecord");
  for (const key of ["id", "title", "goal", "createdAt", "updatedAt"]) if (typeof value[key] !== "string") throw new TaskValidationError(`Task ${key} is required.`);
  if (!taskIdPattern.test(String(value.id)) || !["lite", "full"].includes(String(value.mode)) || !Object.keys(transitions).includes(String(value.status)) || !["triage", "planning", "ready", "implementing", "debugging", "replan", "verifying", "finishing", "cancelling"].includes(String(value.checkpoint))) throw new TaskValidationError("Task identity, mode, status, or checkpoint is invalid.");
  if (!Array.isArray(value.nonGoals) || !Array.isArray(value.acceptanceCriteria) || !Array.isArray(value.relevantPaths) || !Array.isArray(value.relevantSpecs) || !Array.isArray(value.validationPlan) || !Array.isArray(value.evidence)) throw new TaskValidationError("Task arrays are required.");
  if (!isIsoTimestamp(value.createdAt) || !isIsoTimestamp(value.updatedAt) || Date.parse(value.updatedAt) < Date.parse(value.createdAt)) throw new TaskValidationError("Task timestamp is invalid.");
  if (!(value.nonGoals as unknown[]).every((item) => typeof item === "string") || !(value.relevantPaths as unknown[]).every((item) => typeof item === "string") || !(value.relevantSpecs as unknown[]).every((item) => typeof item === "string")) throw new TaskValidationError("Task path and goal arrays are invalid.");
  if (!(value.validationPlan as unknown[]).every((item) => isRecord(item) && validId(item.id) && typeof item.description === "string" && ["focused", "full"].includes(String(item.scope)) && typeof item.required === "boolean" && (item.command === undefined || typeof item.command === "string"))) throw new TaskValidationError("Validation plan is invalid.");
  for (const item of value.validationPlan as Record<string, unknown>[]) assertExactKeys(item, value.schemaVersion === 1 ? validationCheckV1Keys : validationCheckV2Keys, "Validation check");
  if (value.schemaVersion === 1 && !(value.validationPlan as unknown[]).every((item) => isRecord(item) && item.criterionIds === undefined && item.inputs === undefined)) throw new TaskValidationError("TaskRecord v1 validation plan is invalid.");
  const allowUnsafeCompletedEvidenceArtifacts = options.allowUnsafeCompletedEvidenceArtifacts === true && value.status === "completed";
  if (!(value.evidence as unknown[]).every((item) => isRecord(item) && validId(item.id) && (item.checkId === undefined || validId(item.checkId)) && typeof item.recordedAt === "string" && isIsoTimestamp(item.recordedAt) && ["pass", "fail", "skipped"].includes(String(item.result)) && (item.exitCode === undefined || Number.isInteger(item.exitCode)) && typeof item.summary === "string" && Array.isArray(item.artifactPaths) && (allowUnsafeCompletedEvidenceArtifacts || (item.artifactPaths as unknown[]).every(isSafeRepositoryPath)))) throw new TaskValidationError("Evidence is invalid.");
  for (const item of value.evidence as Record<string, unknown>[]) assertExactKeys(item, value.schemaVersion === 1 ? evidenceV1Keys : evidenceV2Keys, "Evidence");
  if (value.schemaVersion === 1 && !(value.evidence as unknown[]).every((item) => isRecord(item) && item.inputDigest === undefined)) throw new TaskValidationError("TaskRecord v1 evidence is invalid.");
  if (!(value.acceptanceCriteria as unknown[]).every((item) => isRecord(item) && typeof item.id === "string" && typeof item.text === "string" && ["pending", "met", "waived"].includes(String(item.status)) && Array.isArray(item.evidenceIds) && (item.evidenceIds as unknown[]).every((id) => typeof id === "string"))) throw new TaskValidationError("Acceptance criteria are invalid.");
  for (const item of value.acceptanceCriteria as Record<string, unknown>[]) assertExactKeys(item, acceptanceCriterionKeys, "Acceptance criterion");
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
  if (value.schemaVersion === 2) validateV2Contracts(value, checks);
  const evidenceIds = new Set((value.evidence as Evidence[]).map((e) => e.id));
  for (const criterion of value.acceptanceCriteria as AcceptanceCriterion[]) {
    if ((criterion.status === "met" && !criterion.evidenceIds.some((id) => evidenceIds.has(id))) || (criterion.status === "waived" && !criterion.waiverReason?.trim())) throw new TaskValidationError("Acceptance criterion evidence/waiver is invalid.");
  }
  if (value.status === "blocked" && (!isRecord(value.blocker) || !["decision", "authority", "credential", "external", "repository"].includes(String(value.blocker.kind)) || typeof value.blocker.summary !== "string" || typeof value.blocker.nextAction !== "string" || !["planning", "ready", "in_progress", "verifying"].includes(String(value.blocker.resumeStatus)))) throw new TaskValidationError("Blocked task blocker is invalid.");
  if (isRecord(value.blocker)) assertExactKeys(value.blocker, blockerKeys, "Task blocker");
  if (value.status === "blocked" && !value.blocker) throw new TaskValidationError("Blocked tasks require a blocker.");
  if (value.status !== "blocked" && value.blocker !== undefined) throw new TaskValidationError("Only blocked tasks may retain a blocker.");
  if (value.status === "cancelled") {
    if (isRecord(value.cancellation)) assertExactKeys(value.cancellation, cancellationKeys, "Task cancellation");
    if (!isRecord(value.cancellation) || !isCancellationReason(value.cancellation.reason) || value.cancellation.authorizedBy !== "user" || !isIsoTimestamp(value.cancelledAt) || Date.parse(value.cancelledAt) < Date.parse(String(value.updatedAt)) || value.completedAt !== undefined) {
      throw new TaskValidationError("Cancelled task is missing cancellation requirements.");
    }
  } else if (value.cancellation !== undefined || value.cancelledAt !== undefined) {
    throw new TaskValidationError("Only cancelled tasks may retain cancellation metadata.");
  }
  const checkpointOwner: Exclude<TaskStatus, "blocked"> = value.status === "blocked" ? (value.blocker as TaskBlocker).resumeStatus : value.status as Exclude<TaskStatus, "blocked">;
  if (!legalCheckpoints[checkpointOwner].includes(value.checkpoint as WorkflowCheckpoint)) throw new TaskValidationError("Task status/checkpoint combination is invalid.");
  if (value.status === "completed" && (!value.completedAt || !isIsoTimestamp(value.completedAt) || Date.parse(value.completedAt) < Date.parse(value.updatedAt) || (value.acceptanceCriteria as AcceptanceCriterion[]).some((criterion) => criterion.status === "pending"))) throw new TaskValidationError("Completed task is missing completion requirements.");
  return value as unknown as TaskRecord;
}

function validateV2Contracts(value: Record<string, unknown>, checks: Map<string, ValidationCheck>): void {
  const criteria = value.acceptanceCriteria as AcceptanceCriterion[];
  if (criteria.some((criterion) => !validId(criterion.id))) throw new TaskValidationError("TaskRecord v2 acceptance criterion ID is invalid.");
  const criterionIds = new Set(criteria.map((criterion) => criterion.id));
  const validationPlan = value.validationPlan as ValidationCheckV2[];
  for (const check of validationPlan) {
    if (!Array.isArray(check.criterionIds) || !check.criterionIds.every(validId) || !isSortedUnique(check.criterionIds) || (check.required && check.criterionIds.length === 0)) {
      throw new TaskValidationError("TaskRecord v2 validation criterion coverage is invalid.");
    }
    if (check.criterionIds.some((id) => !criterionIds.has(id))) throw new TaskValidationError("TaskRecord v2 validation criterion reference is invalid.");
    if (!Array.isArray(check.inputs) || check.inputs.length === 0 || !check.inputs.every(isSafeVerificationInput) || !isSortedUnique(check.inputs) || !check.inputs.includes("@task-contract")) {
      throw new TaskValidationError("TaskRecord v2 validation inputs are invalid.");
    }
    if (isBehavioralCheck(check) && check.inputs.every((input) => input === "@task-contract")) {
      throw new TaskValidationError("Behavioral TaskRecord v2 validation requires a repository input.");
    }
  }
  const covered = new Set(validationPlan.filter((check) => check.required).flatMap((check) => check.criterionIds));
  if (criteria.some((criterion) => criterion.status !== "waived" && !covered.has(criterion.id))) {
    throw new TaskValidationError("TaskRecord v2 criterion coverage is incomplete.");
  }
  const evidenceList = value.evidence as EvidenceV2[];
  const migrationIndex = evidenceList.findIndex((evidence) => evidence.id === TASK_V2_MIGRATION_EVIDENCE_ID);
  if (migrationIndex >= 0 && JSON.stringify(evidenceList[migrationIndex]) !== JSON.stringify(createTaskV2MigrationEvidence(String(value.id), evidenceList[migrationIndex]!.recordedAt))) {
    throw new TaskValidationError("TaskRecord v2 migration evidence is invalid.");
  }
  for (const [index, evidence] of evidenceList.entries()) {
    const check = evidence.checkId === undefined ? undefined : checks.get(evidence.checkId);
    const preservedLegacyPass = migrationIndex > index;
    if (evidence.result === "pass" && check?.required === true && !isInputDigest(evidence.inputDigest) && !preservedLegacyPass) {
      throw new TaskValidationError("Required passing TaskRecord v2 evidence requires a valid input digest.");
    }
    if (evidence.inputDigest !== undefined && !isInputDigest(evidence.inputDigest)) {
      throw new TaskValidationError("TaskRecord v2 evidence input digest is invalid.");
    }
  }
}

export function transitionTask(task: TaskRecord, status: TaskStatus, checkpoint: WorkflowCheckpoint, now = new Date().toISOString(), blocker?: TaskBlocker): TaskRecord {
  if (!transitions[task.status].includes(status)) throw new TaskValidationError(`Illegal task transition ${task.status} -> ${status}.`);
  if (task.status === "blocked" && task.blocker?.resumeStatus !== status) throw new TaskValidationError("Blocked task must resume to its recorded status.");
  if (status === "blocked" && blocker === undefined) throw new TaskValidationError("Transitioning to blocked requires a blocker.");
  const withoutBlocker = { ...task };
  delete withoutBlocker.blocker;
  return validateTask({ ...withoutBlocker, ...(status === "blocked" ? { blocker } : {}), status, checkpoint, updatedAt: now, ...(status === "completed" ? { completedAt: now } : {}) });
}

export function cancelTask(task: TaskRecord, cancellation: TaskCancellation, now = new Date().toISOString()): TaskRecord {
  if (!cancellableStatuses.has(task.status)) throw new TaskValidationError(`Cannot cancel terminal ${task.status} task.`);
  const reason = cancellation.reason.trim();
  if (!isCancellationReason(reason)) throw new TaskValidationError("Task cancellation reason is invalid.");
  const withoutBlocker = { ...task };
  delete withoutBlocker.blocker;
  return validateTask({ ...withoutBlocker, status: "cancelled", checkpoint: "cancelling", cancellation: { reason, authorizedBy: cancellation.authorizedBy }, updatedAt: now, cancelledAt: now });
}

export function updateTaskCheckpoint(task: TaskRecord, checkpoint: WorkflowCheckpoint, now = new Date().toISOString()): TaskRecord {
  if (task.status === "blocked" || task.status === "completed" || task.status === "cancelled") throw new TaskValidationError("Cannot update the checkpoint for blocked or terminal tasks.");
  return validateTask({ ...task, checkpoint, updatedAt: now });
}

export async function saveTask(root: string, task: TaskRecord): Promise<void> { const valid = validateTask(task); const directory = await resolveSafeProjectPath(root, `tasks/${valid.id}`); const path = await resolveSafeProjectPath(root, `tasks/${valid.id}/task.json`); await mkdir(directory, { recursive: true }); await atomicWriteFile(path, JSON.stringify(valid, null, 2) + "\n"); }
export interface TaskArtifacts { prd?: string; plan?: string; design?: string; research?: Record<string, string>; context?: ContextManifest; contextSelection?: ContextSelectionSnapshotV1; }
export async function saveTaskWithArtifacts(root: string, task: TaskRecord, artifacts: TaskArtifacts = {}): Promise<void> {
  await saveTaskArtifacts(root, task, artifacts);
  await saveTask(root, task);
}
export function validateTaskArtifacts(task: TaskRecord, artifacts: TaskArtifacts = {}): void {
  if (task.mode === "full") {
    if (!artifacts.prd?.trim() || !artifacts.plan?.trim()) throw new TaskValidationError("Full tasks require prd.md and plan.md.");
  } else if (artifacts.prd || artifacts.plan) throw new TaskValidationError("Lite tasks must not create full ceremony artifacts.");
  if (artifacts.research) for (const [name, content] of Object.entries(artifacts.research)) if (!/^[a-z0-9][a-z0-9._-]*\.md$/u.test(name) || !content.trim()) throw new TaskValidationError("Research artifact name or content is invalid.");
  if ((artifacts.context === undefined) !== (artifacts.contextSelection === undefined)) throw new TaskValidationError("Context persistence requires both manifest and selection snapshot.");
  if (artifacts.context && artifacts.contextSelection) {
    const manifest = validateContextManifest(artifacts.context);
    const snapshot = validateContextSelectionSnapshot(artifacts.contextSelection);
    if (manifest.taskId !== task.id || snapshot.taskId !== task.id || snapshot.selectionResultHash !== contextSelectionResultHash(manifest)) throw new TaskValidationError("Context persistence task binding is invalid.");
  }
}
export async function saveTaskArtifacts(root: string, task: TaskRecord, artifacts: TaskArtifacts = {}): Promise<void> {
  validateTaskArtifacts(task, artifacts);
  const directory = await resolveSafeProjectPath(root, `tasks/${task.id}`);
  await mkdir(directory, { recursive: true });
  if (task.mode === "full") {
    await atomicWriteFile(await resolveSafeProjectPath(directory, "prd.md"), artifacts.prd!);
    await atomicWriteFile(await resolveSafeProjectPath(directory, "plan.md"), artifacts.plan!);
  }
  if (artifacts.design?.trim()) await atomicWriteFile(await resolveSafeProjectPath(directory, "design.md"), artifacts.design);
  if (artifacts.research) for (const [name, content] of Object.entries(artifacts.research)) {
    await atomicWriteFile(await resolveSafeProjectPath(directory, `research/${name}`), content);
  }
  if (artifacts.context && artifacts.contextSelection) {
    await saveContextManifest(directory, artifacts.context);
    await saveContextSelectionSnapshot(directory, artifacts.contextSelection);
  }
}
export async function loadTask(path: string): Promise<TaskRecord> { return validateTask(JSON.parse(await readFile(path, "utf8")) as unknown); }
export async function setActiveTask(harnixRoot: string, taskId: string): Promise<void> {
  validateTaskId(taskId);
  await atomicWriteFile(await resolveSafeProjectPath(harnixRoot, "tasks/.active"), `${taskId}\n`);
}
export async function resolveActiveTask(harnixRoot: string): Promise<TaskRecord | undefined> {
  const activePath = await resolveSafeProjectPath(harnixRoot, "tasks/.active");
  let taskId: string;
  try {
    taskId = (await readFile(activePath, "utf8")).trim();
  } catch (error: unknown) {
    if (isMissing(error)) return undefined;
    throw error;
  }
  if (taskId.length === 0) return undefined;
  validateTaskId(taskId);
  try {
    return await loadTask(await resolveSafeProjectPath(harnixRoot, `tasks/${taskId}/task.json`));
  } catch (error: unknown) {
    if (isMissing(error)) throw new TaskValidationError("Active task pointer references a missing task record.");
    throw error;
  }
}
export async function clearActiveTask(harnixRoot: string, taskId: string): Promise<void> {
  const activePath = await resolveSafeProjectPath(harnixRoot, "tasks/.active");
  try { if ((await readFile(activePath, "utf8")).trim() === taskId) await atomicWriteFile(activePath, ""); } catch (error: unknown) { if (!isMissing(error)) throw error; }
}
export async function archiveTask(harnixRoot: string, task: TaskRecord): Promise<void> {
  const valid = validateTask(task);
  if (valid.status !== "completed" && valid.status !== "cancelled") throw new TaskValidationError("Only terminal tasks can be archived.");
  await clearActiveTask(harnixRoot, valid.id);
}
function validateTaskId(value: string): void { if (!taskIdPattern.test(value)) throw new TaskValidationError("Task ID is unsafe."); }
function isMissing(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isIsoTimestamp(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value) && Number.isFinite(Date.parse(value)); }
function isCancellationReason(value: unknown): value is string { return typeof value === "string" && value.length > 0 && value.length <= 1_000 && value === value.trim() && [...value].every((character) => { const codePoint = character.codePointAt(0)!; return codePoint > 31 && codePoint !== 127; }); }
function validId(value: unknown): value is string { return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value); }
function isSafeRepositoryPath(value: unknown): value is string { if (typeof value !== "string") return false; try { return normalizeRepositoryPath(value, { allowRoot: true }) === value; } catch { return false; } }
function ensureUnique(ids: readonly string[], label: string): void { if (new Set(ids).size !== ids.length) throw new TaskValidationError(`Duplicate ${label} ID.`); }
function assertExactKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>, label: string): void {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new TaskValidationError(`${label} contains an unknown schema field.`);
}
function isSortedUnique(values: readonly string[]): boolean { return new Set(values).size === values.length && values.every((value, index) => index === 0 || values[index - 1]! < value); }
function isSafeVerificationInput(value: unknown): value is string {
  if (value === "@task-contract") return true;
  if (typeof value !== "string" || value.length === 0 || value.startsWith("!") || value.includes("\\") || value.startsWith("/") || /^[A-Za-z]:/u.test(value) || value.includes("\0")) return false;
  const segments = value.split("/");
  return segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
}
function isBehavioralCheck(check: ValidationCheckV2): boolean {
  return /(?:^|[^a-z])(repository|source|file|build|test|lint|typecheck|package|runtime|code|compile|smoke|acceptance)(?:$|[^a-z])/iu.test(`${check.id} ${check.description} ${check.command ?? ""}`);
}
function isInputDigest(value: unknown): value is string { return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value); }
