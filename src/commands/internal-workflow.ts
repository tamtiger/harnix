import { readFile, rm } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { effectiveTimezone, readConfig, readProjectTimezone } from "../core/config/config.js";
import { formatInstant, idPrefix, localDate, nowInstant } from "../utils/clock.js";
import {
  canCompleteTask,
  cancelWorkflowTask,
  finishWorkflowTask,
  recordWorkflowLearning,
  taskContextDrift,
  verificationRetryDisposition,
  type WorkflowLearningResult,
} from "../core/workflow.js";
import { validateContextManifest, type ContextDrift } from "../core/context/context.js";
import {
  loadTask,
  acceptanceCriterionKeys,
  blockerKeys,
  createTaskV3MigrationEvidence,
  evidenceV2Keys,
  TASK_V2_MIGRATION_EVIDENCE_ID,
  TASK_V3_MIGRATION_EVIDENCE_ID,
  resolveActiveTask,
  saveTask,
  saveTaskArtifacts,
  setActiveTask,
  taskRecordFieldManifest,
  validateTaskArtifacts,
  validateTask,
  validationCheckV2Keys,
  type Evidence,
  type TaskArtifacts,
  type TaskRecord,
  type TaskRecordV3,
} from "../core/tasks/task.js";
import { validateEpic, upsertEpic, loadEpicRecord, renderEpicMarkdown, type EpicRecord } from "../core/epics/epic.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "../utils/paths.js";
import {
  contextSelectionResultHash,
  createContextSelectionSnapshot,
  validateContextSelectionSnapshot,
} from "../core/context/selection-freshness.js";
import { contextSelectionInput } from "../core/workflow.js";
import { inspectRequiredChecks, type RequiredCheckState } from "../core/verification/check-report.js";
import {
  assertNewEvidenceDigests,
  computeInputDigest,
  type InputDigestSnapshot,
} from "../core/verification/input-digest.js";
import { compareCodeUnits } from "../utils/order.js";
import { atomicWriteFile } from "../utils/atomic-write.js";
import { acquireHarnixFileLock } from "../utils/file-lock.js";
import { sha256 } from "../utils/hashing.js";
import {
  assertExactFields,
  assertLegalTransition,
  isMissing,
  isRecord,
  laterTimestamp,
  planHasChecklistItem,
  sameBytes,
  semanticJsonEqual,
  semanticTaskEqual,
  validateCancellationEnvelope,
  validateLearningEnvelope,
} from "../core/tasks/workflow-helpers.js";

export type WorkflowSaveArtifacts = Omit<TaskArtifacts, "contextSelection">;
export interface WorkflowSaveEnvelope {
  task: unknown;
  artifacts?: WorkflowSaveArtifacts | undefined;
  contractRevision?: { reason: string } | undefined;
  epic?: unknown;
  epicMembers?: TaskRecord[] | undefined;
}

/** Hidden transport for agents; it preserves TaskRecord state and is deliberately JSON-only. */
export async function inspectWorkflow(
  root: string,
): Promise<{ activeTask: TaskRecord | null; contextDrift: ContextDrift }> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const activeTask = (await resolveActiveTask(harnixRoot)) ?? null;
  return {
    activeTask,
    contextDrift:
      activeTask === null
        ? { state: "not-recorded", changes: [], selectionChanges: [] }
        : await taskContextDrift(root, harnixRoot, activeTask),
  };
}

export async function saveWorkflow(root: string, input: unknown): Promise<TaskRecord> {
  const envelope = validateWorkflowSaveEnvelope(input);
  if (isRecord(envelope.task) && envelope.task.status === "cancelled")
    throw new Error("Workflow cancellation must use workflow --cancel.");
  const candidate = validateTask(envelope.task);
  const harnixRoot = await resolveSafeHarnixPath(root);
  const lock = await acquireHarnixFileLock(join(tmpdir(), "harnix-workflow-locks", `${sha256(harnixRoot)}.lock`));
  try {
    return await saveWorkflowLocked(root, harnixRoot, envelope, candidate);
  } finally {
    await lock.release();
  }
}

