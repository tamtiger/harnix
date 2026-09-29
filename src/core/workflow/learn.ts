import { readConfig } from "src/core/config/config.js";
import { appendJournalIdempotent, type JournalEntry } from "src/core/journal/journal.js";
import { createCapturedLearningCandidate, type LearningCaptureInput } from "src/core/journal/learning.js";
import { analyzeLearningStatement, type LearningRiskKind } from "src/core/journal/learning-safety.js";
import { loadTask, resolveActiveTask, type TaskRecord } from "src/core/tasks/task.js";
import { isMissing, validateLearningEnvelope } from "src/core/tasks/workflow-helpers.js";
import { nowInstant } from "src/utils/clock.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";
import { assertTaskReadyForFinishing } from "./completion.js";
import { currentInstant, journalFilePath } from "./support.js";

export interface WorkflowLearningResult {
  entry: JournalEntry;
  eligible: true;
  created: boolean;
  findings: LearningRiskKind[];
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
  const journalPath = await journalFilePath(root, config, now);
  return recordWorkflowLearning(harnixRoot, journalRoot, journalPath, config.developer, task, input, now);
}

export async function recordWorkflowLearning(
  harnixRoot: string,
  journalRoot: string,
  journalPath: string,
  developer: string,
  task: TaskRecord,
  input: LearningCaptureInput,
  now = nowInstant(),
): Promise<WorkflowLearningResult> {
  await assertTaskReadyForFinishing(harnixRoot, task, now);
  const candidate = createCapturedLearningCandidate(input);
  const analysis = analyzeLearningStatement(candidate.statement);
  if (analysis.oversized) throw new Error("Learning statement exceeds the 64 KiB review limit.");
  if (!candidate.sourceTaskIds.includes(task.id))
    throw new Error("Workflow learning provenance must include the active task.");
  const knownEvidenceIds = new Set<string>();
  for (const sourceTaskId of candidate.sourceTaskIds) {
    const sourceTask = sourceTaskId === task.id ? task : await loadCompletedSourceTask(harnixRoot, sourceTaskId);
    const sourceEvidenceIds = new Set(sourceTask.evidence.map((evidence) => evidence.id));
    for (const evidenceId of sourceEvidenceIds) knownEvidenceIds.add(evidenceId);
    if (!candidate.evidenceIds.some((evidenceId) => sourceEvidenceIds.has(evidenceId)))
      throw new Error(`Learning source task ${sourceTaskId} has no referenced evidence.`);
  }
  if (candidate.evidenceIds.some((evidenceId) => !knownEvidenceIds.has(evidenceId)))
    throw new Error("Workflow learning provenance contains unknown evidence.");
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

async function loadCompletedSourceTask(harnixRoot: string, sourceTaskId: string): Promise<TaskRecord> {
  let sourceTask: TaskRecord;
  try {
    sourceTask = await loadTask(await resolveSafeProjectPath(harnixRoot, `tasks/${sourceTaskId}/task.json`));
  } catch (error: unknown) {
    if (isMissing(error)) throw new Error(`Learning source task ${sourceTaskId} does not exist.`);
    throw error;
  }
  if (sourceTask.status !== "completed") throw new Error(`Learning source task ${sourceTaskId} is not completed.`);
  return sourceTask;
}
