import { describe, expect, it, vi } from "vitest";

import { resumeTask, type TaskResumeDependencies } from "../../src/core/tasks/task-resume.js";
import type { TaskRecordV2 } from "../../src/core/tasks/task.js";

describe("task resume", () => {
  it("writes only for an empty active pointer and remains idempotent", async () => {
    const candidate = task("20260826-160000-resume-target", "planning");
    const activate = vi.fn(async () => undefined);
    const dependencies: TaskResumeDependencies = {
      loadCandidate: async () => candidate,
      loadActive: async () => null,
      activate,
    };

    await expect(resumeTask("unused", candidate.id, false, dependencies)).resolves.toMatchObject({ outcome: "resumed", task: { id: candidate.id } });
    expect(activate).toHaveBeenCalledWith("unused", candidate.id);

    dependencies.loadActive = async () => candidate;
    activate.mockClear();
    await expect(resumeTask("unused", candidate.id, false, dependencies)).resolves.toMatchObject({ outcome: "already-active" });
    expect(activate).not.toHaveBeenCalled();
  });

  it("previews without writing and rejects terminal candidates or active-task collisions", async () => {
    const candidate = task("20260826-160000-resume-target", "planning");
    const activate = vi.fn(async () => undefined);
    const dependencies: TaskResumeDependencies = { loadCandidate: async () => candidate, loadActive: async () => null, activate };

    await expect(resumeTask("unused", candidate.id, true, dependencies)).resolves.toMatchObject({ dryRun: true, outcome: "would-resume" });
    expect(activate).not.toHaveBeenCalled();

    dependencies.loadActive = async () => task("20260826-160001-other-task", "ready");
    await expect(resumeTask("unused", candidate.id, false, dependencies)).rejects.toThrow("Resume cannot replace another active task.");
    expect(activate).not.toHaveBeenCalled();

    dependencies.loadActive = async () => null;
    dependencies.loadCandidate = async () => terminalTask(candidate.id);
    await expect(resumeTask("unused", candidate.id, false, dependencies)).rejects.toThrow("Resume requires an unfinished task.");
    expect(activate).not.toHaveBeenCalled();
  });
});

function task(id: string, status: "planning" | "ready"): TaskRecordV2 {
  const timestamp = "2026-08-26T00:00:00.000Z";
  return {
    generator: "harnix",
    schemaVersion: 2,
    id,
    title: "private",
    mode: "lite",
    status,
    checkpoint: status === "ready" ? "ready" : "planning",
    goal: "private",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "private", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [{ id: "gate", description: "private", scope: "focused", required: true, criterionIds: ["criterion"], inputs: ["@task-contract"] }],
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
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
