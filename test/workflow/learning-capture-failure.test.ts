import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { inspectWorkflow } from "src/commands/internal-workflow.js";
import { createTestProject } from "test/support/builders.js";
import { completeTaskWithDecisions } from "test/support/learning-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-learning-failure-");

describe("finish when learning capture fails", () => {
  it("still completes the task, keeps the completion journal entry and clears the pointer", async () => {
    const root = await createTestProject(await temporaryRepository());
    const id = "20260929-090000-learn-a";

    // An injected capture, not vi.mock: with isolate: false a module mock would leak into later files of the worker.
    const exploding = () => Promise.reject(new Error("capture exploded"));
    await completeTaskWithDecisions(
      root,
      { id, minute: 0, decisions: ["Always inject the clock in tests"] },
      { captureLearning: exploding },
    );

    const task = JSON.parse(await readFile(join(root, ".harnix", "tasks", id, "task.json"), "utf8")) as {
      status: string;
    };
    const journal = await readFile(join(root, ".harnix", "workspace", "tam", "journal", "2026-09-29.jsonl"), "utf8");
    expect(task.status).toBe("completed");
    expect(journal).toContain(`${id}-completion`);
    expect(journal).not.toContain('"kind":"learning"');
    expect((await inspectWorkflow(root)).activeTask).toBeNull();
  });
});
