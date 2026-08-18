import { readFile } from "node:fs/promises";
import { readConfig } from "../core/config/config.js";
import { finishWorkflowTask, taskContextDrift } from "../core/workflow.js";
import type { ContextDrift } from "../core/context/context.js";
import {
  loadTask,
  createTaskV2MigrationEvidence,
  resolveActiveTask,
  saveTask,
  saveTaskWithArtifacts,
  setActiveTask,
  transitionTask,
  updateTaskCheckpoint,
  validateTask,
  type Evidence,
  type TaskArtifacts,
  type TaskRecord,
} from "../core/tasks/task.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "../utils/paths.js";
import {
  computeVerificationInputSnapshot,
  persistNewVerificationInputSnapshots,
  type VerificationInputSnapshot,
} from "../core/verification/input-freshness.js";

export interface WorkflowSaveEnvelope {
  task: unknown;
  artifacts?: TaskArtifacts | undefined;
}

/** Hidden transport for agents; it preserves TaskRecord state and is deliberately JSON-only. */
export async function inspectWorkflow(root: string): Promise<{ activeTask: TaskRecord | null; contextDrift: ContextDrift }> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const activeTask = await resolveActiveTask(harnixRoot) ?? null;
  return {
    activeTask,
    contextDrift: activeTask === null ? { state: "not-recorded", changes: [] } : await taskContextDrift(root, harnixRoot, activeTask),
  };
}

export async function saveWorkflow(root: string, envelope: WorkflowSaveEnvelope): Promise<TaskRecord> {
  if (!isRecord(envelope)) throw new Error("Workflow save envelope is invalid.");
  const candidate = validateTask(envelope.task);
  const harnixRoot = await resolveSafeHarnixPath(root);
  const active = await resolveActiveTask(harnixRoot);
  const existing = await loadExistingTask(harnixRoot, candidate.id);

  if (active && active.id !== candidate.id) throw new Error("Workflow save may update only the active task.");
  if (existing) {
    assertSchemaEvolution(existing, candidate);
    preserveEvidence(existing.evidence, candidate.evidence);
    preserveObligations(existing, candidate);
    assertLegalTransition(existing, candidate);
  } else {
    if (active || candidate.status !== "planning") throw new Error("Workflow save may create only a planning task when no task is active.");
    if (candidate.mode === "full" && !envelope.artifacts) throw new Error("Full tasks require prd.md and plan.md.");
  }

  if (candidate.status === "completed") throw new Error("Workflow completion must use workflow finish.");
  if (candidate.status === "ready") await assertReadyRequirements(harnixRoot, candidate);
  if (candidate.schemaVersion === 2) {
    await persistNewVerificationInputSnapshots(root, harnixRoot, existing?.evidence ?? [], candidate);
  }
  if (envelope.artifacts) await saveTaskWithArtifacts(harnixRoot, candidate, envelope.artifacts);
  else await saveTask(harnixRoot, candidate);
  if (!existing) await setActiveTask(harnixRoot, candidate.id);
  return candidate;
}

export async function finishWorkflow(root: string, now = new Date().toISOString()): Promise<TaskRecord> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow finish requires an active task.");
  const config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const journalDate = task.status === "completed" ? task.completedAt! : now;
  const journalPath = await resolveSafeHarnixPath(root, `workspace/${config.developer}/journal/${journalDate.slice(0, 10)}.jsonl`);
  return finishWorkflowTask(harnixRoot, journalPath, config.developer, task, now);
}

async function loadExistingTask(harnixRoot: string, id: string): Promise<TaskRecord | undefined> {
  try { return await loadTask(await resolveSafeProjectPath(harnixRoot, `tasks/${id}/task.json`)); }
  catch (error: unknown) { if (isMissing(error)) return undefined; throw error; }
}

function preserveEvidence(previous: readonly Evidence[], next: readonly Evidence[]): void {
  const byId = new Map(next.map((evidence) => [evidence.id, evidence]));
  for (const evidence of previous) {
    const candidate = byId.get(evidence.id);
    if (!candidate || JSON.stringify(candidate) !== JSON.stringify(evidence)) throw new Error("Workflow save cannot remove or mutate existing evidence.");
  }
}