async function saveWorkflowLocked(
  root: string,
  harnixRoot: string,
  envelope: WorkflowSaveEnvelope,
  initialCandidate: TaskRecord,
): Promise<TaskRecord> {
  let candidate = initialCandidate;
  const active = await resolveActiveTask(harnixRoot);
  const existing = await loadExistingTask(harnixRoot, candidate.id);

  if (active && active.id !== candidate.id) throw new Error("Workflow save may update only the active task.");
  if (existing && isAppliedContractRevisionReplay(existing, candidate, envelope.contractRevision)) {
    const artifacts = await prepareWorkflowArtifacts(root, harnixRoot, candidate, envelope.artifacts);
    if (artifacts) validateTaskArtifacts(candidate, artifacts);
    await assertReplayArtifactsMatch(harnixRoot, candidate, artifacts);
    if (active === undefined) await setActiveTask(harnixRoot, candidate.id);
    return existing;
  }
  if (existing && active === undefined) {
    if (envelope.contractRevision !== undefined || !semanticTaskEqual(existing, candidate)) {
      throw new Error(
        "Workflow save with a missing active pointer requires an exact task replay; select an inactive task through harnix resume.",
      );
    }
    const artifacts = await prepareWorkflowArtifacts(root, harnixRoot, candidate, envelope.artifacts);
    if (artifacts) validateTaskArtifacts(candidate, artifacts);
    await assertReplayArtifactsMatch(harnixRoot, candidate, artifacts);
    await setActiveTask(harnixRoot, candidate.id);
    return existing;
  }
  if (existing) {
    assertSchemaEvolution(existing, candidate);
    if (existing.mode === "full" && candidate.mode !== "full")
      throw new Error("Workflow save cannot downgrade a Full task to Lite mode.");
    preserveEvidence(existing.evidence, candidate.evidence);
    candidate = preserveObligations(existing, candidate, envelope.contractRevision);
    assertLegalTransition(existing, candidate);
  } else {
    if (candidate.schemaVersion !== 3)
      throw new Error("Workflow save requires TaskRecord schema v3 for every new task.");
    if (active || candidate.status !== "planning")
      throw new Error("Workflow save may create only a planning task when no task is active.");
    if (candidate.mode === "full" && !envelope.artifacts) throw new Error("Full tasks require prd.md and plan.md.");
  }

  if (candidate.status === "completed") throw new Error("Workflow completion must use workflow --finish.");
  if (candidate.status === "ready") await assertReadyRequirements(harnixRoot, candidate, envelope.artifacts);

  let validatedEpic: EpicRecord | undefined;
  if (envelope.epic !== undefined) {
    validatedEpic = validateEpic(envelope.epic);
  }

  const artifacts = await prepareWorkflowArtifacts(root, harnixRoot, candidate, envelope.artifacts);
  if (artifacts) validateTaskArtifacts(candidate, artifacts);
  const rollbackSnapshot = await captureWorkflowSaveFiles(harnixRoot, candidate, artifacts);
  await assertWorkflowSaveFilesUnchanged(rollbackSnapshot);
  let taskCommitted = false;
  try {
    if (candidate.schemaVersion === 3) await assertNewEvidenceDigests(root, existing?.evidence ?? [], candidate);
    if (artifacts) await saveTaskArtifacts(harnixRoot, candidate, artifacts);
    await saveTask(harnixRoot, candidate);
    taskCommitted = true;

    // Save any planned epic member tasks
    if (envelope.epicMembers && envelope.epicMembers.length > 0) {
      const targetEpicId = validatedEpic
        ? validatedEpic.id
        : candidate.schemaVersion !== 1
          ? candidate.epicId
          : undefined;
      for (const member of envelope.epicMembers) {
        if (member.schemaVersion !== 3 || member.status !== "planning") {
          throw new Error(`Epic member task ${member.id} must be schemaVersion 3 and in planning status.`);
        }
        if (targetEpicId && member.epicId !== targetEpicId) {
          throw new Error(`Epic member task ${member.id} epicId must match ${targetEpicId}.`);
        }
        await saveTask(harnixRoot, member);
      }
    }

    // Handle epic upsert and markdown regeneration
    if (validatedEpic) {
      await upsertEpic(root, validatedEpic);
    }
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
  if (active === undefined) await setActiveTask(harnixRoot, candidate.id);
  return candidate;
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

/**
 * Bounded partial transport. It never accepts a task body: the persisted
 * active record is the only source, so a stage owner cannot drop evidence or
 * silently rewrite an obligation while changing state. Every guard, lock and
 * immutability rule of the full save path still applies.
 */
/** Current time in the project's configured zone unless the caller injects one. */
async function currentInstant(root: string, now: string | undefined): Promise<string> {
  return now ?? nowInstant(await readProjectTimezone(await resolveSafeHarnixPath(root)));
}

export async function transitionWorkflow(
  root: string,
  status: string,
  checkpoint: string,
  injectedNow?: string,
): Promise<TaskRecord> {
  const now = await currentInstant(root, injectedNow);
  if (status === "cancelled") throw new Error("Workflow cancellation must use workflow --cancel.");
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow transition requires an active task.");
  return saveWorkflow(root, { task: { ...task, status, checkpoint, updatedAt: laterTimestamp(task.updatedAt, now) } });
}

/**
 * Appends exactly one evidence item to the active task. Existing evidence is
 * never sent by the caller, so a malformed round-trip cannot erase history.
 */
export async function appendEvidenceWorkflow(
  root: string,
  envelope: unknown,
  injectedNow?: string,
): Promise<TaskRecord> {
  const now = await currentInstant(root, injectedNow);
  const evidence = validateEvidenceEnvelope(envelope);
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow evidence capture requires an active task.");
  return saveWorkflow(root, {
    task: { ...task, evidence: [...task.evidence, evidence], updatedAt: laterTimestamp(task.updatedAt, now) },
  });
}

export interface WorkflowEnvelopeSchemaV1 {
  generator: "harnix";
  schemaVersion: 1;
  envelope: Record<string, string>;
  taskRecord: { required: string[]; optional: string[] };
  nested: { acceptanceCriteria: string[]; validationPlan: string[]; evidence: string[]; blocker: string[] };
  transports: Record<string, string>;
}

/** Read-only self-description so an agent can build a valid envelope before its first save fails. */
export function workflowEnvelopeSchema(): WorkflowEnvelopeSchemaV1 {
  return {
    generator: "harnix",
    schemaVersion: 1,
    envelope: {
      artifacts: "optional { prd?, plan?, design?, research?: { <safe>.md: text }, context? }",
      contractRevision:
        "optional { reason: 10-1000 characters }, accepted in the save that sets checkpoint replan on an unfinished task and revises unproven obligations",
      epic: "optional EpicRecord schema v1; when present, upserts .harnix/epics/<epic-id>.json and regenerates markdown",
      epicMembers:
        "optional TaskRecord[] schema v3 in planning state; saved as non-active member tasks with matching epicId",
      task: "TaskRecord, required",
    },
    taskRecord: taskRecordFieldManifest(3),
    nested: {
      acceptanceCriteria: [...acceptanceCriterionKeys].sort(),
      validationPlan: [...validationCheckV2Keys].sort(),
      evidence: [...evidenceV2Keys].sort(),
      blocker: [...blockerKeys].sort(),
    },
    transports: {
      "--save": "Full record plus artifacts. Required for obligations, artifacts and contract revisions.",
      "--transition": "Status and checkpoint only, read from the persisted record.",
      "--evidence": "Append exactly one evidence item.",
      "--finish": "Terminal completion; accepts no body.",
      "--cancel": "Terminal cancellation; the only cancellation transport.",
    },
  };
}

function validateEvidenceEnvelope(value: unknown): Evidence {
  if (!isRecord(value) || Object.keys(value).sort().join(",") !== "evidence") {
    throw new Error('Workflow evidence requires a bounded JSON envelope shaped { "evidence": <Evidence> }.');
  }
  const evidence = value.evidence;
  if (!isRecord(evidence)) throw new Error("Workflow evidence item must be an object.");
  return evidence as unknown as Evidence;
}

/**
 * `finishWorkflowTask`/`cancelWorkflowTask` persist the terminal record via
 * the low-level `saveTask`, not `saveWorkflowLocked`, so they never go
 * through the epic-refresh step that a normal `--save` triggers. Without
 * this, a task's epic entry would freeze at its last pre-terminal status.
 */
async function refreshLinkedEpicMarkdown(root: string, task: TaskRecord): Promise<void> {
  if (task.schemaVersion === 1 || task.epicId === undefined) return;
  const epic = await loadEpicRecord(root, task.epicId);
  await renderEpicMarkdown(root, task.epicId, epic);
}

export async function finishWorkflow(root: string, injectedNow?: string): Promise<TaskRecord> {
  const now = await currentInstant(root, injectedNow);
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow finish requires an active task.");
  const config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const journalDate = task.status === "completed" ? task.completedAt! : now;
  const journalPath = await resolveSafeHarnixPath(
    root,
    `workspace/${config.developer}/journal/${localDate(journalDate, effectiveTimezone(config))}.jsonl`,
  );
  const finished = await finishWorkflowTask(harnixRoot, journalPath, config.developer, task, now);
  await refreshLinkedEpicMarkdown(root, finished);
  return finished;
}

export async function cancelWorkflow(root: string, envelope: unknown, injectedNow?: string): Promise<TaskRecord> {
  const now = await currentInstant(root, injectedNow);
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow cancellation requires an active task.");
  const recovering = task.status === "cancelled" && task.checkpoint === "cancelling";
  const cancellation = recovering ? undefined : validateCancellationEnvelope(envelope);
  const config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const journalDate = recovering ? task.cancelledAt! : now;
  const journalPath = await resolveSafeHarnixPath(
    root,
    `workspace/${config.developer}/journal/${localDate(journalDate, effectiveTimezone(config))}.jsonl`,
  );
  const cancelled = await cancelWorkflowTask(harnixRoot, journalPath, config.developer, task, cancellation, now);
  await refreshLinkedEpicMarkdown(root, cancelled);
  return cancelled;
}

export async function recordLearningWorkflow(
  root: string,
  envelope: unknown,
  injectedNow?: string,
): Promise<WorkflowLearningResult> {
  const now = await currentInstant(root, injectedNow);
  const input = validateLearningEnvelope(envelope);
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow learning capture requires an active task.");
  const config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const journalRoot = await resolveSafeHarnixPath(root, `workspace/${config.developer}/journal`);
  const journalPath = await resolveSafeHarnixPath(
    root,
    `workspace/${config.developer}/journal/${localDate(now, effectiveTimezone(config))}.jsonl`,
  );
  return recordWorkflowLearning(harnixRoot, journalRoot, journalPath, config.developer, task, input, now);
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

interface WorkflowFileSnapshot {
  relativePath: string;
  path: string;
  original: Uint8Array | undefined;
  forward: Uint8Array | undefined;
}

async function captureWorkflowSaveFiles(
  harnixRoot: string,
  task: TaskRecord,
  artifacts: TaskArtifacts | undefined,
): Promise<WorkflowFileSnapshot[]> {
  const taskDirectory = `tasks/${task.id}`;
  const relativePaths = new Set<string>([`${taskDirectory}/task.json`]);
  const forwardContent = new Map<string, Uint8Array>([
    [`${taskDirectory}/task.json`, Buffer.from(`${JSON.stringify(task, null, 2)}\n`)],
  ]);
  if (artifacts !== undefined) {
    if (task.mode === "full") {
      relativePaths.add(`${taskDirectory}/prd.md`);
      relativePaths.add(`${taskDirectory}/plan.md`);
      forwardContent.set(`${taskDirectory}/prd.md`, Buffer.from(artifacts.prd ?? ""));
      forwardContent.set(`${taskDirectory}/plan.md`, Buffer.from(artifacts.plan ?? ""));
    }
    if (artifacts.design?.trim()) {
      relativePaths.add(`${taskDirectory}/design.md`);
      forwardContent.set(`${taskDirectory}/design.md`, Buffer.from(artifacts.design));
    }
    if (artifacts.research) {
      for (const [name, content] of Object.entries(artifacts.research)) {
        if (!/^[a-z0-9][a-z0-9._-]*\.md$/u.test(name) || !content.trim())
          throw new Error("Research artifact name or content is invalid.");
        const relativePath = `${taskDirectory}/research/${name}`;
        relativePaths.add(relativePath);
        forwardContent.set(relativePath, Buffer.from(content));
      }
    }
    if (artifacts.context !== undefined) {
      const relativePath = `${taskDirectory}/context.json`;
      relativePaths.add(relativePath);
      forwardContent.set(relativePath, Buffer.from(`${JSON.stringify(artifacts.context, null, 2)}\n`));
    }
    if (artifacts.contextSelection !== undefined) {
      const relativePath = `${taskDirectory}/context-selection.json`;
      relativePaths.add(relativePath);
      forwardContent.set(relativePath, Buffer.from(`${JSON.stringify(artifacts.contextSelection, null, 2)}\n`));
    }
  }
  const snapshots: WorkflowFileSnapshot[] = [];
  for (const relativePath of [...relativePaths].sort(compareCodeUnits)) {
    const path = await resolveSafeProjectPath(harnixRoot, relativePath);
    try {
      snapshots.push({ relativePath, path, original: await readFile(path), forward: forwardContent.get(relativePath) });
    } catch (error: unknown) {
      if (isMissing(error))
        snapshots.push({ relativePath, path, original: undefined, forward: forwardContent.get(relativePath) });
      else throw error;
    }
  }
  return snapshots;
}

async function restoreWorkflowSaveFiles(snapshots: readonly WorkflowFileSnapshot[]): Promise<void> {
  const conflicts: string[] = [];
  for (const snapshot of [...snapshots].reverse()) {
    let current: Uint8Array | undefined;
    try {
      current = await readFile(snapshot.path);
    } catch (error: unknown) {
      if (!isMissing(error)) throw error;
    }
    if (sameBytes(current, snapshot.original)) continue;
    if (snapshot.forward === undefined || !sameBytes(current, snapshot.forward)) {
      conflicts.push(snapshot.relativePath);
      continue;
    }
    if (snapshot.original === undefined) await rm(snapshot.path, { force: true });
    else await atomicWriteFile(snapshot.path, snapshot.original);
  }
  if (conflicts.length > 0)
    throw new Error(`Concurrent changes were preserved at: ${conflicts.sort(compareCodeUnits).join(", ")}.`);
}

async function assertWorkflowSaveFilesUnchanged(snapshots: readonly WorkflowFileSnapshot[]): Promise<void> {
  const conflicts: string[] = [];
  for (const snapshot of snapshots) {
    let current: Uint8Array | undefined;
    try {
      current = await readFile(snapshot.path);
    } catch (error: unknown) {
      if (!isMissing(error)) throw error;
    }
    if (!sameBytes(current, snapshot.original)) conflicts.push(snapshot.relativePath);
  }
  if (conflicts.length > 0) {
    throw new Error(
      `Workflow save stopped because task files changed concurrently: ${conflicts.sort(compareCodeUnits).join(", ")}.`,
    );
  }
}

function preserveObligations(
  previous: TaskRecord,
  next: TaskRecord,
  revision: WorkflowSaveEnvelope["contractRevision"],
): TaskRecord {
  if (!obligationsChanged(previous, next) || previous.schemaVersion !== next.schemaVersion) {
    if (revision !== undefined)
      throw new Error("Workflow contractRevision is allowed only when obligations change at persisted replan.");
    return next;
  }
  if (isEditablePlanningDraft(previous)) {
    if (previous.evidence.some((evidence) => evidence.checkId !== undefined))
      throw new Error("Workflow planning obligations with check evidence are already frozen.");
    if (revision !== undefined)
      throw new Error("Workflow planning obligations do not require contractRevision before first ready.");
    return next;
  }
  if (
    previous.schemaVersion === 3 &&
    next.schemaVersion === 3 &&
    next.checkpoint === "replan" &&
    previous.status === next.status
  ) {
    const reason = validateContractRevision(revision);
    preserveProvenObligations(previous, next);
    return appendContractRevisionEvidence(next, reason);
  }
  if (revision !== undefined)
    throw new Error("Workflow must persist replan before contractRevision can supersede an obligation.");

  const freezePoint = previous.schemaVersion === 1 ? "first persistence" : "first ready";
  const nextCriteria = new Map(next.acceptanceCriteria.map((criterion) => [criterion.id, criterion]));
  for (const criterion of previous.acceptanceCriteria) {
    const candidate = nextCriteria.get(criterion.id);
    if (!candidate)
      throw new Error(
        `Workflow obligations freeze at ${freezePoint}; cannot remove or rename acceptance criterion ${criterion.id}.`,
      );
    if (candidate.text !== criterion.text)
      throw new Error(
        `Workflow obligations freeze at ${freezePoint}; cannot mutate acceptance criterion text ${criterion.id}; use persisted replan with contractRevision for v2.`,
      );
  }

  const nextChecks = new Map(next.validationPlan.map((check) => [check.id, check]));
  for (const check of previous.validationPlan.filter((candidate) => candidate.required)) {
    const candidate = nextChecks.get(check.id);
    if (candidate?.required !== true)
      throw new Error(
        `Workflow obligations freeze at ${freezePoint}; cannot remove, rename, or demote required validation check ${check.id}.`,
      );
    if (
      candidate.description !== check.description ||
      candidate.command !== check.command ||
      candidate.scope !== check.scope
    ) {
      throw new Error(
        `Workflow obligations freeze at ${freezePoint}; cannot mutate required validation check ${check.id}; use persisted replan with contractRevision for v2.`,
      );
    }
    if (
      previous.schemaVersion !== 1 &&
      next.schemaVersion !== 1 &&
      (!semanticJsonEqual(candidate.criterionIds, check.criterionIds) ||
        !semanticJsonEqual(candidate.inputs, check.inputs))
    ) {
      throw new Error(
        `Workflow obligations freeze at ${freezePoint}; cannot mutate required validation check ${check.id}; use persisted replan with contractRevision for v2.`,
      );
    }
  }
  if (previous.schemaVersion === 1 && next.schemaVersion === 1) return next;
  throw new Error(
    "Workflow obligations freeze at first ready; persist replan and provide contractRevision to supersede an unproven obligation.",
  );
}

export interface WorkflowPreflightResultV1 {
  generator: "harnix";
  schemaVersion: 1;
  activeTask: Pick<TaskRecord, "id" | "mode" | "status" | "checkpoint"> | null;
  contextDrift: ContextDrift["state"];
  requiredChecks: Record<RequiredCheckState, string[]>;
  retryLimitReached: string[];
  nextStage: "await" | "brainstorm" | "check" | "continue" | "debug" | "finish" | "implement" | "stop";
  /** Authoritative time source for agents: current instant and ID prefix in the configured zone. */
  clock: { timezone: string; now: string; idPrefix: string };
}

export async function preflightWorkflow(root: string, now = Date.now()): Promise<WorkflowPreflightResultV1> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  const timezone = await readProjectTimezone(harnixRoot);
  const base = {
    clock: { timezone, now: formatInstant(now, timezone), idPrefix: idPrefix(now, timezone) },
    generator: "harnix" as const,
    schemaVersion: 1 as const,
    contextDrift: "not-recorded" as const,
    requiredChecks: { passed: [] as string[], failed: [] as string[], stale: [] as string[], pending: [] as string[] },
    retryLimitReached: [] as string[],
  };
  if (task === undefined) return { ...base, activeTask: null, nextStage: "brainstorm" };
  const activeTask = { id: task.id, mode: task.mode, status: task.status, checkpoint: task.checkpoint };
  if (task.status === "completed" || task.status === "cancelled") {
    return { ...base, activeTask, nextStage: "continue" };
  }
  if (task.status === "blocked") return { ...base, activeTask, nextStage: "continue" };
  const contextDrift = (await taskContextDrift(root, harnixRoot, task)).state;
  const retryLimitReached = task.validationPlan
    .filter((check) => check.required && verificationRetryDisposition(task, check.id, now) === "stop")
    .map((check) => check.id)
    .sort(compareCodeUnits);
  if (contextDrift === "stale" || retryLimitReached.length > 0) {
    return {
      ...base,
      activeTask,
      contextDrift,
      requiredChecks: requiredChecksFromEvidence(task, now),
      retryLimitReached,
      nextStage: contextDrift === "stale" ? "continue" : "stop",
    };
  }
  const inspections =
    task.status === "verifying"
      ? await inspectRequiredChecks(root, harnixRoot, task, now)
      : task.validationPlan
          .filter((check) => check.required)
          .map((check) => ({ id: check.id, state: "pending" as const }));
  const requiredChecks = {
    passed: [] as string[],
    failed: [] as string[],
    stale: [] as string[],
    pending: [] as string[],
  };
  for (const inspection of inspections) requiredChecks[inspection.state].push(inspection.id);
  for (const values of Object.values(requiredChecks)) values.sort(compareCodeUnits);
  return {
    ...base,
    activeTask,
    contextDrift,
    requiredChecks,
    retryLimitReached,
    nextStage: preflightStage(task, contextDrift, requiredChecks, retryLimitReached, now),
  };
}

function obligationsChanged(previous: TaskRecord, next: TaskRecord): boolean {
  const criteria = (task: TaskRecord) =>
    task.acceptanceCriteria
      .map(({ id, text }) => ({ id, text }))
      .sort((left, right) => compareCodeUnits(left.id, right.id));
  const checks = (task: TaskRecord) =>
    [...task.validationPlan].sort((left, right) => compareCodeUnits(left.id, right.id));
  return !semanticJsonEqual(criteria(previous), criteria(next)) || !semanticJsonEqual(checks(previous), checks(next));
}

function requiredChecksFromEvidence(task: TaskRecord, now: number): WorkflowPreflightResultV1["requiredChecks"] {
  const requiredChecks = {
    passed: [] as string[],
    failed: [] as string[],
    stale: [] as string[],
    pending: [] as string[],
  };
  for (const check of task.validationPlan.filter((candidate) => candidate.required)) {
    let latest: Evidence | undefined;
    for (const evidence of task.evidence) {
      if (evidence.checkId !== check.id) continue;
      if (latest === undefined || Date.parse(evidence.recordedAt) >= Date.parse(latest.recordedAt)) latest = evidence;
    }
    if (latest === undefined || latest.result === "skipped") requiredChecks.pending.push(check.id);
    else if (latest.result === "fail") requiredChecks.failed.push(check.id);
    else {
      const timestamp = Date.parse(latest.recordedAt);
      if (
        !Number.isFinite(timestamp) ||
        timestamp > now ||
        (task.schemaVersion === 1 && now - timestamp > 60 * 60 * 1_000)
      ) {
        requiredChecks.stale.push(check.id);
      } else {
        // A pass cannot be called current without reading its snapshot inputs.
        requiredChecks.pending.push(check.id);
      }
    }
  }
  for (const values of Object.values(requiredChecks)) values.sort(compareCodeUnits);
  return requiredChecks;
}

function isEditablePlanningDraft(task: TaskRecord): boolean {
  return (
    task.schemaVersion !== 1 &&
    !task.evidence.some(
      (evidence) => evidence.id === TASK_V2_MIGRATION_EVIDENCE_ID || evidence.id === TASK_V3_MIGRATION_EVIDENCE_ID,
    ) &&
    (task.status === "planning" || (task.status === "blocked" && task.blocker?.resumeStatus === "planning"))
  );
}

function preserveProvenObligations(previous: TaskRecordV3, next: TaskRecordV3): void {
  const evidencedCheckIds = new Set(
    previous.evidence.filter((evidence) => evidence.checkId !== undefined).map((evidence) => evidence.checkId!),
  );
  const criteriaMappedByEvidencedChecks = new Set(
    previous.validationPlan.filter((check) => evidencedCheckIds.has(check.id)).flatMap((check) => check.criterionIds),
  );
  const nextCriteria = new Map(next.acceptanceCriteria.map((criterion) => [criterion.id, criterion]));
  for (const criterion of previous.acceptanceCriteria) {
    if (
      criterion.status === "pending" &&
      criterion.evidenceIds.length === 0 &&
      !criteriaMappedByEvidencedChecks.has(criterion.id)
    )
      continue;
    const candidate = nextCriteria.get(criterion.id);
    if (candidate === undefined || candidate.text !== criterion.text)
      throw new Error(`Workflow contractRevision cannot mutate proven acceptance criterion ${criterion.id}.`);
  }
  const nextChecks = new Map(next.validationPlan.map((check) => [check.id, check]));
  const priorCheckIds = new Set(previous.validationPlan.map((check) => check.id));
  const evidenceByCheck = new Map<string, Evidence[]>();
  for (const evidence of previous.evidence) {
    if (evidence.checkId === undefined) continue;
    const entries = evidenceByCheck.get(evidence.checkId) ?? [];
    entries.push(evidence);
    evidenceByCheck.set(evidence.checkId, entries);
  }
  for (const check of previous.validationPlan) {
    const checkEvidence = evidenceByCheck.get(check.id);
    if (checkEvidence === undefined) continue;
    const candidate = nextChecks.get(check.id);
    if (candidate !== undefined && semanticJsonEqual(candidate, check)) continue;
    if (checkEvidence.some((evidence) => evidence.result === "pass")) {
      throw new Error(`Workflow contractRevision cannot mutate check ${check.id} after passing evidence.`);
    }
    const retiredWithoutDefinitionChange =
      check.required &&
      candidate !== undefined &&
      candidate.required === false &&
      semanticJsonEqual({ ...candidate, required: true }, check);
    const hasReplacement = next.validationPlan.some(
      (replacement) =>
        !priorCheckIds.has(replacement.id) &&
        replacement.required &&
        check.criterionIds.every((criterionId) => replacement.criterionIds.includes(criterionId)),
    );
    if (!retiredWithoutDefinitionChange || !hasReplacement) {
      throw new Error(
        `Workflow contractRevision must retain failed check ${check.id} unchanged or retire it unchanged with a new required replacement ID.`,
      );
    }
  }
}

function validateContractRevision(revision: WorkflowSaveEnvelope["contractRevision"]): string {
  const reason = revision?.reason?.trim();
  if (reason === undefined || reason.length < 10 || reason.length > 1_000)
    throw new Error(
      "Workflow obligation supersede requires contractRevision.reason between 10 and 1000 characters at persisted replan.",
    );
  return reason;
}

function isAppliedContractRevisionReplay(
  previous: TaskRecord,
  candidate: TaskRecord,
  revision: WorkflowSaveEnvelope["contractRevision"],
): previous is TaskRecordV3 {
  if (previous.schemaVersion !== 3 || candidate.schemaVersion !== 3 || revision === undefined) return false;
  const reason = validateContractRevision(revision);
  if (previous.evidence.length !== candidate.evidence.length + 1) return false;
  if (!semanticJsonEqual(previous.evidence.slice(0, -1), candidate.evidence)) return false;
  const audit = previous.evidence.at(-1)!;
  if (
    !/^task-contract-revision-\d{2,}$/u.test(audit.id) ||
    audit.checkId !== undefined ||
    audit.recordedAt !== candidate.updatedAt ||
    audit.result !== "skipped" ||
    audit.summary !== `Task contract revised at persisted replan: ${reason}` ||
    !semanticJsonEqual(audit.artifactPaths, [`.harnix/tasks/${candidate.id}/task.json`])
  )
    return false;
  return semanticTaskEqual({ ...previous, evidence: candidate.evidence }, candidate);
}

async function assertReplayArtifactsMatch(
  harnixRoot: string,
  task: TaskRecord,
  artifacts: TaskArtifacts | undefined,
): Promise<void> {
  const directory = await resolveSafeProjectPath(harnixRoot, `tasks/${task.id}`);
  const expected = new Map<string, string>();
  if (artifacts?.prd !== undefined) expected.set("prd.md", artifacts.prd);
  if (artifacts?.plan !== undefined) expected.set("plan.md", artifacts.plan);
  if (artifacts?.design?.trim()) expected.set("design.md", artifacts.design);
  if (artifacts?.research) {
    for (const [name, content] of Object.entries(artifacts.research)) {
      if (!/^[a-z0-9][a-z0-9._-]*\.md$/u.test(name) || !content.trim())
        throw new Error("Research artifact name or content is invalid.");
      expected.set(`research/${name}`, content);
    }
  }
  if (artifacts?.context !== undefined) expected.set("context.json", `${JSON.stringify(artifacts.context, null, 2)}\n`);
  if (artifacts?.contextSelection !== undefined)
    expected.set("context-selection.json", `${JSON.stringify(artifacts.contextSelection, null, 2)}\n`);
  for (const [path, content] of expected) {
    let persisted: string;
    try {
      persisted = await readFile(await resolveSafeProjectPath(directory, path), "utf8");
    } catch {
      throw new Error(`Workflow contractRevision replay artifact is missing or unreadable: ${path}`);
    }
    if (persisted !== content)
      throw new Error(`Workflow contractRevision replay cannot replace already committed artifact ${path}.`);
  }
  await assertPersistedContextPair(directory, task);
}

async function assertPersistedContextPair(directory: string, task: TaskRecord): Promise<void> {
  const contextPath = await resolveSafeProjectPath(directory, "context.json");
  const selectionPath = await resolveSafeProjectPath(directory, "context-selection.json");
  const [contextText, selectionText] = await Promise.all([
    readOptionalText(contextPath),
    readOptionalText(selectionPath),
  ]);
  if (contextText === undefined && selectionText === undefined) return;
  if (contextText === undefined || selectionText === undefined) {
    throw new Error("Workflow replay requires a complete context.json and context-selection.json pair.");
  }
  try {
    const context = validateContextManifest(JSON.parse(contextText) as unknown);
    const selection = validateContextSelectionSnapshot(JSON.parse(selectionText) as unknown);
    if (
      context.taskId !== task.id ||
      selection.taskId !== task.id ||
      selection.selectionResultHash !== contextSelectionResultHash(context)
    ) {
      throw new Error("binding mismatch");
    }
  } catch {
    throw new Error("Workflow replay context selection pair is unreadable, invalid, or unbound.");
  }
}

async function readOptionalText(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error: unknown) {
    if (isMissing(error)) return undefined;
    throw error;
  }
}

function appendContractRevisionEvidence(task: TaskRecordV3, reason: string): TaskRecordV3 {
  let sequence = 1;
  const ids = new Set(task.evidence.map((evidence) => evidence.id));
  while (ids.has(`task-contract-revision-${String(sequence).padStart(2, "0")}`)) sequence += 1;
  return validateTask({
    ...task,
    evidence: [
      ...task.evidence,
      {
        id: `task-contract-revision-${String(sequence).padStart(2, "0")}`,
        recordedAt: task.updatedAt,
        result: "skipped",
        summary: `Task contract revised at persisted replan: ${reason}`,
        artifactPaths: [`.harnix/tasks/${task.id}/task.json`],
      },
    ],
  }) as TaskRecordV3;
}

export async function snapshotWorkflow(root: string, checkId: string): Promise<InputDigestSnapshot> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (task === undefined) throw new Error("Workflow verification snapshot requires an active task.");
  if (task.schemaVersion !== 3)
    throw new Error("Workflow verification snapshot requires TaskRecord schema v3; migrate the task first.");
  return computeInputDigest(root, task, checkId);
}

