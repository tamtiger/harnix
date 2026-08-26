import { readdir, readFile, stat } from "node:fs/promises";

import { resolveSafeProjectPath } from "../../utils/paths.js";
import { validateTask, type TaskMode, type TaskRecord, type TaskStatus, type WorkflowCheckpoint } from "./task.js";

const MAX_SCANNED_TASKS = 1_000;
const MAX_TASK_RECORD_BYTES = 1_048_576;
const MAX_ACTIVE_POINTER_BYTES = 1_024;
const taskIdPattern = /^\d{8}-\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const taskStatuses = new Set<TaskStatus>(["planning", "ready", "in_progress", "verifying", "blocked", "completed", "cancelled"]);

export interface TaskIndexOptions {
  readonly limit: number;
  readonly status?: TaskStatus | undefined;
}

export interface TaskIndexSource {
  listTaskDirectoryIds(harnixRoot: string): Promise<readonly string[]>;
  readActiveTaskId(harnixRoot: string): Promise<string | null>;
  loadTaskRecord(harnixRoot: string, taskId: string): Promise<unknown>;
}

export interface TaskIndexItemV1 {
  readonly id: string;
  readonly mode: TaskMode;
  readonly status: TaskStatus;
  readonly checkpoint: WorkflowCheckpoint;
  readonly active: boolean;
  readonly updatedAt: string;
}

export interface TaskIndexResultV1 {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly scope: "project";
  readonly status: "ready" | "partial";
  readonly filter: {
    readonly status: TaskStatus | null;
    readonly limit: number;
  };
  readonly summary: {
    readonly scanned: number;
    readonly valid: number;
    readonly invalid: number;
    readonly matched: number;
    readonly returned: number;
    readonly scanTruncated: boolean;
    readonly resultTruncated: boolean;
  };
  readonly activeTaskId: string | null;
  readonly attention: readonly [{ readonly code: "active-task-unavailable" }] | readonly [];
  readonly tasks: readonly TaskIndexItemV1[];
}

const fileSystemTaskIndexSource: TaskIndexSource = {
  async listTaskDirectoryIds(harnixRoot) {
    const tasksRoot = await resolveSafeProjectPath(harnixRoot, "tasks");
    try {
      return (await readdir(tasksRoot, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch (error: unknown) {
      if (isMissing(error)) return [];
      throw error;
    }
  },
  async readActiveTaskId(harnixRoot) {
    const path = await resolveSafeProjectPath(harnixRoot, "tasks/.active");
    try {
      if ((await stat(path)).size > MAX_ACTIVE_POINTER_BYTES) throw new Error("Active task pointer is oversized.");
      const value = (await readFile(path, "utf8")).trim();
      return value.length === 0 ? null : value;
    } catch (error: unknown) {
      if (isMissing(error)) return null;
      throw error;
    }
  },
  async loadTaskRecord(harnixRoot, taskId) {
    const path = await resolveSafeProjectPath(harnixRoot, `tasks/${taskId}/task.json`);
    if ((await stat(path)).size > MAX_TASK_RECORD_BYTES) throw new Error("Task record is oversized.");
    return JSON.parse(await readFile(path, "utf8")) as unknown;
  },
};

export async function createTaskIndex(
  harnixRoot: string,
  options: TaskIndexOptions,
  source: TaskIndexSource = fileSystemTaskIndexSource,
): Promise<TaskIndexResultV1> {
  assertOptions(options);

  let activePointer: string | null = null;
  let activeUnavailable = false;
  try {
    const candidate = await source.readActiveTaskId(harnixRoot);
    if (candidate !== null && !taskIdPattern.test(candidate)) activeUnavailable = true;
    else activePointer = candidate;
  } catch {
    activeUnavailable = true;
  }

  const directoryIds = [...new Set((await source.listTaskDirectoryIds(harnixRoot)).filter((id) => taskIdPattern.test(id)))]
    .sort(compareCodeUnitsDescending);
  const selectedIds = directoryIds.slice(0, MAX_SCANNED_TASKS);
  if (activePointer !== null && directoryIds.includes(activePointer) && !selectedIds.includes(activePointer)) {
    selectedIds[selectedIds.length - 1] = activePointer;
  }

  const validTasks: TaskRecord[] = [];
  let invalid = 0;
  for (const id of selectedIds) {
    try {
      const task = validateTask(await source.loadTaskRecord(harnixRoot, id));
      if (task.id !== id) throw new Error("Task directory and record IDs differ.");
      validTasks.push(task);
    } catch {
      invalid += 1;
    }
  }

  const activeTask = activePointer === null ? undefined : validTasks.find((task) => task.id === activePointer);
  if (activePointer !== null && activeTask === undefined) activeUnavailable = true;
  const activeTaskId = activeTask?.id ?? null;
  const matched = validTasks
    .filter((task) => options.status === undefined || task.status === options.status)
    .map((task): TaskIndexItemV1 => ({
      id: task.id,
      mode: task.mode,
      status: task.status,
      checkpoint: task.checkpoint,
      active: task.id === activeTaskId,
      updatedAt: task.updatedAt,
    }))
    .sort(compareTaskItems);
  const tasks = matched.slice(0, options.limit);
  const attention: TaskIndexResultV1["attention"] = activeUnavailable ? [{ code: "active-task-unavailable" }] : [];

  return {
    generator: "harnix",
    schemaVersion: 1,
    scope: "project",
    status: invalid > 0 || activeUnavailable ? "partial" : "ready",
    filter: { status: options.status ?? null, limit: options.limit },
    summary: {
      scanned: selectedIds.length,
      valid: validTasks.length,
      invalid,
      matched: matched.length,
      returned: tasks.length,
      scanTruncated: directoryIds.length > selectedIds.length,
      resultTruncated: matched.length > tasks.length,
    },
    activeTaskId,
    attention,
    tasks,
  };
}

function assertOptions(options: TaskIndexOptions): void {
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 100) throw new Error("Task index limit must be an integer between 1 and 100.");
  if (options.status !== undefined && !taskStatuses.has(options.status)) throw new Error("Task index status filter is invalid.");
}

function compareTaskItems(left: TaskIndexItemV1, right: TaskIndexItemV1): number {
  if (left.active !== right.active) return left.active ? -1 : 1;
  const timestampDifference = Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  return timestampDifference === 0 ? compareCodeUnitsDescending(left.id, right.id) : timestampDifference;
}

function compareCodeUnitsDescending(left: string, right: string): number {
  return left === right ? 0 : left < right ? 1 : -1;
}

function isMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "ENOENT";
}
