import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { saveTask, setActiveTask, resolveActiveTask } from "src/core/tasks/task.js";
import { cancelWorkflow } from "src/core/workflow/cancel.js";
import { finishWorkflow } from "src/core/workflow/finish.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { withWorkflowLock } from "src/core/workflow/workflow-lock.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { finishingTask, initializeUtcProject, taskV3, timestamp } from "test/support/workflow-fixtures.js";

const temporaryRepository = useTemporaryRepositories();
const SETTLE_MS = 300;

/** Resolves "pending" when the promise has not settled within the window, otherwise the settled state. */
async function stateAfterWindow(promise: Promise<unknown>): Promise<"pending" | "settled"> {
  const pending = Symbol("pending");
  const outcome = await Promise.race([
    promise.then(
      () => "settled" as const,
      () => "settled" as const,
    ),
    new Promise<typeof pending>((resolve) => setTimeout(() => resolve(pending), SETTLE_MS)),
  ]);
  return outcome === pending ? "pending" : outcome;
}

describe("withWorkflowLock", () => {
  it("serializes critical sections of the same project and returns the section result", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const harnixRoot = join(root, ".harnix");
    const order: string[] = [];

    let started: () => void = () => undefined;
    const firstStarted = new Promise<void>((resolve) => (started = resolve));
    const first = withWorkflowLock(harnixRoot, async () => {
      order.push("first:start");
      started();
      await new Promise((resolve) => setTimeout(resolve, 150));
      order.push("first:end");
      return 1;
    });
    await firstStarted;
    const second = withWorkflowLock(harnixRoot, () => {
      order.push("second:start");
      return Promise.resolve(2);
    });

    await expect(Promise.all([first, second])).resolves.toEqual([1, 2]);
    expect(order).toEqual(["first:start", "first:end", "second:start"]);
  });

  it("releases the lock when the critical section throws", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const harnixRoot = join(root, ".harnix");

    await expect(withWorkflowLock(harnixRoot, () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    await expect(withWorkflowLock(harnixRoot, () => Promise.resolve("again"))).resolves.toBe("again");
  });
});

describe("terminal transports hold the workflow lock", () => {
  it("--cancel waits for a save in progress instead of overwriting it", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await saveWorkflow(root, { task: taskV3("planning", "planning") });
    const harnixRoot = join(root, ".harnix");
    let release: () => void = () => undefined;
    const held = withWorkflowLock(harnixRoot, () => new Promise<void>((resolve) => (release = resolve)));

    const cancelling = cancelWorkflow(root, { reason: "Người dùng dừng task.", authorizedBy: "user" }, timestamp);

    await expect(stateAfterWindow(cancelling)).resolves.toBe("pending");
    release();
    await held;
    await expect(cancelling).resolves.toMatchObject({ status: "cancelled" });
  });

  it("--finish waits for a save in progress and then judges the task as it is under the lock", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const task = await finishingTask(root, new Date(Date.now() - 60_000).toISOString());
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, task);
    await setActiveTask(harnixRoot, task.id);
    let release: () => void = () => undefined;
    const held = withWorkflowLock(harnixRoot, () => new Promise<void>((resolve) => (release = resolve)));

    const finishing = finishWorkflow(root);

    await expect(stateAfterWindow(finishing)).resolves.toBe("pending");
    // A failing run lands while the lock is held; finish must see it and refuse to complete over it.
    await saveTask(harnixRoot, {
      ...task,
      evidence: [
        ...task.evidence,
        {
          id: "late-fail",
          checkId: "check",
          recordedAt: new Date().toISOString(),
          result: "fail",
          exitCode: 1,
          summary: "regressed",
          artifactPaths: [],
        },
      ],
    });
    release();
    await held;

    await expect(finishing).rejects.toThrow();
    expect((await resolveActiveTask(harnixRoot))?.status).toBe("verifying");
  });
});
