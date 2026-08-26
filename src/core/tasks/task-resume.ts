import { Buffer } from "node:buffer";
import { readFile, stat } from "node:fs/promises";

import { resolveSafeProjectPath } from "../../utils/paths.js";
import { setActiveTask, validateTask, type TaskRecord } from "./task.js";

const MAX_TASK_RECORD_BYTES = 1_048_576;
const MAX_ACTIVE_POINTER_BYTES = 1_024;
const taskIdPattern = /^\d{8}-\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const terminalStatuses = new Set<TaskRecord["status"]>(["completed", "cancelled"]);

export type TaskResumeOutcome = "would-resume" | "resumed" | "already-active";

export interface TaskResumeResultV1 {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly scope: "project";
  readonly dryRun: boolean;
  readonly outcome: TaskResumeOutcome;
  readonly task: Pick<TaskRecord, "id" | "mode" | "status" | "checkpoint">;
  readonly nextAction: {
    readonly code: "inspect-active-task";
    readonly message: "Run harnix status to inspect the selected task.";
  };
}

export interface TaskResumeDependencies {
  loadCandidate(harnixRoot: string, taskId: string): Promise<TaskRecord>;
  loadActive(harnixRoot: string): Promise<TaskRecord | null>;
  activate(harnixRoot: string, taskId: string): Promise<void>;
}

const defaultDependencies: TaskResumeDependencies = {
  loadCandidate: loadBoundedTask,
  loadActive: loadBoundedActiveTask,
  activate: setActiveTask,
};

export async function resumeTask(
  harnixRoot: string,
  taskId: string,
  dryRun: boolean,
  dependencies: TaskResumeDependencies = defaultDependencies,
): Promise<TaskResumeResultV1> {
  if (!taskIdPattern.test(taskId)) throw new Error("Resume task ID is invalid.");

  let candidate: TaskRecord;
  try {
    candidate = validateTask(await dependencies.loadCandidate(harnixRoot, taskId));
  } catch {
    throw new Error("Resume task is unavailable or invalid.");
  }
  if (candidate.id !== taskId) throw new Error("Resume task is unavailable or invalid.");
  if (terminalStatuses.has(candidate.status)) throw new Error("Resume requires an unfinished task.");

  let active: TaskRecord | null;
  try {
    const loaded = await dependencies.loadActive(harnixRoot);
    active = loaded === null ? null : validateTask(loaded);
  } catch {
    throw new Error("Active task state is unavailable; run harnix doctor.");
  }
  if (active !== null && terminalStatuses.has(active.status)) throw new Error("Active task state is unavailable; run harnix doctor.");
  if (active !== null && active.id !== candidate.id) throw new Error("Resume cannot replace another active task.");

  let outcome: TaskResumeOutcome;
  if (active !== null) outcome = "already-active";
  else if (dryRun) outcome = "would-resume";
  else {
    try {
      await dependencies.activate(harnixRoot, candidate.id);
    } catch {
      throw new Error("Resume could not activate the task.");
    }
    outcome = "resumed";
  }

  return {
    generator: "harnix",
    schemaVersion: 1,
    scope: "project",
    dryRun,
    outcome,
    task: { id: candidate.id, mode: candidate.mode, status: candidate.status, checkpoint: candidate.checkpoint },
    nextAction: { code: "inspect-active-task", message: "Run harnix status to inspect the selected task." },
  };
}

async function loadBoundedActiveTask(harnixRoot: string): Promise<TaskRecord | null> {
  const pointerPath = await resolveSafeProjectPath(harnixRoot, "tasks/.active");
  let source: string;
  try {
    if ((await stat(pointerPath)).size > MAX_ACTIVE_POINTER_BYTES) throw new Error("Active task pointer is oversized.");
    source = await readFile(pointerPath, "utf8");
  }
  catch (error: unknown) { if (isMissing(error)) return null; throw error; }
  if (Buffer.byteLength(source, "utf8") > MAX_ACTIVE_POINTER_BYTES) throw new Error("Active task pointer is oversized.");
  const taskId = source.trim();
  if (taskId.length === 0) return null;
  if (!taskIdPattern.test(taskId)) throw new Error("Active task pointer is invalid.");
  return loadBoundedTask(harnixRoot, taskId);
}

async function loadBoundedTask(harnixRoot: string, taskId: string): Promise<TaskRecord> {
  if (!taskIdPattern.test(taskId)) throw new Error("Task ID is invalid.");
  const path = await resolveSafeProjectPath(harnixRoot, `tasks/${taskId}/task.json`);
  if ((await stat(path)).size > MAX_TASK_RECORD_BYTES) throw new Error("Task record is oversized.");
  const source = await readFile(path, "utf8");
  if (Buffer.byteLength(source, "utf8") > MAX_TASK_RECORD_BYTES) throw new Error("Task record is oversized.");
  const task = validateTask(JSON.parse(source) as unknown);
  if (task.id !== taskId) throw new Error("Task directory and record IDs differ.");
  return task;
}

function isMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "ENOENT";
}
