import { describe, expect, it } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { renderInternalContextForHook } from "src/commands/internal-context.js";
import { ConfigValidationError } from "src/core/config/config-schema.js";
import { validateConfig } from "src/core/config/config-validate.js";
import { createConfig, readConfig, writeConfig } from "src/core/config/config.js";
import { summarizeLearning } from "src/core/journal/learning-summary.js";
import { saveTask, setActiveTask, type TaskRecord } from "src/core/tasks/task.js";
import { at, buildTaskV1 } from "test/support/builders.js";
import { buildLearningEntry, writeJournalFile } from "test/support/learning-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-context-cost-");

async function prepare(learningMax?: number): Promise<{ root: string; task: TaskRecord }> {
  const root = await temporaryRepository();
  const config = createConfig({ developer: "tam" });
  config.context.mode = "lean";
  if (learningMax !== undefined) config.context.learningMax = learningMax;
  await writeConfig(join(root, ".harnix", "config.yaml"), config);
  await mkdir(join(root, "docs"), { recursive: true });
  await writeFile(join(root, "docs", "a.md"), "sample context content");
  const task = buildTaskV1({
    id: "20260807-120000-cost-task",
    title: "Giảm chi phí context",
    status: "in_progress",
    checkpoint: "implementing",
    goal: "Không chèn lại khối khi chỉ đổi trạng thái",
    acceptanceCriteria: [],
    relevantPaths: ["docs/a.md"],
    validationPlan: [],
    createdAt: "2026-08-13T00:00:00.000Z",
    updatedAt: "2026-08-13T00:00:00.000Z",
  });
  await saveTask(join(root, ".harnix"), task);
  await setActiveTask(join(root, ".harnix"), task.id);
  return { root, task };
}

const turn = (root: string, sessionId: string): Promise<string> =>
  renderInternalContextForHook({
    platform: "claude",
    fallbackCwd: root,
    event: { session_id: sessionId, cwd: root },
  });

describe("hook context elision ignores the Status line", () => {
  it("prints nothing on the next turn when only the status and checkpoint changed", async () => {
    const { root, task } = await prepare();
    const first = await turn(root, "sess-status");
    expect(first).toContain("Status: in_progress/implementing");

    await saveTask(join(root, ".harnix"), { ...task, status: "verifying", checkpoint: "verifying" });

    expect(await turn(root, "sess-status")).toBe("");
  });

  it("still prints again when the title, the goal or the task changes", async () => {
    const { root, task } = await prepare();
    await turn(root, "sess-title");
    await saveTask(join(root, ".harnix"), { ...task, title: "Một tiêu đề khác" });
    const second = await turn(root, "sess-title");
    expect(second).toContain("Một tiêu đề khác");

    await saveTask(join(root, ".harnix"), { ...task, title: "Một tiêu đề khác", goal: "Mục tiêu khác hẳn" });
    expect(await turn(root, "sess-title")).toContain("Mục tiêu khác hẳn");
  });
});

describe("context.learningMax", () => {
  it("defaults to the old behavior and round-trips through the config file", async () => {
    const config = createConfig({ developer: "tam" });
    expect(config.context.learningMax).toBeUndefined();
    const root = await temporaryRepository();
    config.context.learningMax = 2;
    await writeConfig(join(root, ".harnix", "config.yaml"), config);
    expect((await readConfig(join(root, ".harnix", "config.yaml"))).context.learningMax).toBe(2);
  });

  it("accepts 0 to 5 and rejects anything else", () => {
    const base = validateConfig(createConfig({ developer: "tam" }));
    for (const learningMax of [0, 1, 5]) {
      expect(() => validateConfig({ ...base, context: { ...base.context, learningMax } })).not.toThrow();
    }
    for (const learningMax of [-1, 6, 1.5, "3"]) {
      expect(() => validateConfig({ ...base, context: { ...base.context, learningMax } })).toThrow(
        ConfigValidationError,
      );
    }
  });

  it("limits the notes handed to the agent and 0 hides them", async () => {
    const root = await temporaryRepository();
    await writeJournalFile(root, "2026-09-29.jsonl", [
      buildLearningEntry({ id: "obs-0000000000000001", statement: "First lesson about database pooling limits" }),
      buildLearningEntry({ id: "obs-0000000000000002", statement: "Second lesson about retry backoff windows" }),
      buildLearningEntry({ id: "obs-0000000000000003", statement: "Third lesson about cache invalidation rules" }),
    ]);
    const now = Date.parse(at(60));

    expect(await summarizeLearning(root, now, { maxItems: 2 })).toHaveLength(2);
    expect(await summarizeLearning(root, now, { maxItems: 0 })).toEqual([]);
    expect(await summarizeLearning(root, now)).toHaveLength(3);
  });

  it("shows the notes of a planning task by default and drops them when learningMax is 0", async () => {
    for (const [learningMax, shown] of [
      [undefined, true],
      [0, false],
    ] as const) {
      const { root, task } = await prepare(learningMax);
      // The hook reads the wall clock, so the note must be recent or it lapses after 28 days.
      await writeJournalFile(join(root, ".harnix", "workspace", "tam", "journal"), "2026-08-13.jsonl", [
        buildLearningEntry(
          { id: "obs-0000000000000009", statement: "A lesson that is shown unless disabled" },
          { recordedAt: new Date().toISOString() },
        ),
      ]);
      await saveTask(join(root, ".harnix"), { ...task, status: "planning", checkpoint: "planning" });

      const text = await turn(root, `sess-${String(learningMax)}`);
      expect(text.includes("A lesson that is shown unless disabled")).toBe(shown);
    }
  });
});

describe("near-duplicate learning notes", () => {
  it("keeps one of two notes that share most of their words", async () => {
    const root = await temporaryRepository();
    await writeJournalFile(root, "2026-09-29.jsonl", [
      buildLearningEntry({
        id: "obs-00000000000000a1",
        statement: "Always restore the fixed clock after each test run",
      }),
      buildLearningEntry({
        id: "obs-00000000000000a2",
        statement: "Always restore the fixed clock after every test run",
      }),
      buildLearningEntry({
        id: "obs-00000000000000a3",
        statement: "Prefer atomic writes for shared integration files",
      }),
    ]);

    const items = await summarizeLearning(root, Date.parse(at(60)));

    expect(items).toHaveLength(2);
    expect(items.filter((item) => item.statement.includes("fixed clock"))).toHaveLength(1);
  });
});
