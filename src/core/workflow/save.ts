import { createContextSelectionSnapshot } from "src/core/context/selection-freshness.js";
import { loadEpicRecord, renderEpicMarkdown, upsertEpic, validateEpic, type EpicRecord } from "src/core/epics/epic.js";
import {
  loadTask,
  resolveActiveTask,
  saveTask,
  saveTaskArtifacts,
  setActiveTask,
  validateTask,
  validateTaskArtifacts,
  type Evidence,
  type TaskArtifacts,
  type TaskRecord,
} from "src/core/tasks/task.js";
import {
  assertLegalTransition,
  isMissing,
  isRecord,
  semanticJsonEqual,
  semanticTaskEqual,
} from "src/core/tasks/workflow-helpers.js";
import { assertNewEvidenceDigests } from "src/core/verification/input-digest.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";
import { contextSelectionInput } from "./context.js";
import { validateWorkflowSaveEnvelope, type WorkflowSaveArtifacts, type WorkflowSaveEnvelope } from "./envelope.js";
import { prepareEpicMembers, removeEpicMembers, writeEpicMembers } from "./epic-members.js";
import { assertNewEvidenceNotFuture } from "./evidence-time.js";
import { assertSchemaEvolution } from "./migration.js";
import { isAppliedContractRevisionReplay, preserveObligations } from "./obligations.js";
import { assertReadyRequirements } from "./ready.js";
import { assertNewEvidenceRetryAllowed } from "./retry-guard.js";
import { resolveEditableTask, targetTaskId } from "./target-task.js";
import { assertTextIntegrity } from "./text-integrity.js";
import { withWorkflowLock } from "./workflow-lock.js";
import {
  assertReplayArtifactsMatch,
  assertWorkflowSaveFilesUnchanged,
  captureWorkflowSaveFiles,
  restoreWorkflowSaveFiles,
} from "./save-files.js";

interface SaveContext {
  root: string;
  harnixRoot: string;
  envelope: WorkflowSaveEnvelope;
  active: TaskRecord | undefined;
  existing: TaskRecord | undefined;
}

export async function saveWorkflow(root: string, input: unknown): Promise<TaskRecord> {
  const envelope = validateWorkflowSaveEnvelope(input);
  assertTextIntegrity(envelope);
  if (isRecord(envelope.task) && envelope.task.status === "cancelled")
    throw new Error("Workflow cancellation must use workflow --cancel.");
  const candidate = validateTask(envelope.task);
  const harnixRoot = await resolveSafeHarnixPath(root);
  return withWorkflowLock(harnixRoot, () => saveWorkflowLocked(root, harnixRoot, envelope, candidate));
}

async function saveWorkflowLocked(
  root: string,
  harnixRoot: string,
  envelope: WorkflowSaveEnvelope,
  initialCandidate: TaskRecord,
): Promise<TaskRecord> {
  const existing = await loadExistingTask(harnixRoot, initialCandidate.id);
  // With --task the targeted task stands in for the active one, so the pointer is neither read nor written.
  const active =
    targetTaskId() === undefined ? await resolveActiveTask(harnixRoot) : await resolveEditableTask(harnixRoot);
  const context: SaveContext = { root, harnixRoot, envelope, active, existing };

  if (active && active.id !== initialCandidate.id) throw new Error("Workflow save may update only the active task.");
  const replayed = await replayCommittedSave(context, initialCandidate);
  if (replayed !== undefined) return replayed;
  const candidate = existing
    ? validateAgainstExisting(existing, initialCandidate, envelope)
    : validateNewTask(active, initialCandidate);

  assertNewEvidenceNotFuture(existing?.evidence ?? [], candidate.evidence);
  assertNewEvidenceRetryAllowed(existing, candidate);
  if (candidate.status === "completed") throw new Error("Workflow completion must use workflow --finish.");
  if (candidate.status === "ready")
    await assertReadyRequirements(harnixRoot, candidate, envelope.artifacts, existing?.checkpoint !== "ready");

  const validatedEpic = envelope.epic !== undefined ? validateEpic(envelope.epic) : undefined;
  const artifacts = await prepareWorkflowArtifacts(root, harnixRoot, candidate, envelope.artifacts);
  if (artifacts) validateTaskArtifacts(candidate, artifacts);
  await persistCandidate(context, candidate, artifacts, validatedEpic);
  if (active === undefined) await setActiveTask(harnixRoot, candidate.id);
  return candidate;
}

/** Idempotent replays: a re-sent committed revision, or an exact re-send of a task whose active pointer was lost. */
async function replayCommittedSave(context: SaveContext, candidate: TaskRecord): Promise<TaskRecord | undefined> {
  const { root, harnixRoot, envelope, active, existing } = context;
  if (!existing) return undefined;
  if (isAppliedContractRevisionReplay(existing, candidate, envelope.contractRevision)) {
    await assertReplayMatches(root, harnixRoot, candidate, envelope);
    if (active === undefined) await setActiveTask(harnixRoot, candidate.id);
    return existing;
  }
  if (active === undefined) {
    if (envelope.contractRevision !== undefined || !semanticTaskEqual(existing, candidate)) {
      throw new Error(
        "Workflow save with a missing active pointer requires an exact task replay; select an inactive task through harnix resume.",
      );
    }
    await assertReplayMatches(root, harnixRoot, candidate, envelope);
    await setActiveTask(harnixRoot, candidate.id);
    return existing;
  }
  return undefined;
}

