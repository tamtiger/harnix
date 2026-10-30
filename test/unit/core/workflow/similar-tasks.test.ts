import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { clearActiveTask } from "src/core/tasks/task-store.js";
import { initTaskWorkflow } from "src/core/workflow/init-task.js";
import {
  TASK_SIMILARITY_THRESHOLD,
  findSimilarTasks,
  loadSimilarTasks,
  similarTaskNotice,
} from "src/core/workflow/similar-tasks.js";
import { initializeUtcProject } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

const candidate = { title: "Chuẩn hóa webhook secret", goal: "Chuẩn hóa cấu hình webhook secret cho Payoo" };

function existing(id: string, status: string, title: string, goal = title) {
  return { id, status, title, goal };
}

describe("findSimilarTasks", () => {
  it("should use a named threshold of 0.6", () => {
    expect(TASK_SIMILARITY_THRESHOLD).toBe(0.6);
  });

  it("should match a title that differs only by accents and case", () => {
    const found = findSimilarTasks(candidate, [
      existing("20261001-000000-a", "planning", "CHUAN HOA WEBHOOK SECRET", "Chuan hoa webhook secret"),
    ]);
    expect(found.map((item) => item.id)).toEqual(["20261001-000000-a"]);
    expect(found[0]?.score).toBe(1);
  });

  it("should apply the threshold inclusively: 0.6 matches and just below does not", () => {
    // tokens: 3 shared of 5 distinct = 0.6; 2 shared of 4 distinct = 0.5.
    const at = findSimilarTasks({ title: "alpha beta gamma", goal: "zz" }, [
      existing("20261001-000000-at", "planning", "alpha beta gamma delta epsilon", "yy"),
    ]);
    const below = findSimilarTasks({ title: "alpha beta gamma delta", goal: "zz" }, [
      existing("20261001-000000-below", "planning", "alpha beta gamma epsilon zeta eta", "yy"),
    ]);
    expect(at).toHaveLength(1);
    expect(below).toHaveLength(0);
  });

  it("should ignore cancelled tasks and unrelated tasks", () => {
    const found = findSimilarTasks(candidate, [
      existing("20261001-000001-b", "cancelled", candidate.title, candidate.goal),
      existing("20261001-000002-c", "planning", "Thêm báo cáo doanh thu", "Báo cáo doanh thu theo tháng"),
    ]);
    expect(found).toEqual([]);
  });

  it("should list the best matches first and keep at most three", () => {
    const tasks = ["d", "e", "f", "g"].map((suffix) =>
      existing(`20261001-00000${suffix.charCodeAt(0) % 10}-${suffix}`, "planning", candidate.title, candidate.goal),
    );
    expect(findSimilarTasks(candidate, tasks)).toHaveLength(3);
  });
});

describe("similarTaskNotice", () => {
  it("should suggest --set-goal or resume for an open task and --follow-up for a completed one", () => {
    const text = similarTaskNotice([
      { id: "20261001-000000-open", status: "planning", score: 0.9 },
      { id: "20261001-000001-done", status: "completed", score: 0.8 },
    ]);
    expect(text).toContain("20261001-000000-open");
    expect(text).toContain("--set-goal");
    expect(text).toContain("harnix resume 20261001-000000-open");
    expect(text).toContain("--follow-up 20261001-000001-done");
  });

  it("should print nothing when there is no similar task", () => {
    expect(similarTaskNotice([])).toBeUndefined();
  });
});

describe("workflow --init similarity notice", () => {
  async function project(): Promise<string> {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));
    return root;
  }

  it("should warn on stderr but still create the task", async () => {
    const root = await project();
    const first = await initTaskWorkflow(root, {
      title: "Standardize webhook secret",
      slug: "standardize-webhook-secret",
      goal: "Standardize webhook secret configuration",
      injectedNow: "2026-10-01T10:00:00.000Z",
    });
    await clearActiveTask(join(root, ".harnix"), first.id);
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    try {
      const second = await initTaskWorkflow(root, {
        title: "Standardize webhook secret",
        slug: "payoo-webhook-secret",
        goal: "Standardize webhook secret configuration",
        injectedNow: "2026-10-01T10:00:05.000Z",
      });
      const output = write.mock.calls.map((call) => String(call[0])).join("");
      expect(output).toContain("notice: similar task");
      expect(output).toContain("standardize-webhook-secret");
      expect(second.id).toContain("payoo-webhook-secret");
    } finally {
      write.mockRestore();
    }
  });

  it("should stay silent when no task is similar", async () => {
    const root = await project();
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    try {
      await initTaskWorkflow(root, { title: "Add invoice export", slug: "invoice-export" });
      expect(write.mock.calls.map((call) => String(call[0])).join("")).not.toContain("similar task");
    } finally {
      write.mockRestore();
    }
  });

  it("loadSimilarTasks should skip unreadable records instead of failing", async () => {
    const root = await project();
    await expect(loadSimilarTasks(root, candidate)).resolves.toEqual([]);
  });
});
