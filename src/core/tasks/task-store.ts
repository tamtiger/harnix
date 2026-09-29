import { access, mkdir, readFile } from "node:fs/promises";
import { atomicWriteFile } from "src/utils/atomic-write.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";
import { readProjectTimezone } from "src/core/config/config.js";
import { saveContextManifest, validateContextManifest, type ContextManifest } from "src/core/context/context.js";
import {
  contextSelectionResultHash,
  saveContextSelectionSnapshot,
  validateContextSelectionSnapshot,
  type ContextSelectionSnapshotV1,
} from "src/core/context/selection-freshness.js";
import { renderTaskReview } from "./task-review.js";
import type { TaskRecord } from "./task-schema.js";
import { validateTask } from "./task-validate.js";
import { TaskValidationError, isMissing, validateTaskId } from "./task-validate-common.js";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * `review.md` is a derived, always-overwritten human-reading surface: it is
 * never a source of truth and carries no obligation. It intentionally omits
 * `prd.md`/`plan.md` prose so review-only edits (a later decision, a residual
 * risk noted at finish) never touch the Full task's hashed planning inputs
 * and cannot invalidate already-passed evidence.
 */
export async function saveTask(root: string, task: TaskRecord): Promise<void> {
  const valid = validateTask(task);
  const directory = await resolveSafeProjectPath(root, `tasks/${valid.id}`);
  const path = await resolveSafeProjectPath(root, `tasks/${valid.id}/task.json`);
  await mkdir(directory, { recursive: true });
  await atomicWriteFile(path, JSON.stringify(valid, null, 2) + "\n");
  const artifacts = {
    prd: await exists(await resolveSafeProjectPath(directory, "prd.md")),
    plan: await exists(await resolveSafeProjectPath(directory, "plan.md")),
    design: await exists(await resolveSafeProjectPath(directory, "design.md")),
  };
  await atomicWriteFile(
    await resolveSafeProjectPath(directory, "review.md"),
    renderTaskReview(valid, artifacts, await readProjectTimezone(root)),
  );
}

export interface TaskArtifacts {
  prd?: string;
  plan?: string;
  design?: string;
  research?: Record<string, string>;
  context?: ContextManifest;
  contextSelection?: ContextSelectionSnapshotV1;
}
export async function saveTaskWithArtifacts(
  root: string,
  task: TaskRecord,
  artifacts: TaskArtifacts = {},
): Promise<void> {
  await saveTaskArtifacts(root, task, artifacts);
  await saveTask(root, task);
}
export function validateTaskArtifacts(task: TaskRecord, artifacts: TaskArtifacts = {}): void {
  if (task.mode === "full") {
    if (!artifacts.prd?.trim() || !artifacts.plan?.trim())
      throw new TaskValidationError("Full tasks require prd.md and plan.md.");
  } else if (artifacts.prd || artifacts.plan)
    throw new TaskValidationError("Lite tasks must not create full ceremony artifacts.");
  if (artifacts.research)
    for (const [name, content] of Object.entries(artifacts.research))
      if (!/^[a-z0-9][a-z0-9._-]*\.md$/u.test(name) || !content.trim())
        throw new TaskValidationError("Research artifact name or content is invalid.");
  if ((artifacts.context === undefined) !== (artifacts.contextSelection === undefined))
    throw new TaskValidationError("Context persistence requires both manifest and selection snapshot.");
  if (artifacts.context && artifacts.contextSelection) {
    const manifest = validateContextManifest(artifacts.context);
    const snapshot = validateContextSelectionSnapshot(artifacts.contextSelection);
    if (
      manifest.taskId !== task.id ||
      snapshot.taskId !== task.id ||
      snapshot.selectionResultHash !== contextSelectionResultHash(manifest)
    )
      throw new TaskValidationError("Context persistence task binding is invalid.");
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
  if (artifacts.design?.trim())
    await atomicWriteFile(await resolveSafeProjectPath(directory, "design.md"), artifacts.design);
  if (artifacts.research)
    for (const [name, content] of Object.entries(artifacts.research)) {
      await atomicWriteFile(await resolveSafeProjectPath(directory, `research/${name}`), content);
    }
  if (artifacts.context && artifacts.contextSelection) {
    await saveContextManifest(directory, artifacts.context);
    await saveContextSelectionSnapshot(directory, artifacts.contextSelection);
  }
}
export async function loadTask(path: string): Promise<TaskRecord> {
  const raw = await readFile(path, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new TaskValidationError(`Task record is corrupt or truncated JSON: ${path}`, { cause });
  }
  return validateTask(parsed);
}
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
  try {
    if ((await readFile(activePath, "utf8")).trim() === taskId) await atomicWriteFile(activePath, "");
  } catch (error: unknown) {
    if (!isMissing(error)) throw error;
  }
}
export async function archiveTask(harnixRoot: string, task: TaskRecord): Promise<void> {
  const valid = validateTask(task);
  if (valid.status !== "completed" && valid.status !== "cancelled")
    throw new TaskValidationError("Only terminal tasks can be archived.");
  await clearActiveTask(harnixRoot, valid.id);
}
