import { describe, expect, it } from "vitest";

import {
  assertTaskUnchangedSinceRead,
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

  it("reruns a command after a conflict and gives up after five attempts", async () => {
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
      retryOnTaskConflict(async () => {
        always += 1;
        throw new TaskConflictError("busy");
      }),
    ).rejects.toThrow("busy");
    expect(always).toBe(5);
    await expect(retryOnTaskConflict(async () => Promise.reject(new Error("other")))).rejects.toThrow("other");
  });
});