async function assertReplayMatches(
  root: string,
  harnixRoot: string,
  candidate: TaskRecord,
  envelope: WorkflowSaveEnvelope,
): Promise<void> {
  const artifacts = await prepareWorkflowArtifacts(root, harnixRoot, candidate, envelope.artifacts);
  if (artifacts) validateTaskArtifacts(candidate, artifacts);
  await assertReplayArtifactsMatch(harnixRoot, candidate, artifacts);
}

function validateAgainstExisting(
  existing: TaskRecord,
  candidate: TaskRecord,
  envelope: WorkflowSaveEnvelope,
): TaskRecord {
  assertSchemaEvolution(existing, candidate);
  if (existing.mode === "full" && candidate.mode !== "full")
    throw new Error("Workflow save cannot downgrade a Full task to Lite mode.");
  preserveEvidence(existing.evidence, candidate.evidence);
  const preserved = preserveObligations(existing, candidate, envelope.contractRevision);
  assertLegalTransition(existing, preserved);
  return preserved;
}

function validateNewTask(active: TaskRecord | undefined, candidate: TaskRecord): TaskRecord {
  if (candidate.schemaVersion !== 3) throw new Error("Workflow save requires TaskRecord schema v3 for every new task.");
  if (active || candidate.status !== "planning")
    throw new Error("Workflow save may create only a planning task when no task is active.");
  return candidate;
}

/** Writes artifacts, the task record last, then epic side effects; rolls back only what this attempt owns. */
async function persistCandidate(
  context: SaveContext,
  candidate: TaskRecord,
  artifacts: TaskArtifacts | undefined,
  validatedEpic: EpicRecord | undefined,
): Promise<void> {
  const { root, harnixRoot, envelope, existing } = context;
  const rollbackSnapshot = await captureWorkflowSaveFiles(harnixRoot, candidate, artifacts);
  await assertWorkflowSaveFilesUnchanged(rollbackSnapshot);
  const newMembers = await prepareEpicMembers(
    harnixRoot,
    envelope.epicMembers ?? [],
    validatedEpic ? validatedEpic.id : candidate.schemaVersion !== 1 ? candidate.epicId : undefined,
  );
  let taskCommitted = false;
  let createdMembers: string[] = [];
  try {
    if (candidate.schemaVersion === 3) await assertNewEvidenceDigests(root, existing?.evidence ?? [], candidate);
    createdMembers = await writeEpicMembers(harnixRoot, newMembers);
    if (artifacts) await saveTaskArtifacts(harnixRoot, candidate, artifacts);
    await saveTask(harnixRoot, candidate);
    taskCommitted = true;
    if (validatedEpic) await upsertEpic(root, validatedEpic);
    // Regenerate markdown if task has epicId matching an existing epic, unless
    // this same save already upserted (and rendered) that exact epic above.
    if (candidate.schemaVersion !== 1 && candidate.epicId !== undefined && candidate.epicId !== validatedEpic?.id) {
      const epicId = candidate.epicId;
      const epic = await loadEpicRecord(root, epicId);
      await renderEpicMarkdown(root, epicId, epic);
    }
  } catch (error: unknown) {
    if (!taskCommitted) {
      try {
        await removeEpicMembers(harnixRoot, createdMembers);
        await restoreWorkflowSaveFiles(rollbackSnapshot);
      } catch (rollbackError: unknown) {
        const detail = rollbackError instanceof Error ? ` ${rollbackError.message}` : "";
        throw new Error(`Workflow save failed and rollback could not safely restore every prior task file.${detail}`, {
          cause: error,
        });
      }
    }
    throw error;
  }
}

async function prepareWorkflowArtifacts(
  root: string,
  harnixRoot: string,
  task: TaskRecord,
  artifacts: WorkflowSaveArtifacts | undefined,
): Promise<TaskArtifacts | undefined> {
  return artifacts?.context === undefined
    ? artifacts
    : {
        ...artifacts,
        contextSelection: createContextSelectionSnapshot(
          await contextSelectionInput(root, harnixRoot, task, artifacts.context, true),
        ),
      };
}

async function loadExistingTask(harnixRoot: string, id: string): Promise<TaskRecord | undefined> {
  try {
    return await loadTask(await resolveSafeProjectPath(harnixRoot, `tasks/${id}/task.json`));
  } catch (error: unknown) {
    if (isMissing(error)) return undefined;
    throw error;
  }
}

function preserveEvidence(previous: readonly Evidence[], next: readonly Evidence[]): void {
  if (next.length < previous.length)
    throw new Error("Workflow save cannot remove, reorder, or mutate existing evidence.");
  for (const [index, evidence] of previous.entries()) {
    if (!semanticJsonEqual(next[index], evidence))
      throw new Error("Workflow save cannot remove, reorder, or mutate existing evidence.");
  }
}
