import { describe, expect, it, vi } from "vitest";

import { createTaskIndex, type TaskIndexSource } from "../../src/core/tasks/task-index.js";
import type { TaskRecordV1, TaskStatus, WorkflowCheckpoint } from "../../src/core/tasks/task.js";

describe("task index", () => {
  it("pins the active task, sorts deterministically, and filters before limiting", async () => {
    const active = task("20260826-100000-active-task", "2026-08-26T00:00:00.000Z", "planning");
    const newest = task("20260826-110000-newest-task", "2026-08-26T03:00:00.000Z", "ready");
    const tieHigh = task("20260826-120000-zeta-task", "2026-08-26T02:00:00.000Z", "ready");
    const tieLow = task("20260826-120000-alpha-task", "2026-08-26T02:00:00.000Z", "planning");
    const source = memorySource([tieLow, active, newest, tieHigh], active.id);

    await expect(createTaskIndex("unused", { limit: 4 }, source)).resolves.toEqual({
      generator: "harnix",
      schemaVersion: 1,
      scope: "project",
      status: "ready",
      filter: { status: null, limit: 4 },
      summary: {
        scanned: 4,
        valid: 4,
        invalid: 0,
        matched: 4,
        returned: 4,
        scanTruncated: false,
        resultTruncated: false,
      },
      activeTaskId: active.id,
      attention: [],
      tasks: [
        projection(active, true),
        projection(newest, false),
        projection(tieHigh, false),
        projection(tieLow, false),
      ],
    });

    const filtered = await createTaskIndex("unused", { limit: 1, status: "ready" }, source);
    expect(filtered.filter).toEqual({ status: "ready", limit: 1 });
    expect(filtered.summary).toMatchObject({ valid: 4, matched: 2, returned: 1, resultTruncated: true });
    expect(filtered.activeTaskId).toBe(active.id);
    expect(filtered.tasks).toEqual([projection(newest, false)]);
  });

  it("keeps the valid active task inside the 1000-record scan budget", async () => {
    const ids = Array.from({ length: 1_001 }, (_, index) => `20260826-120000-task-${String(index).padStart(4, "0")}`);
    const activeTaskId = ids[0]!;
    const loadTaskRecord = vi.fn(async (_root: string, id: string) => task(id, "2026-08-26T00:00:00.000Z", "planning"));
    const source: TaskIndexSource = {
      listTaskDirectoryIds: async () => ids,
      readActiveTaskId: async () => activeTaskId,
      loadTaskRecord,
    };

    const result = await createTaskIndex("unused", { limit: 100 }, source);

    expect(loadTaskRecord).toHaveBeenCalledTimes(1_000);
    expect(loadTaskRecord).toHaveBeenCalledWith("unused", activeTaskId);
    expect(result.summary).toEqual({
      scanned: 1_000,
      valid: 1_000,
      invalid: 0,
      matched: 1_000,
      returned: 100,
      scanTruncated: true,
      resultTruncated: true,
    });
    expect(result.tasks[0]).toEqual(projection(task(activeTaskId, "2026-08-26T00:00:00.000Z", "planning"), true));
  });

  it("isolates malformed records and reports an unavailable active pointer without leaking data", async () => {
    const good = task("20260826-120000-good-task", "2026-08-26T00:00:00.000Z", "planning");
    const badId = "20260826-120001-bad-task";
    const source: TaskIndexSource = {
      listTaskDirectoryIds: async () => ["../unsafe", badId, good.id, good.id],
      readActiveTaskId: async () => badId,
      loadTaskRecord: async (_root, id) => id === good.id ? good : { private: "PRIVATE_RECORD_CANARY" },
    };

    const result = await createTaskIndex("unused", { limit: 20 }, source);

    expect(result).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      scope: "project",
      status: "partial",
      filter: { status: null, limit: 20 },
      summary: {
        scanned: 2,
        valid: 1,
        invalid: 1,
        matched: 1,
        returned: 1,
        scanTruncated: false,
        resultTruncated: false,
      },
      activeTaskId: null,
      attention: [{ code: "active-task-unavailable" }],
      tasks: [projection(good, false)],
    });
    expect(JSON.stringify(result)).not.toContain("PRIVATE_RECORD_CANARY");
  });

  it("degrades to partial when the active pointer itself cannot be read", async () => {
    const good = task("20260826-120000-good-task", "2026-08-26T00:00:00.000Z", "planning");
    const source = memorySource([good], null);
    source.readActiveTaskId = async () => { throw new Error("PRIVATE_PATH_CANARY"); };

    const result = await createTaskIndex("unused", { limit: 20 }, source);

    expect(result.status).toBe("partial");
    expect(result.activeTaskId).toBeNull();
    expect(result.attention).toEqual([{ code: "active-task-unavailable" }]);
    expect(JSON.stringify(result)).not.toContain("PRIVATE_PATH_CANARY");
  });
});

function memorySource(records: TaskRecordV1[], activeTaskId: string | null): TaskIndexSource {
  const byId = new Map(records.map((record) => [record.id, record]));
  return {
    listTaskDirectoryIds: async () => records.map((record) => record.id),
    readActiveTaskId: async () => activeTaskId,
    loadTaskRecord: async (_root, id) => byId.get(id),
  };
}

function projection(record: TaskRecordV1, active: boolean) {
  return {
    id: record.id,
    mode: record.mode,
    status: record.status,
    checkpoint: record.checkpoint,
    active,
    updatedAt: record.updatedAt,
  };
}

function task(id: string, updatedAt: string, status: Extract<TaskStatus, "planning" | "ready">): TaskRecordV1 {
  const checkpoint: WorkflowCheckpoint = status === "ready" ? "ready" : "planning";
  return {
    generator: "harnix",
    schemaVersion: 1,
    id,
    title: "PRIVATE_TITLE_CANARY",
    mode: "lite",
    status,
    checkpoint,
    goal: "PRIVATE_GOAL_CANARY",
    nonGoals: [],
    acceptanceCriteria: [{ id: "criterion", text: "PRIVATE_CRITERION_CANARY", status: "pending", evidenceIds: [] }],
    relevantPaths: [],
    relevantSpecs: [],
    validationPlan: [{ id: "gate", description: "PRIVATE_COMMAND_CANARY", command: "PRIVATE_COMMAND_CANARY", scope: "focused", required: true }],
    evidence: [],
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt,
  };
}
