import { resolveActiveTask, type TaskRecord } from "src/core/tasks/task.js";
import { assertLegalTransition, laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { inspectReadyConditions } from "./ready.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";

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
}

/**
 * Bounded partial transport. It never accepts a task body: the persisted
 * active record is the only source, so a stage owner cannot drop evidence or
 * silently rewrite an obligation while changing state. Every guard, lock and
 * immutability rule of the full save path still applies.
 */
export function transitionWorkflow(
  root: string,
  status: string,
  checkpoint: string,
  injectedNow: string | undefined,
  dryRun: true,
): Promise<DryRunTransitionResult>;
export function transitionWorkflow(
  root: string,
  status: string,
  checkpoint: string,
  injectedNow?: string,
  dryRun?: false,
): Promise<TaskRecord>;
export function transitionWorkflow(
  root: string,
  status: string,
  checkpoint: string,
  injectedNow?: string,
  dryRun?: boolean,
): Promise<TaskRecord | DryRunTransitionResult>;
export async function transitionWorkflow(
  root: string,
  status: string,
  checkpoint: string,
  injectedNow?: string,
  dryRun?: boolean,
): Promise<TaskRecord | DryRunTransitionResult> {
  const now = await currentInstant(root, injectedNow);
  if (status === "cancelled") throw new Error("Workflow cancellation must use workflow --cancel.");
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw new Error("Workflow transition requires an active task.");

  if (dryRun === true) {
    const issues: string[] = [];
    let advisories: string[] = [];
    let unbaselinedChecks: string[] | undefined;
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
      const readyInspection = await inspectReadyConditions(harnixRoot, task);
      issues.push(...readyInspection.issues);
      advisories = readyInspection.advisories;
      if (readyInspection.unbaselined.length > 0) {
        unbaselinedChecks = readyInspection.unbaselined;
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
    };
  }

  // A blocked task keeps its blocker only while blocked; resuming drops it and must land on the recorded status.
  const base: TaskRecord = { ...task };
  if (base.status === "blocked") delete base.blocker;
  return saveWorkflow(root, { task: { ...base, status, checkpoint, updatedAt: laterTimestamp(task.updatedAt, now) } });
}
