import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cancelWorkflow, cancelWorkflowTask } from "src/core/workflow/cancel.js";
import { inspectWorkflow } from "src/core/workflow/inspect.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { appendJournal } from "src/core/journal/journal.js";
import { cancelTask, saveTask, setActiveTask, loadTask, resolveActiveTask } from "src/core/tasks/task.js";
import {
  initializeUtcProject,
  legacyTask as task,
  taskV3,
  timestamp,
  routingTask,
} from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow cancel", () => {
  it("cancels an active task through the hidden transport and writes its cancellation journal", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    planning.evidence = [
      { id: "failed", recordedAt: timestamp, result: "fail", exitCode: 1, summary: "blocked", artifactPaths: [] },
    ];
    await saveWorkflow(root, { task: planning });

    await expect(
      cancelWorkflow(root, { reason: "Người dùng dừng task.", authorizedBy: "user" }, timestamp),
    ).resolves.toMatchObject({
      status: "cancelled",
      checkpoint: "cancelling",
      cancelledAt: timestamp,
    });
    expect(await inspectWorkflow(root)).toEqual({
      activeTask: null,
      contextDrift: { state: "not-recorded", changes: [], selectionChanges: [] },
    });
    const journal = await readFile(join(root, ".harnix", "workspace", "tam", "journal", "2026-08-13.jsonl"), "utf8");
    expect(journal).toContain('"kind":"cancellation"');
    expect(journal).toContain('"failed"');
  });

  it("requires workflow --cancel instead of allowing save to forge a cancelled task", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    await expect(
      saveWorkflow(root, {
        task: {
          ...planning,
          status: "cancelled",
          checkpoint: "cancelling",
          cancellation: { reason: "forged", authorizedBy: "user" },
          cancelledAt: "2026-08-13T00:01:00.000Z",
          updatedAt: "2026-08-13T00:01:00.000Z",
        },
      }),
    ).rejects.toThrow(/workflow --cancel/iu);
  });

  it("recovers a cancelled task into its original journal date across a UTC day boundary", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const cancelledAt = "2026-08-13T23:59:59.000Z";
    const retryAt = "2026-08-14T00:00:01.000Z";
    const cancelled = cancelTask(
      task("planning", "planning"),
      { reason: "Stop safely", authorizedBy: "user" },
      cancelledAt,
    );
    const harnixRoot = join(root, ".harnix");
    await saveTask(harnixRoot, cancelled);
    await setActiveTask(harnixRoot, cancelled.id);

    await expect(cancelWorkflow(root, undefined, retryAt)).resolves.toMatchObject({ status: "cancelled", cancelledAt });

    const originalJournal = join(harnixRoot, "workspace", "tam", "journal", "2026-08-13.jsonl");
    const retryJournal = join(harnixRoot, "workspace", "tam", "journal", "2026-08-14.jsonl");
    await expect(readFile(originalJournal, "utf8")).resolves.toContain(`${cancelled.id}-cancellation`);
    await expect(readFile(retryJournal, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    expect(await inspectWorkflow(root)).toEqual({
      activeTask: null,
      contextDrift: { state: "not-recorded", changes: [], selectionChanges: [] },
    });
  });

  it("cancels without completion evidence and journals the preserved failure before clearing the active pointer", async () => {
    const root = await temporaryRepository();
    const current = new Date().toISOString();
    const failing = {
      ...routingTask(current),
      status: "blocked" as const,
      checkpoint: "verifying" as const,
      acceptanceCriteria: [{ id: "a", text: "done", status: "pending" as const, evidenceIds: [] }],
      evidence: [
        {
          id: "mongo-failure",
          checkId: "check",
          recordedAt: current,
          result: "fail" as const,
          exitCode: 1,
          summary: "createIndexes denied",
          artifactPaths: [],
        },
      ],
      blocker: {
        kind: "credential" as const,
        summary: "Missing MongoDB test permissions",
        nextAction: "Provide an isolated test connection",
        resumeStatus: "verifying" as const,
      },
    };
    await saveTask(root, failing);
    await setActiveTask(root, failing.id);

    const cancelled = await cancelWorkflowTask(
      root,
      join(root, "journal.jsonl"),
      "tam",
      failing,
      { reason: "Người dùng chọn dừng task.", authorizedBy: "user" },
      current,
    );

    expect(cancelled).toMatchObject({
      status: "cancelled",
      checkpoint: "cancelling",
      cancellation: { authorizedBy: "user" },
    });
    expect(await resolveActiveTask(root)).toBeUndefined();
    const journal = await readFile(join(root, "journal.jsonl"), "utf8");
    expect(journal).toContain('"kind":"cancellation"');
    expect(journal).toContain('"mongo-failure"');
    expect(journal).not.toContain('"kind":"completion"');
  });

  it("recovers cancelled persistence idempotently after active-pointer cleanup fails", async () => {
    const root = await temporaryRepository();
    const current = new Date().toISOString();
    const active = routingTask(current);
    const calls: string[] = [];
    await saveTask(root, active);
    await setActiveTask(root, active.id);

    await expect(
      cancelWorkflowTask(
        root,
        join(root, "journal.jsonl"),
        "tam",
        active,
        { reason: "Stop safely", authorizedBy: "user" },
        current,
        {
          saveTask: async (...args) => {
            calls.push("save");
            await saveTask(...args);
          },
          appendJournal: async (...args) => {
            calls.push("journal");
            await appendJournal(...args);
          },
          archiveTask: async () => {
            calls.push("archive");
            throw new Error("active pointer write failed");
          },
        },
      ),
    ).rejects.toThrow("active pointer write failed");
    expect(calls).toEqual(["save", "journal", "archive"]);

    const persisted = await loadTask(join(root, "tasks", active.id, "task.json"));
    expect(persisted.status).toBe("cancelled");
    expect((await resolveActiveTask(root))?.id).toBe(active.id);

    await cancelWorkflowTask(
      root,
      join(root, "journal.jsonl"),
      "tam",
      persisted,
      undefined,
      new Date(Date.parse(current) + 86_400_000).toISOString(),
    );
    expect(await resolveActiveTask(root)).toBeUndefined();
    const entries = (await readFile(join(root, "journal.jsonl"), "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { id: string });
    expect(entries.filter((entry) => entry.id === `${active.id}-cancellation`)).toHaveLength(1);
  });
});
