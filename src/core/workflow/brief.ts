import type { TaskRecord } from "src/core/tasks/task.js";
import { compareCodeUnits } from "src/utils/order.js";
import { actionFlagName, WORKFLOW_ACTIONS } from "./actions.js";

export interface BriefTask {
  id: string;
  status: TaskRecord["status"];
  checkpoint: TaskRecord["checkpoint"];
  updatedAt: string;
  evidenceId?: string;
}

/** Workflow actions that accept `--brief`: the one list behind flag validation, `--schema` and the guidance. */
export const BRIEF_ACTIONS: ReadonlySet<string> = new Set(
  WORKFLOW_ACTIONS.filter((spec) => spec.brief).map((spec) => spec.name),
);

export { actionFlagName };

/** Every flag that accepts `--brief`, sorted. */
export const briefFlagNames = (): string[] => [...BRIEF_ACTIONS].map(actionFlagName).sort(compareCodeUnits);

/** Identity and state only: what a stage owner needs to confirm a mutating call landed. */
export function briefTask(task: TaskRecord, evidenceId?: string): BriefTask {
  const brief: BriefTask = { id: task.id, status: task.status, checkpoint: task.checkpoint, updatedAt: task.updatedAt };
  if (evidenceId !== undefined) brief.evidenceId = evidenceId;
  return brief;
}

/** A routing answer without the learning notes, for a caller that only needs the clock, the stage and the checks. */
export function briefPreflight<T extends { learning: unknown }>(result: T): Omit<T, "learning"> {
  const { learning, ...rest } = result;
  void learning;
  return rest;
}
