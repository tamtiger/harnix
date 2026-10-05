import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { inspectWorkflow } from "src/core/workflow/inspect.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { transitionWorkflow } from "src/core/workflow/transition.js";
import { saveTask, setActiveTask, transitionTask } from "src/core/tasks/task.js";
import { implementingTaskV3, initializeUtcProject, taskV3, routingTask } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow transition out of blocked", () => {
  async function blockedProject() {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    await saveWorkflow(root, {
      task: {
        ...planning,
        status: "blocked",
        checkpoint: "planning",
        blocker: { kind: "decision", summary: "Waiting", nextAction: "Ask", resumeStatus: "planning" },
        updatedAt: "2026-08-13T00:01:00.000Z",
      },
    });
    return root;
  }

  it("resumes a blocked task to its recorded status without a hand-built save and drops the blocker", async () => {
    const root = await blockedProject();

    const resumed = await transitionWorkflow(root, "planning", "planning");

    expect(resumed).toMatchObject({ status: "planning", checkpoint: "planning" });
    expect("blocker" in resumed).toBe(false);
    expect((await inspectWorkflow(root)).activeTask).toMatchObject({ status: "planning" });
  });

  it("refuses to resume anywhere but the recorded status and keeps the task blocked", async () => {
    const root = await blockedProject();

    await expect(transitionWorkflow(root, "ready", "ready")).rejects.toThrow("recorded status");
    await expect(transitionWorkflow(root, "in_progress", "implementing")).rejects.toThrow("recorded status");
    expect((await inspectWorkflow(root)).activeTask).toMatchObject({ status: "blocked" });
  });

  it("refuses a blocker from verifying that would resume at planning, the way around the freeze", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const verifying = taskV3("verifying", "verifying");
    await saveWorkflow(root, { task: taskV3("planning", "planning") });
    await saveWorkflow(root, { task: { ...taskV3("ready", "ready"), updatedAt: "2026-08-13T00:01:00.000Z" } });
    await saveWorkflow(root, {
      task: { ...taskV3("in_progress", "implementing"), updatedAt: "2026-08-13T00:02:00.000Z" },
    });
    await saveWorkflow(root, { task: { ...verifying, updatedAt: "2026-08-13T00:03:00.000Z" } });

    await expect(
      saveWorkflow(root, {
        task: {
          ...verifying,
          status: "blocked",
          checkpoint: "planning",
          blocker: { kind: "decision", summary: "x", nextAction: "y", resumeStatus: "planning" },
          updatedAt: "2026-08-13T00:04:00.000Z",
        },
      }),
    ).rejects.toThrow("status the task was in");
  });
});

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

  it("should validate ready transition and advise about unbaselined checks in dry-run without persisting", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });

    const dryRunResult = await transitionWorkflow(root, "ready", "ready", undefined, true);

    expect(dryRunResult).toMatchObject({
      dryRun: true,
      valid: true,
      issues: [],
      target: { status: "ready", checkpoint: "ready" },
    });
    expect(dryRunResult.advisories.some((issue) => issue.includes("has not been baselined"))).toBe(true);
    // Verify state was not persisted to disk
    await expect(inspectWorkflow(root)).resolves.toMatchObject({
      activeTask: { status: "planning", checkpoint: "planning" },
    });
  });

  it("should accept dry-run ready transition when check has baseline waiver", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(join(root, "src", "index.ts"), "export const a = 1;\n");
    const planning = {
      ...taskV3("planning", "planning"),
      validationPlan: [
        {
          id: "check",
          description: "Unit tests",
          scope: "focused" as const,
          required: true,
          command: "pnpm test",
          criterionIds: ["a"],
          inputs: ["src/**"],
          baseline: {
            result: "fail" as const,
            classification: "pre-existing" as const,
            authorizedBy: "user",
          },
        },
      ],
    };
    await saveWorkflow(root, { task: planning });

    const dryRunResult = await transitionWorkflow(root, "ready", "ready", undefined, true);

    expect(dryRunResult).toMatchObject({
      dryRun: true,
      valid: true,
      target: { status: "ready", checkpoint: "ready" },
      issues: [],
    });
  });

  it("should report non-matching input globs as an advisory during dry-run ready transition", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = {
      ...taskV3("planning", "planning"),
      validationPlan: [
        {
          id: "check",
          description: "Unit tests",
          scope: "focused" as const,
          required: true,
          command: "pnpm test",
          criterionIds: ["a"],
          inputs: ["nonexistent-folder/**"],
          baseline: {
            result: "pass" as const,
            authorizedBy: "user",
          },
        },
      ],
    };
    await saveWorkflow(root, { task: planning });

    const dryRunResult = await transitionWorkflow(root, "ready", "ready", undefined, true);

    expect(dryRunResult).toMatchObject({ dryRun: true, valid: true, issues: [] });
    expect(dryRunResult.advisories.some((issue) => issue.includes("matches no files"))).toBe(true);
  });
});

