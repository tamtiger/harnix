import { describe, expect, it } from "vitest";
import { inspectWorkflow } from "src/core/workflow/inspect.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { transitionWorkflow } from "src/core/workflow/transition.js";
import { transitionTask } from "src/core/tasks/task.js";
import { initializeUtcProject, taskV3, routingTask } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow transition", () => {
  it("should_transition_the_active_task_without_a_task_body_and_preserve_evidence", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const ready = {
      ...planning,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: ready });
    const working = {
      ...ready,
      status: "in_progress" as const,
      checkpoint: "implementing" as const,
      updatedAt: "2026-08-13T00:02:00.000Z",
      evidence: [
        {
          id: "red-check",
          checkId: "check",
          recordedAt: "2026-08-13T00:02:00.000Z",
          result: "fail" as const,
          exitCode: 1,
          summary: "RED",
          artifactPaths: [],
        },
      ],
    };
    await saveWorkflow(root, { task: working });

    const transitioned = await transitionWorkflow(root, "verifying", "verifying");

    expect(transitioned.status).toBe("verifying");
    expect(transitioned.checkpoint).toBe("verifying");
    expect(transitioned.evidence).toHaveLength(1);
    expect(transitioned.evidence[0]?.id).toBe("red-check");
    expect(transitioned.acceptanceCriteria).toEqual(working.acceptanceCriteria);
    expect(transitioned.validationPlan).toEqual(working.validationPlan);
    await expect(inspectWorkflow(root)).resolves.toMatchObject({
      activeTask: { status: "verifying", checkpoint: "verifying" },
    });
  });

  it("should_reject_an_illegal_transition_and_a_missing_active_task", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);

    await expect(transitionWorkflow(root, "verifying", "verifying")).rejects.toThrow(/active task/u);

    await saveWorkflow(root, { task: taskV3("planning", "planning") });

    await expect(transitionWorkflow(root, "completed", "finishing")).rejects.toThrow();
    await expect(transitionWorkflow(root, "cancelled", "cancelling")).rejects.toThrow(/--cancel/u);
    await expect(inspectWorkflow(root)).resolves.toMatchObject({
      activeTask: { status: "planning", checkpoint: "planning" },
    });
  });

  it("should_clear_blocker_when_blocked_task_resumes", () => {
    const current = {
      ...routingTask("2026-08-07T09:30:00Z"),
      status: "blocked" as const,
      blocker: {
        kind: "repository" as const,
        summary: "locked",
        nextAction: "retry",
        resumeStatus: "verifying" as const,
      },
    };
    expect(transitionTask(current, "verifying", "verifying").blocker).toBeUndefined();
  });
});
