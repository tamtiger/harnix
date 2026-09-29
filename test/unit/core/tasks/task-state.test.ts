import { describe, expect, it } from "vitest";
import { createLearningCandidate, isPromotionEligible } from "src/core/journal/learning.js";
import { promotionProposal } from "src/core/journal/promotion.js";
import {
  archiveTask,
  cancelTask,
  clearActiveTask,
  resolveActiveTask,
  saveTask,
  setActiveTask,
  transitionTask,
  validateTask,
} from "src/core/tasks/task.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { laterTimestamp, taskFixture, timestamp } from "test/support/tasks-fixtures.js";

const temporaryRepository = useTemporaryRepositories();

describe("task state transitions", () => {
  it("applies task transitions and learning threshold", async () => {
    const task = validateTask(taskFixture());
    expect(transitionTask(task, "ready", "ready").status).toBe("ready");
    const root = await temporaryRepository();
    await saveTask(root, task);
    await setActiveTask(root, task.id);
    expect((await resolveActiveTask(root))?.id).toBe(task.id);
    await clearActiveTask(root, task.id);
    expect(await resolveActiveTask(root)).toBeUndefined();
    const candidate = createLearningCandidate({
      id: "l",
      statement: "x",
      sourceTaskIds: ["b", "a", "a"],
      evidenceIds: ["e2", "e1"],
      status: "candidate",
    });
    expect(candidate.occurrences).toBe(2);
    expect(isPromotionEligible(candidate)).toBe(true);
    expect(promotionProposal(candidate, "spec/guide.md").content).toContain("Evidence: e1, e2");
  });

  it("requires blocked tasks to resume to the recorded status", () => {
    const task = taskFixture();
    const blocked = {
      ...task,
      status: "blocked" as const,
      blocker: { kind: "repository" as const, summary: "x", nextAction: "x", resumeStatus: "in_progress" as const },
    };
    expect(() => transitionTask(blocked, "ready", "ready")).toThrow("recorded status");
    expect(transitionTask(blocked, "in_progress", "implementing").status).toBe("in_progress");
  });

  it("should_record_blocker_when_transitioning_from_an_active_state", () => {
    const task = taskFixture();
    const blocker = {
      kind: "external" as const,
      summary: "Waiting for upstream",
      nextAction: "Retry after the upstream incident",
      resumeStatus: "planning" as const,
    };

    const blocked = transitionTask(task, "blocked", "planning", undefined, blocker);

    expect(blocked).toMatchObject({ status: "blocked", checkpoint: "planning", blocker });
    expect(transitionTask(blocked, "planning", "planning").blocker).toBeUndefined();
  });

  it("cancels any unfinished task with explicit user authority and preserves its evidence", async () => {
    const root = await temporaryRepository();
    const planning = taskFixture();
    planning.evidence.push({
      id: "failed-check",
      recordedAt: timestamp,
      result: "fail",
      exitCode: 1,
      summary: "MongoDB permission denied",
      artifactPaths: [],
    });
    const blocked = transitionTask(planning, "blocked", "planning", timestamp, {
      kind: "credential",
      summary: "Missing test credential",
      nextAction: "Provide an isolated test connection",
      resumeStatus: "planning",
    });

    const cancelled = cancelTask(
      blocked,
      { reason: "Người dùng chọn dừng task để chuyển ưu tiên.", authorizedBy: "user" },
      laterTimestamp,
    );

    expect(cancelled).toMatchObject({
      status: "cancelled",
      checkpoint: "cancelling",
      cancelledAt: laterTimestamp,
      cancellation: { reason: "Người dùng chọn dừng task để chuyển ưu tiên.", authorizedBy: "user" },
      evidence: [{ id: "failed-check", result: "fail" }],
    });
    expect(cancelled.blocker).toBeUndefined();
    expect(() => transitionTask(planning, "cancelled", "cancelling", laterTimestamp)).toThrow(
      /illegal task transition/iu,
    );
    expect(() => transitionTask(cancelled, "planning", "planning", laterTimestamp)).toThrow(/cancelled|transition/iu);

    await saveTask(root, cancelled);
    await setActiveTask(root, cancelled.id);
    await archiveTask(root, cancelled);
    expect(await resolveActiveTask(root)).toBeUndefined();
  });

  it("rejects cancellation without a concise reason and rejects cancellation of completed tasks", () => {
    const planning = taskFixture();
    expect(() => cancelTask(planning, { reason: "", authorizedBy: "user" }, laterTimestamp)).toThrow(/reason/iu);

    const ready = transitionTask(planning, "ready", "ready", timestamp);
    const inProgress = transitionTask(ready, "in_progress", "implementing", timestamp);
    const verifying = transitionTask(inProgress, "verifying", "verifying", timestamp);
    const completed = transitionTask(
      {
        ...verifying,
        acceptanceCriteria: [
          { ...verifying.acceptanceCriteria[0]!, status: "waived", waiverReason: "Explicitly not applicable." },
        ],
      },
      "completed",
      "finishing",
      timestamp,
    );
    expect(() => cancelTask(completed, { reason: "Too late", authorizedBy: "user" }, laterTimestamp)).toThrow(
      /completed|terminal/iu,
    );
  });
});