describe("leaving the replan checkpoint", () => {
  async function replanned(status: "planning" | "in_progress") {
    const root = await temporaryRepository();
    if (status === "in_progress") {
      const running = await implementingTaskV3(root);
      await saveWorkflow(root, { task: { ...running, checkpoint: "replan", updatedAt: "2026-08-13T00:03:00.000Z" } });
    } else {
      await initializeUtcProject(root);
      const planning = taskV3("planning", "planning");
      await saveWorkflow(root, { task: planning });
      await saveWorkflow(root, { task: { ...planning, checkpoint: "replan", updatedAt: "2026-08-13T00:01:00.000Z" } });
    }
    return root;
  }

  it("refuses to go from in_progress/replan straight back to implementing, for real and in a dry-run", async () => {
    const root = await replanned("in_progress");

    await expect(transitionWorkflow(root, "in_progress", "implementing")).rejects.toThrow(
      /may only re-enter ready\/ready/u,
    );
    await expect(transitionWorkflow(root, "in_progress", "implementing", undefined, true)).resolves.toMatchObject({
      valid: false,
    });
    await expect(transitionWorkflow(root, "verifying", "verifying")).rejects.toThrow(/replan/u);
    expect((await inspectWorkflow(root)).activeTask).toMatchObject({ status: "in_progress", checkpoint: "replan" });
  });

  it("re-enters ready/ready through the ready gate and from there continues normally", async () => {
    const root = await replanned("in_progress");

    await expect(transitionWorkflow(root, "ready", "ready", undefined, true)).resolves.toMatchObject({ valid: true });
    await expect(transitionWorkflow(root, "ready", "ready")).resolves.toMatchObject({ status: "ready" });
    await expect(transitionWorkflow(root, "in_progress", "implementing")).resolves.toMatchObject({
      status: "in_progress",
      checkpoint: "implementing",
    });
  });

  it("lets a task that is still planning return to planning/planning", async () => {
    const root = await replanned("planning");

    await expect(transitionWorkflow(root, "planning", "planning")).resolves.toMatchObject({ checkpoint: "planning" });
  });
});

describe("a dry-run agrees with the real ready transition", () => {
  const cases: [string, (task: ReturnType<typeof taskV3>) => ReturnType<typeof taskV3>, boolean][] = [
    ["a complete Lite task", (task) => task, true],
    ["a task with no acceptance criterion", (task) => ({ ...task, acceptanceCriteria: [], validationPlan: [] }), false],
    ["a Full task without prd.md and plan.md", (task) => ({ ...task, mode: "full" as const }), false],
    [
      "a task whose input glob matches nothing (advisory only)",
      (task) => ({ ...task, validationPlan: [{ ...task.validationPlan[0]!, inputs: ["nowhere/**"] }] }),
      true,
    ],
  ];

  it.each(cases)("%s", async (_name, shape, accepted) => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = shape(taskV3("planning", "planning"));
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, planning);
    await setActiveTask(harnixRoot, planning.id);

    const dryRun = await transitionWorkflow(root, "ready", "ready", undefined, true);
    const real = transitionWorkflow(root, "ready", "ready");

    expect(dryRun.valid).toBe(accepted);
    if (accepted) await expect(real).resolves.toMatchObject({ status: "ready" });
    else await expect(real).rejects.toThrow();
  });
});
