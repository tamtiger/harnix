import { describe, expect, it, vi } from "vitest";
import { buildCheck, buildCriterion, buildTaskV2 } from "test/support/builders.js";
import { buildCommandlessCheck } from "test/support/tasks-fixtures.js";

import { resumeTask, type TaskResumeDependencies } from "src/core/tasks/task-resume.js";
import type { TaskRecordV2 } from "src/core/tasks/task.js";

describe("task resume", () => {
  it("writes only for an empty active pointer and remains idempotent", async () => {
    const candidate = task("20260826-160000-resume-target", "planning");
    const activate = vi.fn(async () => undefined);
    const dependencies: TaskResumeDependencies = {
      loadCandidate: async () => candidate,
      loadActive: async () => null,
      activate,
    };

    await expect(resumeTask("unused", candidate.id, false, dependencies)).resolves.toMatchObject({
      outcome: "resumed",
      task: { id: candidate.id },
    });
    expect(activate).toHaveBeenCalledWith("unused", candidate.id);

    dependencies.loadActive = async () => candidate;
    activate.mockClear();
    await expect(resumeTask("unused", candidate.id, false, dependencies)).resolves.toMatchObject({
      outcome: "already-active",
    });
    expect(activate).not.toHaveBeenCalled();
  });

  it("previews without writing and rejects terminal candidates or active-task collisions", async () => {
    const candidate = task("20260826-160000-resume-target", "planning");
    const activate = vi.fn(async () => undefined);
    const dependencies: TaskResumeDependencies = {
      loadCandidate: async () => candidate,
      loadActive: async () => null,
      activate,
    };

    await expect(resumeTask("unused", candidate.id, true, dependencies)).resolves.toMatchObject({
      dryRun: true,
      outcome: "would-resume",
    });
    expect(activate).not.toHaveBeenCalled();

    dependencies.loadActive = async () => task("20260826-160001-other-task", "ready");
    await expect(resumeTask("unused", candidate.id, false, dependencies)).rejects.toThrow(
      "Resume cannot replace another active task.",
    );
    expect(activate).not.toHaveBeenCalled();

    dependencies.loadActive = async () => null;
    dependencies.loadCandidate = async () => terminalTask(candidate.id);
    await expect(resumeTask("unused", candidate.id, false, dependencies)).rejects.toThrow(
      "Resume requires an unfinished task.",
    );
    expect(activate).not.toHaveBeenCalled();
  });

  it("allows replacing another active task when force is true", async () => {
    const candidate = task("20260826-160000-resume-target", "planning");
    const otherActive = task("20260826-160001-other-task", "ready");
    const activate = vi.fn(async () => undefined);
    const dependencies: TaskResumeDependencies = {
      loadCandidate: async () => candidate,
      loadActive: async () => otherActive,
      activate,
    };

    await expect(resumeTask("unused", candidate.id, false, dependencies, true)).resolves.toMatchObject({
      outcome: "resumed",
      task: { id: candidate.id },
    });
    expect(activate).toHaveBeenCalledWith("unused", candidate.id);
  });

  it("warns when a validation check references a test file that does not exist", async () => {
    const candidate = {
      ...task("20260826-160000-resume-target", "planning"),
      validationPlan: [
        {
          id: "check-obsolete",
          description: "Runs missing test",
          command: "pnpm vitest run test/unit/deleted.test.ts",
          scope: "focused" as const,
          required: true,
          criterionIds: ["criterion"],
          inputs: ["@task-contract", "test/unit/deleted.test.ts"],
        },
      ],
    };
    const dependencies: TaskResumeDependencies = {
      loadCandidate: async () => candidate,
      loadActive: async () => null,
      activate: async () => undefined,
      fileExists: async () => false,
    };

    const result = await resumeTask("unused", candidate.id, false, dependencies);
    expect(result.outcome).toBe("resumed");
    expect(result.warnings).toBeDefined();
    expect(result.warnings?.some((w) => w.includes("test/unit/deleted.test.ts"))).toBe(true);
  });
});

function task(id: string, status: "planning" | "ready"): TaskRecordV2 {
  return buildTaskV2({
    id,
    title: "private",
    status,
    checkpoint: status === "ready" ? "ready" : "planning",
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
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
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

describe("task resume test-file warnings", () => {
  it("warns about every missing test file even when several inputs are scanned one after another", async () => {
    const candidate = {
      ...task("20260826-160010-warn-target", "planning"),
      validationPlan: [
        buildCheck({
          id: "gate",
          description: "private",
          criterionIds: ["criterion"],
          inputs: ["@task-contract", "test/a.test.ts", "test/b.test.ts"],
          command: "pnpm exec vitest run test/c.test.ts",
        }),
      ],
    };
    const dependencies: TaskResumeDependencies = {
      loadCandidate: async () => candidate,
      loadActive: async () => null,
      activate: vi.fn(async () => undefined),
      fileExists: async () => false,
    };

    const result = await resumeTask("unused", candidate.id, true, dependencies);
    const warnings = (result as { warnings?: string[] }).warnings ?? [];
    expect(warnings).toHaveLength(3);
    for (const name of ["test/a.test.ts", "test/b.test.ts", "test/c.test.ts"]) {
      expect(warnings.some((warning) => warning.includes(name))).toBe(true);
    }
  });
});
