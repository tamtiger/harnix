import { readConfig } from "../core/config/config.js";
import { finishWorkflowTask } from "../core/workflow.js";
import {
  loadTask,
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

export interface WorkflowSaveEnvelope {
  task: unknown;
  artifacts?: TaskArtifacts | undefined;
}

/** Hidden transport for agents; it preserves TaskRecord v1 and is deliberately JSON-only. */
export async function inspectWorkflow(root: string): Promise<{ activeTask: TaskRecord | null }> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  return { activeTask: await resolveActiveTask(harnixRoot) ?? null };
}

export async function saveWorkflow(root: string, envelope: WorkflowSaveEnvelope): Promise<TaskRecord> {
  if (!isRecord(envelope)) throw new Error("Workflow save envelope is invalid.");
  const candidate = validateTask(envelope.task);
  const harnixRoot = await resolveSafeHarnixPath(root);
  const active = await resolveActiveTask(harnixRoot);
  const existing = await loadExistingTask(harnixRoot, candidate.id);

  if (active && active.id !== candidate.id) throw new Error("Workflow save may update only the active task.");
  if (existing) {
    preserveEvidence(existing.evidence, candidate.evidence);
    assertLegalTransition(existing, candidate);
  } else {
    if (active || candidate.status !== "planning") throw new Error("Workflow save may create only a planning task when no task is active.");
    if (candidate.mode === "full" && !envelope.artifacts) throw new Error("Full tasks require prd.md and plan.md.");
  }

  if (candidate.status === "completed") throw new Error("Workflow completion must use internal workflow finish.");
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
  const journalPath = await resolveSafeHarnixPath(root, `workspace/${config.developer}/journal/${now.slice(0, 10)}.jsonl`);
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

function assertLegalTransition(previous: TaskRecord, next: TaskRecord): void {
  if (previous.status === next.status) {
    updateTaskCheckpoint(previous, next.checkpoint, next.updatedAt);
    return;
  }
  transitionTask(previous, next.status, next.checkpoint, next.updatedAt, next.blocker);
}

function isMissing(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
