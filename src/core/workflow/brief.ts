import type { TaskRecord } from "src/core/tasks/task.js";
import { compareCodeUnits } from "src/utils/order.js";

export interface BriefTask {
  id: string;
  status: TaskRecord["status"];
  checkpoint: TaskRecord["checkpoint"];
  updatedAt: string;
  evidenceId?: string;
}

/** Workflow actions that accept `--brief`: the one list behind flag validation, `--schema` and the guidance. */
export const BRIEF_ACTIONS: ReadonlySet<string> = new Set([
  "init",
  "batch",
  "save",
  "transition",
  "evidence",
  "criterion",
  "migrate",
  "finish",
  "preflight",
  "runCheck",
  "setCheck",
  "addCriterion",
  "addDecision",
  "addRisk",
  "setPaths",
  "replaceCheck",
]);

/** The command-line flag of a workflow action: `runCheck` is `--run-check`. */
export const actionFlagName = (action: string): string =>
  `--${action.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`)}`;

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
