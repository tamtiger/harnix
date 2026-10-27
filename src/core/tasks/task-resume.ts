import { Buffer } from "node:buffer";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { resolveSafeProjectPath } from "src/utils/paths.js";
import { setActiveTask, validateTask, type TaskRecord } from "./task.js";
import { taskFilePath } from "src/core/tasks/task-location.js";

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
  readonly warnings?: string[];
  readonly nextAction: {
    readonly code: "inspect-active-task";
    readonly message: "Run harnix status to inspect the selected task.";
  };
}

export interface TaskResumeDependencies {
  loadCandidate(harnixRoot: string, taskId: string): Promise<TaskRecord>;
  loadActive(harnixRoot: string): Promise<TaskRecord | null>;
  activate(harnixRoot: string, taskId: string): Promise<void>;
  fileExists?: (path: string) => Promise<boolean>;
}

const TEST_FILE_PATTERN =
  /(?:^|[\s"'])([\w./\\-]+\.(?:test|spec)\.[a-z0-9]+|[\w./\\-]*test_[\w-]+\.py|[\w./\\-]*[\w-]+_test\.py)(?:[\s"']|$)/giu;

async function sanityCheckTestFiles(
  candidate: TaskRecord,
  fileExists: (path: string) => Promise<boolean>,
): Promise<string[]> {
  const warnings: string[] = [];
  for (const check of candidate.validationPlan) {
    const candidates = new Set<string>();
    if (check.command) {
      for (const match of check.command.matchAll(TEST_FILE_PATTERN)) {
        if (match[1]) candidates.add(match[1].trim());
      }
    }
    if ("inputs" in check && Array.isArray(check.inputs)) {
      for (const input of check.inputs) {
        if (!input.includes("*") && input !== "@task-contract" && TEST_FILE_PATTERN.test(input)) {
          candidates.add(input.trim());
        }
      }
    }
    for (const testPath of candidates) {
      try {
        const exists = await fileExists(testPath);
        if (!exists) {
          warnings.push(
            `Check '${check.id}' references missing test file '${testPath}'. It may have been deleted or renamed by a prior task; review before ready.`,
          );
        }
      } catch {
        // file existence check failed
      }
    }
  }
  return warnings;
}

const defaultDependencies: TaskResumeDependencies = {
  loadCandidate: loadBoundedTask,
  loadActive: loadBoundedActiveTask,
  activate: setActiveTask,
};

async function loadAndValidateCandidate(
  dependencies: TaskResumeDependencies,
  harnixRoot: string,
  taskId: string,
): Promise<TaskRecord> {
  let candidate: TaskRecord;
  try {
    candidate = validateTask(await dependencies.loadCandidate(harnixRoot, taskId));
  } catch {
    throw new Error("Resume task is unavailable or invalid.");
  }
  if (candidate.id !== taskId || terminalStatuses.has(candidate.status)) {
    throw new Error(
      candidate.id !== taskId ? "Resume task is unavailable or invalid." : "Resume requires an unfinished task.",
    );
  }
  return candidate;
}

async function loadAndValidateActive(
  dependencies: TaskResumeDependencies,
  harnixRoot: string,
  candidateId: string,
  force: boolean,
): Promise<TaskRecord | null> {
  let active: TaskRecord | null;
  try {
    const loaded = await dependencies.loadActive(harnixRoot);
    active = loaded === null ? null : validateTask(loaded);
  } catch {
    throw new Error("Active task state is unavailable; run harnix doctor.");
  }
  if (active !== null && terminalStatuses.has(active.status)) {
    throw new Error("Active task state is unavailable; run harnix doctor.");
  }
  if (active !== null && active.id !== candidateId && !force) {
    throw new Error("Resume cannot replace another active task.");
  }
  return active;
}

export async function resumeTask(
  harnixRoot: string,
  taskId: string,
  dryRun: boolean,
  dependencies: TaskResumeDependencies = defaultDependencies,
  force = false,
): Promise<TaskResumeResultV1> {
  if (!taskIdPattern.test(taskId)) throw new Error("Resume task ID is invalid.");

  const candidate = await loadAndValidateCandidate(dependencies, harnixRoot, taskId);
  const active = await loadAndValidateActive(dependencies, harnixRoot, candidate.id, force);

  let outcome: TaskResumeOutcome;
  if (active !== null && active.id === candidate.id) outcome = "already-active";
  else if (dryRun) outcome = "would-resume";
  else {
    try {
      await dependencies.activate(harnixRoot, candidate.id);
    } catch {
      throw new Error("Resume could not activate the task.");
    }
    outcome = "resumed";
  }

  const fileExists =
    dependencies.fileExists ??
    (async (relPath: string) => {
      try {
        const projectRoot = resolve(harnixRoot, "..");
        const full = await resolveSafeProjectPath(projectRoot, relPath);
        const s = await stat(full);
        return s.isFile();
      } catch {
        return false;
      }
    });

  const warnings = await sanityCheckTestFiles(candidate, fileExists);

  return {
    generator: "harnix",
    schemaVersion: 1,
    scope: "project",
    dryRun,
    outcome,
    task: { id: candidate.id, mode: candidate.mode, status: candidate.status, checkpoint: candidate.checkpoint },
    ...(warnings.length > 0 ? { warnings } : {}),
    nextAction: { code: "inspect-active-task", message: "Run harnix status to inspect the selected task." },
  };
}

export async function loadBoundedActiveTask(harnixRoot: string): Promise<TaskRecord | null> {
  const pointerPath = await resolveSafeProjectPath(harnixRoot, "tasks/.active");
  let source: string;
  try {
    if ((await stat(pointerPath)).size > MAX_ACTIVE_POINTER_BYTES) throw new Error("Active task pointer is oversized.");
    source = await readFile(pointerPath, "utf8");
  } catch (error: unknown) {
    if (isMissing(error)) return null;
    throw error;
  }
  if (Buffer.byteLength(source, "utf8") > MAX_ACTIVE_POINTER_BYTES)
    throw new Error("Active task pointer is oversized.");
  const taskId = source.trim();
  if (taskId.length === 0) return null;
  if (!taskIdPattern.test(taskId)) throw new Error("Active task pointer is invalid.");
  return loadBoundedTask(harnixRoot, taskId);
}

async function loadBoundedTask(harnixRoot: string, taskId: string): Promise<TaskRecord> {
  if (!taskIdPattern.test(taskId)) throw new Error("Task ID is invalid.");
  const path = await taskFilePath(harnixRoot, taskId, "task.json");
  if ((await stat(path)).size > MAX_TASK_RECORD_BYTES) throw new Error("Task record is oversized.");
  const source = await readFile(path, "utf8");
  if (Buffer.byteLength(source, "utf8") > MAX_TASK_RECORD_BYTES) throw new Error("Task record is oversized.");
  const task = validateTask(JSON.parse(source) as unknown);
  if (task.id !== taskId) throw new Error("Task directory and record IDs differ.");
  return task;
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "ENOENT"
  );
}