const MIGRATE_HINT =
  "Save it once as TaskRecord schema v3 (workflow --save) preserving its criteria, required checks and evidence, then continue.";

/** Legacy v1/v2 records are read-only except for the one-save migration to v3; finished tasks are never rewritten. */
function assertSchemaEvolution(previous: TaskRecord, next: TaskRecord): void {
  if (previous.schemaVersion === next.schemaVersion) {
    if (previous.schemaVersion !== 3 && previous.status !== "completed" && previous.status !== "cancelled") {
      throw new Error(
        `Unfinished TaskRecord v${previous.schemaVersion} tasks must migrate before any other change. ${MIGRATE_HINT}`,
      );
    }
    return;
  }
  if (next.schemaVersion !== 3 || previous.schemaVersion === 3)
    throw new Error("Workflow save cannot downgrade TaskRecord schema.");
  if (
    previous.status === "completed" ||
    previous.status === "cancelled" ||
    previous.status === "blocked" ||
    previous.status !== next.status ||
    previous.checkpoint !== next.checkpoint
  ) {
    throw new Error(
      "TaskRecord migration to v3 is allowed only for an unfinished, unblocked task and keeps its status and checkpoint.",
    );
  }
  if (
    !semanticJsonEqual(
      [...previous.acceptanceCriteria].sort((left, right) => compareCodeUnits(left.id, right.id)),
      [...next.acceptanceCriteria].sort((left, right) => compareCodeUnits(left.id, right.id)),
    )
  ) {
    throw new Error("TaskRecord migration to v3 must preserve acceptance criteria exactly.");
  }
  const nextChecks = new Map(next.validationPlan.map((check) => [check.id, check]));
  for (const check of previous.validationPlan.filter((candidate) => candidate.required)) {
    const candidate = nextChecks.get(check.id);
    const sameCoverage =
      previous.schemaVersion === 1 ||
      semanticJsonEqual(candidate?.criterionIds, (check as { criterionIds?: string[] }).criterionIds);
    if (
      candidate === undefined ||
      candidate.description !== check.description ||
      candidate.command !== check.command ||
      candidate.scope !== check.scope ||
      candidate.required !== check.required ||
      !sameCoverage
    ) {
      throw new Error(`TaskRecord migration to v3 must preserve required validation check ${check.id} exactly.`);
    }
  }
  const expected = createTaskV3MigrationEvidence(previous.id, next.updatedAt);
  if (
    next.evidence.length !== previous.evidence.length + 1 ||
    !semanticJsonEqual(next.evidence.slice(0, previous.evidence.length), previous.evidence) ||
    !semanticJsonEqual(next.evidence.at(-1), expected)
  ) {
    throw new Error("TaskRecord migration to v3 requires exact appended migration evidence.");
  }
}

