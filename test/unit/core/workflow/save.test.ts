import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { inspectWorkflow } from "src/core/workflow/inspect.js";
import { saveWorkflow } from "src/core/workflow/save.js";
import { snapshotWorkflow } from "src/core/workflow/snapshot.js";
import { saveTask, setActiveTask, type TaskRecordV3 } from "src/core/tasks/task.js";
import {
  initializeUtcProject,
  taskV3,
  loadPersistedTask,
  reverseObjectKeys,
  timestamp,
} from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow save", () => {
  it("recovers a missing active pointer when the task commit marker already exists", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    await rm(join(root, ".harnix", "tasks", ".active"));

    await expect(saveWorkflow(root, { task: planning })).resolves.toMatchObject({ id: planning.id });
    await expect(readFile(join(root, ".harnix", "tasks", ".active"), "utf8")).resolves.toBe(`${planning.id}\n`);
  });

  it("treats JSON object-key and validation-check order as non-semantic while preserving evidence order", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = {
      ...taskV3("planning", "planning"),
      acceptanceCriteria: [
        { id: "a", text: "done", status: "pending" as const, evidenceIds: [] },
        { id: "b", text: "also done", status: "pending" as const, evidenceIds: [] },
      ],
      validationPlan: [
        { ...taskV3("planning", "planning").validationPlan[0]!, criterionIds: ["a"] },
        {
          id: "check-2",
          description: "Run second check",
          command: "pnpm test:unit",
          scope: "focused" as const,
          required: true,
          criterionIds: ["b"],
          inputs: ["src/**/*.ts"],
        },
      ],
    };
    await saveWorkflow(root, { task: planning });
    const ready = {
      ...planning,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
    };
    await saveWorkflow(root, { task: ready });
    await expect(
      saveWorkflow(root, {
        task: { ...ready, validationPlan: [...ready.validationPlan].reverse(), updatedAt: "2026-08-13T00:02:00.000Z" },
      }),
    ).resolves.toMatchObject({ status: "ready" });

    await rm(join(root, ".harnix", "tasks", ".active"));
    await expect(
      saveWorkflow(root, { task: reverseObjectKeys(await loadPersistedTask(root, planning.id)) }),
    ).resolves.toMatchObject({ id: planning.id });
  });

  it("does not mutate or activate an inactive task through a non-exact save", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const taskPath = join(root, ".harnix", "tasks", planning.id, "task.json");
    const pointerPath = join(root, ".harnix", "tasks", ".active");
    const before = await readFile(taskPath, "utf8");
    await rm(pointerPath);

    await expect(
      saveWorkflow(root, {
        task: { ...planning, goal: "mutated inactive task", updatedAt: "2026-08-13T00:01:00.000Z" },
      }),
    ).rejects.toThrow(/exact task replay|harnix resume/iu);
    await expect(readFile(taskPath, "utf8")).resolves.toBe(before);
    await expect(readFile(pointerPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects evidence reordering instead of changing retry chronology", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const first = {
      id: "failure-1",
      checkId: "check",
      recordedAt: timestamp,
      result: "fail" as const,
      exitCode: 1,
      summary: "first",
      artifactPaths: [],
    };
    const second = { ...first, id: "failure-2", recordedAt: "2026-08-13T00:01:00.000Z", summary: "second" };
    const persisted = { ...taskV3("planning", "planning"), evidence: [first, second] };
    await saveTask(join(root, ".harnix"), persisted);
    await setActiveTask(join(root, ".harnix"), persisted.id);

    await expect(
      saveWorkflow(root, { task: { ...persisted, evidence: [second, first], updatedAt: "2026-08-13T00:02:00.000Z" } }),
    ).rejects.toThrow(/reorder/iu);
  });

  it("accepts semantically identical evidence objects with reordered properties", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const evidence = {
      id: "failure-1",
      checkId: "check",
      recordedAt: timestamp,
      result: "fail" as const,
      exitCode: 1,
      summary: "first",
      artifactPaths: [],
    };
    const persisted = { ...taskV3("planning", "planning"), evidence: [evidence] };
    await saveTask(join(root, ".harnix"), persisted);
    await setActiveTask(join(root, ".harnix"), persisted.id);

    const reordered = {
      summary: "first",
      artifactPaths: [],
      exitCode: 1,
      result: "fail" as const,
      recordedAt: timestamp,
      checkId: "check",
      id: "failure-1",
    };
    await expect(
      saveWorkflow(root, {
        task: { ...persisted, evidence: [reordered], updatedAt: "2026-08-13T00:01:00.000Z" },
      }),
    ).resolves.toMatchObject({ evidence: [{ id: "failure-1" }] });
  });

  it("serializes concurrent workflow saves so one stale evidence append cannot overwrite another", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const planning = taskV3("planning", "planning");
    await saveWorkflow(root, { task: planning });
    const candidate = (id: string, summary: string): TaskRecordV3 => ({
      ...planning,
      evidence: [{ id, recordedAt: "2026-08-13T00:01:00.000Z", result: "skipped", summary, artifactPaths: [] }],
      updatedAt: "2026-08-13T00:01:00.000Z",
    });

    const outcomes = await Promise.allSettled([
      saveWorkflow(root, { task: candidate("attempt-a", "first concurrent append") }),
      saveWorkflow(root, { task: candidate("attempt-b", "second concurrent append") }),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === "rejected")).toHaveLength(1);
    await expect(inspectWorkflow(root)).resolves.toMatchObject({
      activeTask: { evidence: [expect.objectContaining({ id: expect.stringMatching(/^attempt-[ab]$/u) })] },
    });
  });

  it("inspects, creates a planning task, and rejects evidence mutation or an illegal jump", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    expect(await inspectWorkflow(root)).toEqual({
      activeTask: null,
      contextDrift: { state: "not-recorded", changes: [], selectionChanges: [] },
    });

    await writeFile(join(root, "input.ts"), "export const value = 1;\n");
    const planning = taskV3("planning", "planning", ["input.ts"]);
    await expect(saveWorkflow(root, { task: planning })).resolves.toMatchObject({
      id: planning.id,
      status: "planning",
    });
    expect(await inspectWorkflow(root)).toMatchObject({
      activeTask: { id: planning.id },
      contextDrift: { state: "not-recorded", changes: [] },
    });

    const snapshot = await snapshotWorkflow(root, "check");
    const ready = {
      ...planning,
      status: "ready" as const,
      checkpoint: "ready" as const,
      updatedAt: "2026-08-13T00:01:00.000Z",
      evidence: [
        {
          id: "e",
          checkId: "check",
          recordedAt: timestamp,
          result: "pass" as const,
          exitCode: 0,
          summary: "kept",
          artifactPaths: [],
          inputDigest: snapshot.inputDigest,
        },
      ],
    };
    await saveWorkflow(root, { task: ready });
    await expect(
      saveWorkflow(root, { task: { ...ready, evidence: [{ ...ready.evidence[0]!, summary: "mutated" }] } }),
    ).rejects.toThrow("evidence");
    await expect(
      saveWorkflow(root, { task: { ...ready, status: "verifying", checkpoint: "verifying" } }),
    ).rejects.toThrow("Illegal task transition");
  });

  it("prevents a Full task from downgrading to Lite before readiness", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const full = { ...taskV3("planning", "planning"), mode: "full" as const };
    await saveWorkflow(root, { task: full, artifacts: { prd: "# PRD\n", plan: "# Plan\n" } });

    await expect(
      saveWorkflow(root, {
        task: { ...full, mode: "lite", status: "ready", checkpoint: "ready", updatedAt: "2026-08-13T00:01:00.000Z" },
      }),
    ).rejects.toThrow(/Full.*Lite|downgrade.*mode/iu);
  });
});
