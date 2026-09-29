import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { inspectWorkflow } from "src/core/workflow/inspect.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { saveTask, setActiveTask } from "src/core/tasks/task.js";
import { sha256 } from "src/utils/hashing.js";
import { continueWorkflowTask } from "src/core/workflow/context.js";
import { initializeUtcProject, taskV3, routingTask } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow context", () => {
  it("projects stale context drift from the persisted manifest without mutating it", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    await writeFile(join(root, "tracked.md"), "new content");
    const contextPath = join(root, ".harnix", "tasks", planning.id, "context.json");
    const context = {
      generator: "harnix",
      schemaVersion: 1,
      taskId: planning.id,
      maxCharacters: 1000,
      entries: [
        {
          path: "tracked.md",
          reason: "test",
          priority: 0,
          pinned: false,
          states: [],
          contentHash: sha256("old content"),
        },
      ],
      omitted: [],
    };
    await writeFile(contextPath, `${JSON.stringify(context, null, 2)}\n`);

    await expect(inspectWorkflow(root)).resolves.toMatchObject({
      contextDrift: { state: "stale", changes: [{ path: "tracked.md", kind: "changed" }] },
    });
    await expect(readFile(contextPath, "utf8")).resolves.toBe(`${JSON.stringify(context, null, 2)}\n`);
  });

  it("persists selection freshness and reports task or inventory drift without refreshing the repo map", async () => {
    const root = await temporaryRepository();
    await writeFile(join(root, "tracked.md"), "tracked content");
    await initializeUtcProject(root);
    const planning = { ...taskV3("planning", "planning"), relevantPaths: ["tracked.md"] };
    const context = {
      generator: "harnix" as const,
      schemaVersion: 1 as const,
      taskId: planning.id,
      maxCharacters: 1000,
      entries: [
        {
          path: "tracked.md",
          reason: "test",
          priority: 0,
          pinned: false,
          states: [],
          contentHash: sha256("tracked content"),
        },
      ],
      omitted: [],
    };

    await saveWorkflow(root, { task: planning, artifacts: { context } });
    await expect(inspectWorkflow(root)).resolves.toMatchObject({
      contextDrift: { state: "current", changes: [], selectionChanges: [] },
    });
    const selectionPath = join(root, ".harnix", "tasks", planning.id, "context-selection.json");
    await expect(readFile(selectionPath, "utf8")).resolves.not.toContain("tracked content");

    const changedSignals = { ...planning, relevantPaths: ["docs/**"], updatedAt: "2026-08-13T00:01:00.000Z" };
    await saveWorkflow(root, { task: changedSignals });
    await expect(inspectWorkflow(root)).resolves.toMatchObject({
      contextDrift: { state: "stale", changes: [], selectionChanges: ["selection-signals-changed"] },
    });

    await saveWorkflow(root, { task: { ...planning, updatedAt: "2026-08-13T00:02:00.000Z" } });
    await rm(join(root, ".harnix", "cache", "repo-map-v1.json"));
    await expect(inspectWorkflow(root)).resolves.toMatchObject({
      contextDrift: { state: "stale", changes: [], selectionChanges: ["inventory-unavailable"] },
    });

    await writeFile(selectionPath, "not-json");
    const corrupt = await inspectWorkflow(root).then(
      () => undefined,
      (error: unknown) => error as Error,
    );
    expect(corrupt?.message).toBe("Context selection snapshot is unreadable or invalid.");
    expect(corrupt?.message).not.toContain(root);
  });

  it("refuses missing-pointer replay when a persisted context selection pair is incomplete", async () => {
    const root = await temporaryRepository();
    await writeFile(join(root, "tracked.md"), "tracked content");
    await initializeUtcProject(root);
    const planning = { ...taskV3("planning", "planning"), relevantPaths: ["tracked.md"] };
    const context = {
      generator: "harnix" as const,
      schemaVersion: 1 as const,
      taskId: planning.id,
      maxCharacters: 1000,
      entries: [
        {
          path: "tracked.md",
          reason: "test",
          priority: 0,
          pinned: false,
          states: [],
          contentHash: sha256("tracked content"),
        },
      ],
      omitted: [],
    };
    await saveWorkflow(root, { task: planning, artifacts: { context } });
    await rm(join(root, ".harnix", "tasks", planning.id, "context-selection.json"));
    await rm(join(root, ".harnix", "tasks", ".active"));

    await expect(saveWorkflow(root, { task: planning })).rejects.toThrow(
      /complete context\.json.*context-selection\.json pair/iu,
    );
    await expect(readFile(join(root, ".harnix", "tasks", ".active"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("continues from persisted active state with minimum deduplicated context", async () => {
    const root = await temporaryRepository();
    const active = {
      ...routingTask(new Date().toISOString()),
      relevantPaths: ["b", "a"],
      relevantSpecs: ["a", "spec"],
    };
    await saveTask(root, active);
    await setActiveTask(root, active.id);
    expect(await continueWorkflowTask(root)).toMatchObject({
      contextPaths: ["a", "b", "spec"],
      contextDrift: { state: "not-recorded", changes: [] },
    });
  });
});