/** Ready needs obligations and, for Full, free-form non-empty prd/plan with a checklist; there is no trace grammar. */
async function assertReadyRequirements(harnixRoot: string, task: TaskRecord, artifacts?: TaskArtifacts): Promise<void> {
  if (task.acceptanceCriteria.length === 0)
    throw new Error("Workflow ready requires at least one acceptance criterion.");
  if (!task.validationPlan.some((check) => check.required))
    throw new Error("Workflow ready requires at least one required validation check.");
  if (task.mode !== "full") return;

  try {
    const taskDirectory = await resolveSafeProjectPath(harnixRoot, `tasks/${task.id}`);
    const prdPath = await resolveSafeProjectPath(taskDirectory, "prd.md");
    const planPath = await resolveSafeProjectPath(taskDirectory, "plan.md");
    const [prd, plan] = await Promise.all([
      artifacts?.prd ?? readFile(prdPath, "utf8"),
      artifacts?.plan ?? readFile(planPath, "utf8"),
    ]);
    if (!prd.trim() || !plan.trim()) throw new Error("Full tasks require non-empty prd.md and plan.md at ready.");
    if (!planHasChecklistItem(plan))
      throw new Error("Full task plan.md needs at least one checklist item ('- [ ] ...') at ready.");
  } catch (error: unknown) {
    if (isMissing(error)) throw new Error("Full tasks require non-empty prd.md and plan.md at ready.");
    throw error;
  }
}