function preserveObligations(previous: TaskRecord, next: TaskRecord): void {
  const nextCriteria = new Map(next.acceptanceCriteria.map((criterion) => [criterion.id, criterion]));
  for (const criterion of previous.acceptanceCriteria) {
    const candidate = nextCriteria.get(criterion.id);
    if (!candidate) throw new Error(`Workflow save cannot remove or rename acceptance criterion ${criterion.id}.`);
    if (candidate.text !== criterion.text) throw new Error(`Workflow save cannot mutate acceptance criterion text ${criterion.id}; add a criterion or use an explicit waiver.`);
  }

  const nextChecks = new Map(next.validationPlan.map((check) => [check.id, check]));
  for (const check of previous.validationPlan.filter((candidate) => candidate.required)) {
    const candidate = nextChecks.get(check.id);
    if (candidate?.required !== true) throw new Error(`Workflow save cannot remove, rename, or demote required validation check ${check.id}.`);
    if (candidate.description !== check.description || candidate.command !== check.command || candidate.scope !== check.scope) {
      throw new Error(`Workflow save cannot mutate required validation check ${check.id}; add a check instead.`);
    }
    if (previous.schemaVersion === 2 && next.schemaVersion === 2 && (JSON.stringify(candidate.criterionIds) !== JSON.stringify(check.criterionIds) || JSON.stringify(candidate.inputs) !== JSON.stringify(check.inputs))) {
      throw new Error(`Workflow save cannot mutate required validation check ${check.id}; add a check instead.`);
    }
  }
}

export async function snapshotWorkflow(root: string, checkId: string): Promise<VerificationInputSnapshot> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (task === undefined) throw new Error("Workflow verification snapshot requires an active task.");
  if (task.schemaVersion !== 2) throw new Error("Workflow verification snapshot requires TaskRecord schema v2.");
  return computeVerificationInputSnapshot(root, task, checkId);
}

function assertSchemaEvolution(previous: TaskRecord, next: TaskRecord): void {
  if (previous.schemaVersion === next.schemaVersion) return;
  if (previous.schemaVersion === 2) throw new Error("Workflow save cannot downgrade TaskRecord schema.");
  if (previous.status === "completed" || previous.checkpoint !== "replan" || next.checkpoint !== "replan" || previous.status !== next.status) {
    throw new Error("TaskRecord v1 to v2 migration is allowed only for an unfinished task at the replan checkpoint.");
  }
  if (JSON.stringify(previous.acceptanceCriteria) !== JSON.stringify(next.acceptanceCriteria)) {
    throw new Error("TaskRecord v1 to v2 migration must preserve acceptance criteria exactly.");
  }
  const expected = createTaskV2MigrationEvidence(previous.id, next.updatedAt);
  if (next.evidence.length !== previous.evidence.length + 1 || JSON.stringify(next.evidence.slice(0, previous.evidence.length)) !== JSON.stringify(previous.evidence) || JSON.stringify(next.evidence.at(-1)) !== JSON.stringify(expected)) {
    throw new Error("TaskRecord v1 to v2 migration requires exact appended migration evidence.");
  }
}

async function assertReadyRequirements(harnixRoot: string, task: TaskRecord): Promise<void> {
  if (task.acceptanceCriteria.length === 0) throw new Error("Workflow ready requires at least one acceptance criterion.");
  if (!task.validationPlan.some((check) => check.required)) throw new Error("Workflow ready requires at least one required validation check.");
  if (task.mode !== "full") return;

  try {
    const taskDirectory = await resolveSafeProjectPath(harnixRoot, `tasks/${task.id}`);
    const prdPath = await resolveSafeProjectPath(taskDirectory, "prd.md");
    const planPath = await resolveSafeProjectPath(taskDirectory, "plan.md");
    const [prd, plan] = await Promise.all([
      readFile(prdPath, "utf8"),
      readFile(planPath, "utf8"),
    ]);
    if (!prd.trim() || !plan.trim()) throw new Error("Full tasks require non-empty prd.md and plan.md at ready.");
  } catch (error: unknown) {
    if (isMissing(error)) throw new Error("Full tasks require non-empty prd.md and plan.md at ready.");
    throw error;
  }
}

function assertLegalTransition(previous: TaskRecord, next: TaskRecord): void {
  if (previous.status === next.status) {
    updateTaskCheckpoint(previous, next.checkpoint, next.updatedAt);
    return;
  }
  transitionTask(previous, next.status, next.checkpoint, next.updatedAt, next.blocker);
}

function isMissing(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
