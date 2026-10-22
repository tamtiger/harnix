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
import { readCodeImpact, type CodeImpactGitRunner } from "./code-impact.js";
import { extractCodeImpactSection, renderTaskReview, type ReviewArtifacts } from "./task-review.js";
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

export interface SaveTaskOptions {
  /** The repository the task belongs to; when set, `review.md` gets a read-only `## Code impact` from Git. */
  projectRoot?: string;
  gitRunner?: CodeImpactGitRunner;
}

async function previousSection(reviewPath: string): Promise<Pick<ReviewArtifacts, "preservedCodeImpact">> {
  try {
    const preserved = extractCodeImpactSection(await readFile(reviewPath, "utf8"));
    return preserved === undefined ? {} : { preservedCodeImpact: preserved };
  } catch {
    return {};
  }
}

async function codeImpactFor(
  task: TaskRecord,
  reviewPath: string,
  options: SaveTaskOptions,
): Promise<Pick<ReviewArtifacts, "codeImpact" | "codeImpactTruncated" | "preservedCodeImpact">> {
  // A finished task is no longer measured, but its last section stays: reading the old review.md needs no repository.
  if (task.status === "completed") return previousSection(reviewPath);
  if (options.projectRoot === undefined || (task.status !== "in_progress" && task.status !== "verifying")) return {};
  const impact = await readCodeImpact(options.projectRoot, options.gitRunner);
  if (impact === null) return previousSection(reviewPath); // git could not answer: keep the last known section
  return impact === undefined ? {} : { codeImpact: impact.items, codeImpactTruncated: impact.truncated };
}

/**
 * `review.md` is a derived, always-overwritten human-reading surface: it is
 * never a source of truth and carries no obligation. It intentionally omits
 * `prd.md`/`plan.md` prose so review-only edits (a later decision, a residual
 * risk noted at finish) never touch the Full task's hashed planning inputs
 * and cannot invalidate already-passed evidence.
 */
export async function saveTask(root: string, task: TaskRecord, options: SaveTaskOptions = {}): Promise<void> {
  const valid = validateTask(task);
  const directory = await resolveSafeProjectPath(root, `tasks/${valid.id}`);
  const path = await resolveSafeProjectPath(root, `tasks/${valid.id}/task.json`);
  await mkdir(directory, { recursive: true });
  await atomicWriteFile(path, JSON.stringify(valid, null, 2) + "\n");
  const reviewPath = await resolveSafeProjectPath(directory, "review.md");
  const artifacts: ReviewArtifacts = {
    prd: await exists(await resolveSafeProjectPath(directory, "prd.md")),
    plan: await exists(await resolveSafeProjectPath(directory, "plan.md")),
    design: await exists(await resolveSafeProjectPath(directory, "design.md")),
    ...(await codeImpactFor(valid, reviewPath, options)),
  };
  await atomicWriteFile(reviewPath, renderTaskReview(valid, artifacts, await readProjectTimezone(root)));
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
  validateCeremonyArtifacts(task, artifacts);
  validateResearchArtifacts(artifacts.research);
  validateContextArtifacts(task.id, artifacts);
}

function validateCeremonyArtifacts(task: TaskRecord, artifacts: TaskArtifacts): void {
  if (task.mode === "full") {
    if (!artifacts.prd?.trim() || !artifacts.plan?.trim())
      throw new TaskValidationError("Full tasks require prd.md and plan.md.");
  } else if (artifacts.prd || artifacts.plan) {
    throw new TaskValidationError("Lite tasks must not create full ceremony artifacts.");
  }
}

function validateResearchArtifacts(research: TaskArtifacts["research"]): void {
  if (!research) return;
  for (const [name, content] of Object.entries(research)) {
    if (!/^[a-z0-9][a-z0-9._-]*\.md$/u.test(name) || !content.trim())
      throw new TaskValidationError("Research artifact name or content is invalid.");
  }
}

function validateContextArtifacts(taskId: string, artifacts: TaskArtifacts): void {
  if ((artifacts.context === undefined) !== (artifacts.contextSelection === undefined))
    throw new TaskValidationError("Context persistence requires both manifest and selection snapshot.");
  if (artifacts.context && artifacts.contextSelection) {
    const manifest = validateContextManifest(artifacts.context);
    const snapshot = validateContextSelectionSnapshot(artifacts.contextSelection);
    if (
      manifest.taskId !== taskId ||
      snapshot.taskId !== taskId ||
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
