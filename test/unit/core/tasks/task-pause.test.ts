import { describe, expect, it, vi } from "vitest";
import { buildCriterion, buildTaskV2 } from "test/support/builders.js";
import { buildCommandlessCheck } from "test/support/tasks-fixtures.js";

import { pauseTask, type TaskPauseDependencies } from "src/core/tasks/task-pause.js";
import type { TaskRecordV2 } from "src/core/tasks/task.js";

describe("task pause", () => {
  it("clears the active pointer when a task is active and reports paused outcome", async () => {
    const active = task("20260928-144800-active-task", "in_progress");
    const deactivate = vi.fn(async () => undefined);
    const dependencies: TaskPauseDependencies = {
      loadActive: async () => active,
      deactivate,
    };

    const result = await pauseTask("unused", false, dependencies);
    expect(result).toMatchObject({
      outcome: "paused",
      dryRun: false,
      task: { id: active.id, status: active.status },
      nextAction: {
        code: "resume-guidance",
      },
    });
    expect(result.nextAction.message).toContain(active.id);
    expect(deactivate).toHaveBeenCalledWith("unused", active.id);
  });

  it("previews without writing in dry-run mode", async () => {
    const active = task("20260928-144800-active-task", "planning");
    const deactivate = vi.fn(async () => undefined);
    const dependencies: TaskPauseDependencies = {
      loadActive: async () => active,
      deactivate,
    };

    const result = await pauseTask("unused", true, dependencies);
    expect(result).toMatchObject({
      outcome: "would-pause",
      dryRun: true,
      task: { id: active.id, status: active.status },
    });
    expect(deactivate).not.toHaveBeenCalled();
  });

  it("handles case where no task is active cleanly without error", async () => {
    const deactivate = vi.fn(async () => undefined);
    const dependencies: TaskPauseDependencies = {
      loadActive: async () => null,
      deactivate,
    };

    const result = await pauseTask("unused", false, dependencies);
    expect(result).toMatchObject({
      outcome: "no-active-task",
      dryRun: false,
      task: null,
      nextAction: {
        code: "no-action-needed",
      },
    });
    expect(deactivate).not.toHaveBeenCalled();
  });

  it("fails closed when active task is in terminal status", async () => {
    const active = terminalTask("20260928-144800-terminal-task");
    const deactivate = vi.fn(async () => undefined);
    const dependencies: TaskPauseDependencies = {
      loadActive: async () => active,
      deactivate,
    };

    await expect(pauseTask("unused", false, dependencies)).rejects.toThrow(
      "Active task state is unavailable; run harnix doctor.",
    );
    expect(deactivate).not.toHaveBeenCalled();
  });
});

function task(id: string, status: "planning" | "ready" | "in_progress"): TaskRecordV2 {
  return buildTaskV2({
    id,
    title: "private",
    status,
    checkpoint: status === "ready" ? "ready" : status === "in_progress" ? "implementing" : "planning",
    goal: "private",
    acceptanceCriteria: [buildCriterion({ id: "criterion", text: "private" })],
    validationPlan: [
      buildCommandlessCheck({
        id: "gate",
        description: "private",
        criterionIds: ["criterion"],
        inputs: ["@task-contract"],
      }),
    ],
    createdAt: "2026-09-28T00:00:00.000Z",
    updatedAt: "2026-09-28T00:00:00.000Z",
  });
}

function terminalTask(id: string): TaskRecordV2 {
  const base = task(id, "planning");
  return {
    ...base,
    status: "completed",
    checkpoint: "finishing",
    acceptanceCriteria: [{ ...base.acceptanceCriteria[0]!, status: "waived", waiverReason: "Not needed." }],
    completedAt: base.updatedAt,
  };
}
