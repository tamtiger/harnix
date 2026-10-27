import { saveTask } from "src/core/tasks/task.js";
import { buildCriterion, buildEvidence, buildTaskV3 } from "test/support/builders.js";
import type { TaskRecordV3 } from "src/core/tasks/task.js";

export const DAY_MS = 86_400_000;
/** The clock every archive test runs at; fixtures are dated relative to it. */
export const NOW = Date.parse("2026-10-27T12:00:00.000+07:00");

/** ISO timestamp `days` before NOW, in the project's +07:00 offset. */
export function daysAgo(days: number): string {
  const shifted = new Date(NOW - days * DAY_MS + 7 * 3_600_000).toISOString().slice(0, 23);
  return `${shifted}+07:00`;
}

interface TerminalOptions {
  readonly status?: "completed" | "cancelled";
  readonly endedDaysAgo: number;
  readonly epicId?: string;
  readonly followUpOf?: string;
}

/** A valid finished task whose end (`completedAt` or `cancelledAt`) was `endedDaysAgo` days before NOW. */
export function terminalTask(id: string, options: TerminalOptions): TaskRecordV3 {
  const endedAt = daysAgo(options.endedDaysAgo);
  const base = {
    id,
    createdAt: daysAgo(options.endedDaysAgo + 1),
    updatedAt: endedAt,
    ...(options.epicId === undefined ? {} : { epicId: options.epicId }),
    ...(options.followUpOf === undefined ? {} : { followUpOf: options.followUpOf }),
  };
  if (options.status === "cancelled")
    return buildTaskV3({
      ...base,
      status: "cancelled",
      checkpoint: "cancelling",
      cancellation: { reason: "Người dùng dừng task.", authorizedBy: "user" },
      cancelledAt: endedAt,
    });
  return buildTaskV3({
    ...base,
    status: "completed",
    checkpoint: "finishing",
    acceptanceCriteria: [buildCriterion({ status: "met", evidenceIds: ["ev-check"] })],
    evidence: [buildEvidence({ recordedAt: endedAt })],
    completedAt: endedAt,
  });
}

/** An unfinished task in the `planning` state. */
export function openTask(id: string, overrides: Partial<TaskRecordV3> = {}): TaskRecordV3 {
  return buildTaskV3({ id, createdAt: daysAgo(100), updatedAt: daysAgo(100), ...overrides });
}

export async function saveAll(harnixRoot: string, tasks: readonly TaskRecordV3[]): Promise<void> {
  for (const task of tasks) await saveTask(harnixRoot, task);
}
