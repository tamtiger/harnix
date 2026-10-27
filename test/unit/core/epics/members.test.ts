import { mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { collectEpicMembers, collectEpicMembersByEpic } from "src/core/epics/members.js";
import { listTaskIds, taskFilePath } from "src/core/tasks/task-location.js";
import { loadTask, saveTask } from "src/core/tasks/task.js";
import { buildTaskV3 } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-epic-members-");
const EPIC = "20261001-100000-layout";
const OTHER = "20260901-100000-other";

async function archive(root: string, id: string): Promise<void> {
  const month = `${id.slice(0, 4)}-${id.slice(4, 6)}`;
  await mkdir(join(root, "tasks", "_archive", month), { recursive: true });
  await rename(join(root, "tasks", month, id), join(root, "tasks", "_archive", month, id));
}

async function seed(root: string): Promise<void> {
  const make = (id: string, epicId: string | undefined) =>
    saveTask(root, buildTaskV3({ id, ...(epicId === undefined ? {} : { epicId }) }));
  await make("20260801-100000-before-epic", undefined);
  await make("20260901-110000-other-member", OTHER);
  await make("20261001-110000-first", EPIC);
  await make("20261002-110000-second", EPIC);
  await make("20261003-110000-third", EPIC);
  await archive(root, "20261001-110000-first");
}

describe("epic members", () => {
  it("collects members from live and archived stores and equals a full scan", async () => {
    const root = await temporaryRepository();
    await seed(root);

    const members = await collectEpicMembers(root, EPIC);

    expect(members.map((member) => member.id)).toEqual([
      "20261001-110000-first",
      "20261002-110000-second",
      "20261003-110000-third",
    ]);
    const full: string[] = [];
    for (const id of await listTaskIds(root, { scope: "all" })) {
      const task = await loadTask(await taskFilePath(root, id, "task.json"));
      if (task.schemaVersion !== 1 && task.epicId === EPIC) full.push(id);
    }
    expect(members.map((member) => member.id)).toEqual(full);
  });

  it("groups the members of many epics in one pass that reads each task once", async () => {
    const root = await temporaryRepository();
    await seed(root);
    const reads: string[] = [];

    const grouped = await collectEpicMembersByEpic(root, [EPIC, OTHER], {
      load: (path) => {
        reads.push(path);
        return loadTask(path);
      },
    });

    expect(grouped.get(EPIC)?.map((member) => member.id)).toHaveLength(3);
    expect(grouped.get(OTHER)?.map((member) => member.id)).toEqual(["20260901-110000-other-member"]);
    expect(new Set(reads).size).toBe(reads.length);
    expect(reads.some((path) => path.includes("before-epic"))).toBe(false);
  });

  it("skips a task record that cannot be read and keeps the others", async () => {
    const root = await temporaryRepository();
    await seed(root);
    await writeFile(join(root, "tasks", "2026-10", "20261002-110000-second", "task.json"), "{ not json");

    const members = await collectEpicMembers(root, EPIC);

    expect(members.map((member) => member.id)).toEqual(["20261001-110000-first", "20261003-110000-third"]);
  });

  it("scans every month for an epic without a date prefix", async () => {
    const root = await temporaryRepository();
    await saveTask(root, buildTaskV3({ id: "20260801-100000-old-member", epicId: "plain-epic" }));
    const members = await collectEpicMembers(root, "plain-epic");
    expect(members.map((member) => member.id)).toEqual(["20260801-100000-old-member"]);
  });
});
