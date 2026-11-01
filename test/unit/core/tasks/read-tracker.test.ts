import { describe, expect, it } from "vitest";

import {
  assertTaskUnchangedSinceRead,
  MAX_TASK_ATTEMPTS,
  noteTaskRead,
  noteTaskWritten,
  retryOnTaskConflict,
  TaskConflictError,
  trackTaskReads,
} from "src/core/tasks/read-tracker.js";

describe("task read tracker", () => {
  it("checks nothing outside a tracked section", () => {
    noteTaskRead("t", "a");
    expect(() => assertTaskUnchangedSinceRead("t", "b")).not.toThrow();
  });

  it("keeps the first read as the base, refuses a changed file and moves the base on a write", async () => {
    await trackTaskReads(async () => {
      noteTaskRead("t", "a");
      noteTaskRead("t", "later read");
      expect(() => assertTaskUnchangedSinceRead("t", "a")).not.toThrow();
      expect(() => assertTaskUnchangedSinceRead("t", undefined)).not.toThrow();
      expect(() => assertTaskUnchangedSinceRead("t", "b")).toThrow(TaskConflictError);
      noteTaskWritten("t", "b");
      expect(() => assertTaskUnchangedSinceRead("t", "b")).not.toThrow();
    });
  });

  it("reruns a command after a conflict and gives up after the attempt limit", async () => {
    let calls = 0;
    await expect(
      retryOnTaskConflict(async () => {
        calls += 1;
        if (calls < 3) throw new TaskConflictError("busy");
        return "done";
      }),
    ).resolves.toBe("done");
    expect(calls).toBe(3);

    let always = 0;
    await expect(
      retryOnTaskConflict(
        async () => {
          always += 1;
          throw new TaskConflictError("busy");
        },
        async () => undefined,
      ),
    ).rejects.toThrow("busy");
    expect(always).toBe(MAX_TASK_ATTEMPTS);
    await expect(retryOnTaskConflict(async () => Promise.reject(new Error("other")))).rejects.toThrow("other");
  });
});

describe("retry scope", () => {
  it("never retries an attempt that already wrote a task, so a multi-save command cannot run twice", async () => {
    let calls = 0;
    await expect(
      retryOnTaskConflict(async () => {
        calls += 1;
        noteTaskWritten("t", "after first save");
        throw new TaskConflictError("busy");
      }),
    ).rejects.toThrow("busy");

    expect(calls).toBe(1);
  });

  it("lets a writer that loses many rounds in a row still succeed within MAX_TASK_ATTEMPTS, then gives up", async () => {
    expect(MAX_TASK_ATTEMPTS).toBeGreaterThan(5);
    const pauses: number[] = [];
    const pause = async (attempt: number): Promise<void> => {
      pauses.push(attempt);
    };
    let calls = 0;
    await expect(
      retryOnTaskConflict(async () => {
        calls += 1;
        if (calls < MAX_TASK_ATTEMPTS) throw new TaskConflictError("busy");
        return "done";
      }, pause),
    ).resolves.toBe("done");
    expect(calls).toBe(MAX_TASK_ATTEMPTS);
    expect(pauses).toHaveLength(MAX_TASK_ATTEMPTS - 1);

    let always = 0;
    await expect(
      retryOnTaskConflict(async () => {
        always += 1;
        throw new TaskConflictError("busy");
      }, pause),
    ).rejects.toBeInstanceOf(TaskConflictError);
    expect(always).toBe(MAX_TASK_ATTEMPTS);
  });

  it("waits a little longer before each new attempt", async () => {
    const pauses: number[] = [];
    let calls = 0;
    await retryOnTaskConflict(
      async () => {
        calls += 1;
        if (calls < 3) throw new TaskConflictError("busy");
      },
      async (attempt) => {
        pauses.push(attempt);
      },
    );

    expect(pauses).toEqual([1, 2]);
  });
});
