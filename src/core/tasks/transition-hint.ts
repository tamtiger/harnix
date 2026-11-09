import type { TaskStatus } from "./task-schema.js";

/** The forward lifecycle and the `--transition` command that enters each stage after planning. */
const FORWARD: readonly TaskStatus[] = ["planning", "ready", "in_progress", "verifying", "completed"];
const STEP: Partial<Record<TaskStatus, string>> = {
  ready: "harnix workflow --transition ready/ready",
  in_progress: "harnix workflow --transition in_progress/implementing",
  verifying: "harnix workflow --transition verifying/verifying",
  completed: "harnix workflow --criterion <ids> --met --transition verifying/finishing, then harnix workflow --finish",
};

/**
 * Explains an illegal status transition from the current state: the legal next statuses and, when the target lies
 * ahead, the command chain that reaches it; a target behind the task points at replan, and a blocked task at resume.
 */
export function transitionHint(
  from: TaskStatus,
  to: TaskStatus,
  legal: readonly TaskStatus[],
  resumeStatus?: TaskStatus,
): string {
  if (legal.length === 0) return `${from} is terminal and has no further transitions`;
  const legalText = `legal next statuses from ${from}: ${legal.join(", ")}`;
  if (from === "blocked")
    return `${legalText}. Resume it to its recorded status${resumeStatus === undefined ? "" : ` (${resumeStatus})`} first`;
  const start = FORWARD.indexOf(from);
  const end = FORWARD.indexOf(to);
  if (start < 0 || end <= start)
    return `${legalText}. No step leads back to ${to}; revise obligations with a flag edit and --reason (checkpoint replan) instead`;
  const steps = FORWARD.slice(start + 1, end + 1).map((status) => STEP[status] ?? "");
  return `${legalText}. To reach ${to}: ${steps.join(", then ")}`;
}
