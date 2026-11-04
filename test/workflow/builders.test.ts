import { describe, expect, it } from "vitest";

import { validateTask } from "src/core/tasks/task.js";
import { buildCompletedTaskV3 } from "test/support/builders.js";

describe("buildCompletedTaskV3", () => {
  it("builds a completed task that validateTask accepts, with met criteria backed by its evidence", () => {
    const task = buildCompletedTaskV3();

    expect(() => validateTask(JSON.parse(JSON.stringify(task)))).not.toThrow();
    expect(task.status).toBe("completed");
    expect(task.acceptanceCriteria.every((criterion) => criterion.status === "met")).toBe(true);
    expect(task.acceptanceCriteria[0]?.evidenceIds).toEqual(task.evidence.map((item) => item.id));
  });

  it("lets a test override the id and evidence while staying valid", () => {
    const task = buildCompletedTaskV3({ id: "20260105-090000-other" });

    expect(task.id).toBe("20260105-090000-other");
    expect(() => validateTask(JSON.parse(JSON.stringify(task)))).not.toThrow();
  });
});
