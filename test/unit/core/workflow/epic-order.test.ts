import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { loadEpicOrThrow, upsertEpic } from "src/core/epics/epic.js";
import { saveTask } from "src/core/tasks/task.js";
import { setEpicOrderWorkflow } from "src/core/workflow/epic-order.js";
import { assertFlagGroups, selectAction } from "src/commands/workflow-flags.js";
import { buildEpic, buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-epic-order-");
const A = "20260928-100000-first";
const B = "20260928-100001-second";
const NOW = "2026-09-28T14:00:00.000Z";

async function project(): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ root, developer: "tam", yes: true });
  for (const id of [A, B])
    await saveTask(join(root, ".harnix"), buildTaskV3({ id, title: id, epicId: "ordered-epic" }));
  await upsertEpic(
    root,
    buildEpic({ id: "ordered-epic", title: "Ordered", goal: "Goal", createdAt: NOW, updatedAt: NOW }),
  );
  return root;
}

const taskFile = (root: string, id: string) => readFile(join(root, ".harnix", "tasks", id, "task.json"), "utf8");

describe("workflow --epic-order", () => {
  it("records the order, re-renders the page and leaves every task file untouched", async () => {
    const root = await project();
    const before = [await taskFile(root, A), await taskFile(root, B)];

    const epic = await setEpicOrderWorkflow(root, "ordered-epic", [B, A], "2026-09-28T15:00:00.000Z");

    expect(epic.order).toEqual([B, A]);
    expect(epic.updatedAt).toBe("2026-09-28T15:00:00.000Z");
    expect((await loadEpicOrThrow(join(root, ".harnix"), "ordered-epic")).order).toEqual([B, A]);
    expect(await readFile(join(root, ".harnix", "epics", "ordered-epic.md"), "utf8")).toMatch(
      /Next task[\s\S]*second/u,
    );
    expect([await taskFile(root, A), await taskFile(root, B)]).toEqual(before);
  });

  it("clears the order when no task id is given", async () => {
    const root = await project();
    await setEpicOrderWorkflow(root, "ordered-epic", [B], NOW);

    expect((await setEpicOrderWorkflow(root, "ordered-epic", [], NOW)).order).toBeUndefined();
  });

  it("rejects a task outside the epic, a duplicate and an unknown epic without writing", async () => {
    const root = await project();

    await expect(setEpicOrderWorkflow(root, "ordered-epic", ["20260928-100009-other"], NOW)).rejects.toThrow(
      /20260928-100009-other/u,
    );
    await expect(setEpicOrderWorkflow(root, "ordered-epic", [A, A], NOW)).rejects.toThrow(/duplicate/iu);
    await expect(setEpicOrderWorkflow(root, "missing", [A], NOW)).rejects.toThrow(/No epic found/u);
    expect((await loadEpicOrThrow(join(root, ".harnix"), "ordered-epic")).order).toBeUndefined();
  });
});

describe("--epic-order flag", () => {
  it("selects its own action and takes the epic id then the task ids", () => {
    expect(selectAction({ epicOrder: ["ordered-epic", A] })).toBe("epicOrder");
    expect(() => assertFlagGroups("epicOrder", { epicOrder: [] })).toThrow(/--epic-order/u);
    expect(() => assertFlagGroups("epicOrder", { epicOrder: ["ordered-epic", A] })).not.toThrow();
  });
});