function preflightStage(
  task: TaskRecord,
  contextDrift: ContextDrift["state"],
  checks: WorkflowPreflightResultV1["requiredChecks"],
  retryLimitReached: readonly string[],
  now: number,
): WorkflowPreflightResultV1["nextStage"] {
  if (task.status === "blocked" || task.status === "completed" || task.status === "cancelled") return "continue";
  if (contextDrift === "stale") return "continue";
  if (retryLimitReached.length > 0) return "stop";
  if (task.status === "planning" || task.checkpoint === "replan") return "brainstorm";
  if (task.status === "ready") return "await";
  if (task.status === "in_progress") return task.checkpoint === "debugging" ? "debug" : "implement";
  if (task.checkpoint === "debugging") return "debug";
  if (
    task.checkpoint === "finishing" &&
    checks.failed.length + checks.stale.length + checks.pending.length === 0 &&
    canCompleteTask(task, now)
  )
    return "finish";
  return "check";
}

function validateWorkflowSaveEnvelope(value: unknown): WorkflowSaveEnvelope {
  if (!isRecord(value)) throw new Error("Workflow save envelope is invalid.");
  assertExactFields(
    value,
    new Set(["task", "artifacts", "contractRevision", "epic", "epicMembers"]),
    "Workflow save envelope",
  );
  if (!("task" in value)) throw new Error("Workflow save envelope requires task.");
  const envelope: WorkflowSaveEnvelope = { task: value.task };
  if (value.artifacts !== undefined) envelope.artifacts = validateWorkflowSaveArtifacts(value.artifacts);
  if (value.contractRevision !== undefined) {
    if (!isRecord(value.contractRevision)) throw new Error("Workflow contractRevision is invalid.");
    assertExactFields(value.contractRevision, new Set(["reason"]), "Workflow contractRevision");
    if (typeof value.contractRevision.reason !== "string")
      throw new Error("Workflow contractRevision.reason must be a string.");
    envelope.contractRevision = { reason: value.contractRevision.reason };
  }
  if (value.epic !== undefined) {
    envelope.epic = value.epic;
  }
  if (value.epicMembers !== undefined) {
    if (!Array.isArray(value.epicMembers)) throw new Error("Workflow save envelope epicMembers must be an array.");
    envelope.epicMembers = value.epicMembers.map((m) => validateTask(m));
  }
  return envelope;
}

function validateWorkflowSaveArtifacts(value: unknown): WorkflowSaveArtifacts {
  if (!isRecord(value)) throw new Error("Workflow save artifacts are invalid.");
  assertExactFields(value, new Set(["prd", "plan", "design", "research", "context"]), "Workflow save artifacts");
  const artifacts: WorkflowSaveArtifacts = {};
  for (const key of ["prd", "plan", "design"] as const) {
    if (value[key] === undefined) continue;
    if (typeof value[key] !== "string") throw new Error(`Workflow save artifact ${key} must be a string.`);
    artifacts[key] = value[key];
  }
  if (value.research !== undefined) {
    if (!isRecord(value.research) || Object.values(value.research).some((content) => typeof content !== "string")) {
      throw new Error("Workflow save artifact research must be a string map.");
    }
    artifacts.research = value.research as Record<string, string>;
  }
  if (value.context !== undefined) {
    if (!isRecord(value.context)) throw new Error("Workflow save artifact context must be an object.");
    artifacts.context = validateContextManifest(value.context);
  }
  return artifacts;
}
