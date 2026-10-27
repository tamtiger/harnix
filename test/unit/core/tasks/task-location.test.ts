import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertTaskWritable,
  listTaskIds,
  locateTask,
  monthBucket,
  resolveTaskDirectory,
  taskFilePath,
  taskLogicalPath,
} from "src/core/tasks/task-location.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();
const ID = "20261027-102135-sample";

async function place(root: string, ...segments: string[]): Promise<string> {
  const directory = join(root, ...segments);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "task.json"), "{}\n");
  return directory;
}

describe("task location", () => {
  it("derives the month bucket from the date prefix of the ID", () => {
    expect(monthBucket(ID)).toBe("2026-10");
    expect(monthBucket("20260101-000000-x")).toBe("2026-01");
    expect(monthBucket("sample")).toBeUndefined();
    expect(monthBucket("20261327-000000-x")).toBeUndefined();
  });

  it("keeps the logical path stable whatever the physical layout is", () => {
    expect(taskLogicalPath(ID, "task.json")).toBe(`.harnix/tasks/${ID}/task.json`);
  });

  it("creates new tasks in the month bucket", async () => {
    const root = await temporaryRepository();
    expect(await locateTask(root, ID)).toBeUndefined();
    expect(await resolveTaskDirectory(root, ID)).toBe(join(root, "tasks", "2026-10", ID));
    expect(await taskFilePath(root, ID, "task.json")).toBe(join(root, "tasks", "2026-10", ID, "task.json"));
  });

  it("finds a task in the bucket, in the flat legacy layout and in the archive", async () => {
    const root = await temporaryRepository();
    const bucket = await place(root, "tasks", "2026-10", ID);
    expect(await locateTask(root, ID)).toEqual({ kind: "bucket", directory: bucket });

    const legacyId = "20260807-120000-old";
    const legacy = await place(root, "tasks", legacyId);
    expect(await locateTask(root, legacyId)).toEqual({ kind: "legacy", directory: legacy });
    expect(await resolveTaskDirectory(root, legacyId)).toBe(legacy);

    const archivedId = "20260701-090000-done";
    const archived = await place(root, "tasks", "_archive", "2026-07", archivedId);
    expect(await locateTask(root, archivedId)).toEqual({ kind: "archive", directory: archived });
    expect(await resolveTaskDirectory(root, archivedId)).toBe(archived);
  });

  it("probes the bucket first, then the flat layout, then the archive", async () => {
    const root = await temporaryRepository();
    const archived = await place(root, "tasks", "_archive", "2026-10", ID);
    expect(await locateTask(root, ID)).toEqual({ kind: "archive", directory: archived });
    const legacy = await place(root, "tasks", ID);
    expect(await locateTask(root, ID)).toEqual({ kind: "legacy", directory: legacy });
    const bucket = await place(root, "tasks", "2026-10", ID);
    expect(await locateTask(root, ID)).toEqual({ kind: "bucket", directory: bucket });
  });

  it("rejects an ID that is not a task ID", async () => {
    const root = await temporaryRepository();
    await expect(locateTask(root, "../escape")).rejects.toThrow("unsafe");
    await expect(resolveTaskDirectory(root, "tasks/.active")).rejects.toThrow("unsafe");
  });

  it("lists IDs from every layout and leaves the archive out unless asked", async () => {
    const root = await temporaryRepository();
    await place(root, "tasks", "20260807-120000-flat");
    await place(root, "tasks", "2026-10", ID);
    await place(root, "tasks", "2026-10", "20261028-080000-later");
    await place(root, "tasks", "_archive", "2026-07", "20260701-090000-done");
    await mkdir(join(root, "tasks", "not-a-task"), { recursive: true });
    await writeFile(join(root, "tasks", ".active"), `${ID}\n`);

    expect(await listTaskIds(root)).toEqual(["20260807-120000-flat", ID, "20261028-080000-later"]);
    expect(await listTaskIds(root, { scope: "archive" })).toEqual(["20260701-090000-done"]);
    expect(await listTaskIds(root, { scope: "all" })).toEqual([
      "20260701-090000-done",
      "20260807-120000-flat",
      ID,
      "20261028-080000-later",
    ]);
  });

  it("lists nothing when there is no tasks directory", async () => {
    expect(await listTaskIds(await temporaryRepository())).toEqual([]);
  });
});

describe("task location month bound", () => {
  it("lists only IDs from the given month onward, in every layout", async () => {
    const root = await temporaryRepository();
    await place(root, "tasks", "20260807-120000-flat-old");
    await place(root, "tasks", "20261001-120000-flat-new");
    await place(root, "tasks", "2026-08", "20260808-120000-bucket-old");
    await place(root, "tasks", "2026-10", ID);
    await place(root, "tasks", "_archive", "2026-09", "20260901-090000-archived");
    await place(root, "tasks", "_archive", "2026-07", "20260701-090000-archived-old");

    expect(await listTaskIds(root, { scope: "all", fromMonth: "2026-09" })).toEqual([
      "20260901-090000-archived",
      "20261001-120000-flat-new",
      ID,
    ]);
    expect(await listTaskIds(root, { fromMonth: "2026-10" })).toEqual(["20261001-120000-flat-new", ID]);
  });
});

describe("task archive guard", () => {
  it("refuses writes to an archived task with a hint to restore it, and allows live and new tasks", async () => {
    const root = await temporaryRepository();
    await place(root, "tasks", "_archive", "2026-10", ID);
    await expect(assertTaskWritable(root, ID)).rejects.toThrow(`harnix archive --restore ${ID}`);

    const live = "20261028-080000-live";
    await place(root, "tasks", "2026-10", live);
    await expect(assertTaskWritable(root, live)).resolves.toBeUndefined();
    await expect(assertTaskWritable(root, "20261029-080000-new")).resolves.toBeUndefined();
  });
});
