import { readFile } from "node:fs/promises";

import { resolveActiveTask, type TaskRecord } from "src/core/tasks/task.js";
import { assertLegalTransition, laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { inspectReadyConditions } from "./ready.js";
import { READY_REVIEW_CHECKLIST, reviewRequiredMessage } from "./ready-review.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";
import { resolveEditableTask } from "./target-task.js";
import { taskFilePath } from "src/core/tasks/task-location.js";

export interface DryRunTransitionResult {
  generator: "harnix";
  schemaVersion: 1;
  dryRun: true;
  valid: boolean;
  target: { status: string; checkpoint: string };
  task: { id: string; status: string; checkpoint: string };
  issues: string[];
  /** Not enforced by the transition; worth fixing before the contract freezes. */
  advisories: string[];
  unbaselinedChecks?: string[];
  /** Present for a Full task checked for ready (the ready-review to run before --reviewed), for a ready target with issues, or with --checklist. */
  reviewChecklist?: string[];
}

export interface TransitionOptions {
  /** The caller attests that the ready-review was run; a Full task cannot enter ready/ready without it. */
  reviewed?: boolean;
  /** Dry run only: also print `reviewChecklist` for a target that would not print it by default. */
  checklist?: boolean;
  reason?: string | undefined;
  note?: string | undefined;
}

export function transitionWorkflow(
  root: string,
  status: string,
  checkpoint: string,
  injectedNow: string | undefined,
  dryRun: true,
  options?: TransitionOptions,
): Promise<DryRunTransitionResult>;
export function transitionWorkflow(
  root: string,
  status: string,
  checkpoint: string,
  injectedNow?: string,
  dryRun?: false,
  options?: TransitionOptions,
): Promise<TaskRecord>;
export function transitionWorkflow(
  root: string,
  status: string,
  checkpoint: string,
  injectedNow?: string,
  dryRun?: boolean,
  options?: TransitionOptions,
): Promise<TaskRecord | DryRunTransitionResult>;
export async function transitionWorkflow(
  root: string,
  status: string,
  checkpoint: string,
  injectedNow?: string,
  dryRun?: boolean,
  options: TransitionOptions = {},
): Promise<TaskRecord | DryRunTransitionResult> {
  const now = await currentInstant(root, injectedNow);
  if (status === "cancelled") throw new Error("Workflow cancellation must use workflow --cancel.");
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = dryRun === true ? await resolveEditableTask(harnixRoot) : await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow transition requires an active task.");

  if (dryRun === true) {
    return handleDryRunTransition(harnixRoot, task, status, checkpoint, options.checklist === true);
  }

  const entersReady = status === "ready" && checkpoint === "ready";
  if (entersReady && task.mode === "full" && task.checkpoint !== "ready" && options.reviewed !== true) {
    const found = await inspectReadyConditions(harnixRoot, task);
    throw new Error(reviewRequiredMessage(found.issues, found.advisories));
  }

  if (status === "verifying") {
    const checklistWarning = await inspectPlanChecklistWarning(harnixRoot, task.id);
    if (checklistWarning !== undefined) {
      if (checkpoint === "verifying") {
        throw new Error(
          `Cannot enter verifying: plan.md checklist is not 100% completed. Tick remaining items using "harnix workflow --tick <item>" or "--tick all".`,
        );
      }
      process.stderr.write(`warning: ${checklistWarning}\n`);
    }
  }

  const base: TaskRecord = { ...task };
  if (base.status === "blocked") delete base.blocker;
  return saveWorkflow(root, {
    task: { ...base, status, checkpoint, updatedAt: laterTimestamp(task.updatedAt, now) } as TaskRecord,
  });
}

async function handleDryRunTransition(
  harnixRoot: string,
  task: TaskRecord,
  status: string,
  checkpoint: string,
  checklist: boolean,
): Promise<DryRunTransitionResult> {
  const issues: string[] = [];
  let advisories: string[] = [];
  let unbaselinedChecks: string[] | undefined;
  const entersReady = status === "ready" && checkpoint === "ready";

  try {
    assertLegalTransition(task, {
      ...task,
      status: status as TaskRecord["status"],
      checkpoint: checkpoint as TaskRecord["checkpoint"],
    });
  } catch (error: unknown) {
    issues.push(error instanceof Error ? error.message : String(error));
  }

  if (status === "ready") {
    const readyInspection = await inspectReadyConditions(harnixRoot, task, undefined, task.checkpoint !== "ready");
    issues.push(...readyInspection.issues);
    advisories = readyInspection.advisories;
    if (readyInspection.unbaselined.length > 0) {
      unbaselinedChecks = readyInspection.unbaselined;
    }
  }

  if (status === "verifying") {
    const checklistWarning = await inspectPlanChecklistWarning(harnixRoot, task.id);
    if (checklistWarning !== undefined) {
      if (checkpoint === "verifying") {
        issues.push(
          `Cannot enter verifying: plan.md checklist is not 100% completed. Tick remaining items using "harnix workflow --tick <item>" or "--tick all".`,
        );
      } else {
        advisories.push(checklistWarning);
      }
    }
  }

  return {
    generator: "harnix",
    schemaVersion: 1,
    dryRun: true,
    valid: issues.length === 0,
    target: { status, checkpoint },
    task: { id: task.id, status: task.status, checkpoint: task.checkpoint },
    issues,
    advisories,
    ...(unbaselinedChecks ? { unbaselinedChecks } : {}),
    ...(checklist || (entersReady && (task.mode === "full" || issues.length > 0))
      ? { reviewChecklist: [...READY_REVIEW_CHECKLIST] }
      : {}),
  };
}

async function inspectPlanChecklistWarning(harnixRoot: string, taskId: string): Promise<string | undefined> {
  try {
    const planPath = await taskFilePath(harnixRoot, taskId, "plan.md");
    const content = await readFile(planPath, "utf8");
    if (/^\s*-\s*\[\s\]/mu.test(content)) {
      return "Checklist trong plan.md chưa hoàn tất 100% [x] trước khi vào verifying.";
    }
  } catch {
    // Lite task without plan.md is normal; ignore
  }
  return undefined;
}
