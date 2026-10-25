import { describe, expect, it } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderInternalContextForHook } from "src/commands/internal-context.js";
import { createConfig, writeConfig } from "src/core/config/config.js";
import { saveTask, setActiveTask, type TaskRecord } from "src/core/tasks/task.js";
import { buildTaskV1 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("internal context hook caching", () => {
  it("elides duplicate context injection for repeated calls with same session_id", async () => {
    const root = await temporaryRepository();
    const config = createConfig({ developer: "tam" });
    config.context.mode = "full";
    await writeConfig(join(root, ".harnix", "config.yaml"), config);
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "docs", "a.md"), "sample context content");
    const task: TaskRecord = buildTaskV1({
      id: "20260807-120000-session-task",
      title: "t",
      status: "in_progress",
      checkpoint: "implementing",
      goal: "t",
      acceptanceCriteria: [],
      relevantPaths: ["docs/a.md"],
      validationPlan: [],
      createdAt: "2026-08-13T00:00:00.000Z",
      updatedAt: "2026-08-13T00:00:00.000Z",
    });
    await saveTask(join(root, ".harnix"), task);
    await setActiveTask(join(root, ".harnix"), task.id);

    const first = await renderInternalContextForHook({
      platform: "codex",
      fallbackCwd: root,
      event: { session_id: "sess-123", cwd: root },
    });
    expect(first).toContain("sample context content");

    const second = await renderInternalContextForHook({
      platform: "codex",
      fallbackCwd: root,
      event: { session_id: "sess-123", cwd: root },
    });
    expect(second).toBe("");
  });
});
