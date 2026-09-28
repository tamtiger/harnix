import { clearActiveTask, validateTask, type TaskRecord } from "./task.js";
import { loadBoundedActiveTask } from "./task-resume.js";

const terminalStatuses = new Set<TaskRecord["status"]>(["completed", "cancelled"]);

export type TaskPauseOutcome = "would-pause" | "paused" | "no-active-task";

export interface TaskPauseResultV1 {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly scope: "project";
  readonly dryRun: boolean;
  readonly outcome: TaskPauseOutcome;
  readonly task: Pick<TaskRecord, "id" | "mode" | "status" | "checkpoint"> | null;
  readonly nextAction: {
    readonly code: "resume-guidance" | "no-action-needed";
    readonly message: string;
  };
}

export interface TaskPauseDependencies {
  loadActive(harnixRoot: string): Promise<TaskRecord | null>;
  deactivate(harnixRoot: string, taskId: string): Promise<void>;
}

const defaultDependencies: TaskPauseDependencies = {
  loadActive: loadBoundedActiveTask,
  deactivate: clearActiveTask,
};

export async function pauseTask(
  harnixRoot: string,
  dryRun: boolean,
  dependencies: TaskPauseDependencies = defaultDependencies,
): Promise<TaskPauseResultV1> {
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

  if (active === null) {
    return {
      generator: "harnix",
      schemaVersion: 1,
      scope: "project",
      dryRun,
      outcome: "no-active-task",
      task: null,
      nextAction: {
        code: "no-action-needed",
        message: "There is no active task to pause.",
      },
    };
  }

  if (dryRun) {
    return {
      generator: "harnix",
      schemaVersion: 1,
      scope: "project",
      dryRun: true,
      outcome: "would-pause",
      task: { id: active.id, mode: active.mode, status: active.status, checkpoint: active.checkpoint },
      nextAction: {
        code: "resume-guidance",
        message: `Run harnix resume ${active.id} when ready to continue.`,
      },
    };
  }

  try {
    await dependencies.deactivate(harnixRoot, active.id);
  } catch {
    throw new Error("Pause could not deactivate the task.");
  }

  return {
    generator: "harnix",
    schemaVersion: 1,
    scope: "project",
    dryRun: false,
    outcome: "paused",
    task: { id: active.id, mode: active.mode, status: active.status, checkpoint: active.checkpoint },
    nextAction: {
      code: "resume-guidance",
      message: `Run harnix resume ${active.id} when ready to continue.`,
    },
  };
}
