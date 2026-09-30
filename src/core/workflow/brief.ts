import type { TaskRecord } from "src/core/tasks/task.js";

export interface BriefTask {
  id: string;
  status: TaskRecord["status"];
  checkpoint: TaskRecord["checkpoint"];
  updatedAt: string;
  evidenceId?: string;
}

/** Identity and state only: what a stage owner needs to confirm a mutating call landed. */
export function briefTask(task: TaskRecord, evidenceId?: string): BriefTask {
  const brief: BriefTask = { id: task.id, status: task.status, checkpoint: task.checkpoint, updatedAt: task.updatedAt };
  if (evidenceId !== undefined) brief.evidenceId = evidenceId;
  return brief;
}
