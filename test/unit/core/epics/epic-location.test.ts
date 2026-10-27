import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertEpicWritable,
  epicFolder,
  epicLogicalPath,
  listEpicIds,
  locateEpicFile,
} from "src/core/epics/epic-location.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();
const ID = "20261027-102134-sample";

async function folderEpic(root: string, ...segments: string[]): Promise<string> {
  const folder = join(root, ...segments);
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, "epic.json"), "{}\n");
  return folder;
}

async function fileEpic(root: string, ...segments: string[]): Promise<string> {
  const path = join(root, ...segments);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, "{}\n");
  return path;
}

describe("epic location", () => {
  it("keeps the logical path stable", () => {
    expect(epicLogicalPath(ID, "epic.json")).toBe(`.harnix/epics/${ID}/epic.json`);
  });

  it("creates new epics in the month bucket and falls back to a plain folder without a date prefix", async () => {
    const root = await temporaryRepository();
    expect(await epicFolder(root, ID)).toBe(join(root, "epics", "2026-10", ID));
    expect(await epicFolder(root, "release-plan")).toBe(join(root, "epics", "release-plan"));
    expect(await locateEpicFile(root, ID, "json")).toBeUndefined();
  });

  it("finds the epic file in every layout and probes bucket, folder, flat file, roadmaps, then the archive", async () => {
    const root = await temporaryRepository();
    const archive = join(await folderEpic(root, "epics", "_archive", "2026-10", ID), "epic.json");
    expect(await locateEpicFile(root, ID, "json")).toEqual({ kind: "archive", path: archive });
    const roadmap = await fileEpic(root, "roadmaps", `${ID}.json`);
    expect(await locateEpicFile(root, ID, "json")).toEqual({ kind: "legacy", path: roadmap });
    const flat = await fileEpic(root, "epics", `${ID}.json`);
    expect(await locateEpicFile(root, ID, "json")).toEqual({ kind: "legacy", path: flat });
    const folder = join(await folderEpic(root, "epics", ID), "epic.json");
    expect(await locateEpicFile(root, ID, "json")).toEqual({ kind: "legacy", path: folder });
    const bucket = join(await folderEpic(root, "epics", "2026-10", ID), "epic.json");
    expect(await locateEpicFile(root, ID, "json")).toEqual({ kind: "bucket", path: bucket });
    expect(await epicFolder(root, ID)).toBe(join(root, "epics", "2026-10", ID));
  });

  it("writes into the existing legacy folder of an epic instead of splitting it", async () => {
    const root = await temporaryRepository();
    const legacy = await folderEpic(root, "epics", ID);
    expect(await epicFolder(root, ID)).toBe(legacy);
  });

  it("lists epic IDs from every layout once, leaving the archive out unless asked", async () => {
    const root = await temporaryRepository();
    await folderEpic(root, "epics", "2026-10", ID);
    await folderEpic(root, "epics", "20260901-080000-folder");
    await fileEpic(root, "epics", "20260801-080000-flat.json");
    await fileEpic(root, "roadmaps", "20260701-080000-road.json");
    await fileEpic(root, "roadmaps", "20260801-080000-flat.json");
    await folderEpic(root, "epics", "_archive", "2026-05", "20260501-080000-old");
    await mkdir(join(root, "epics", "20260902-080000-empty"), { recursive: true });

    expect(await listEpicIds(root)).toEqual([
      "20260701-080000-road",
      "20260801-080000-flat",
      "20260901-080000-folder",
      ID,
    ]);
    expect(await listEpicIds(root, { scope: "archive" })).toEqual(["20260501-080000-old"]);
    expect(await listEpicIds(root, { scope: "all" })).toHaveLength(5);
  });

  it("lists nothing when no epic directory exists", async () => {
    expect(await listEpicIds(await temporaryRepository())).toEqual([]);
  });
});

describe("epic archive guard", () => {
  it("refuses writes to an archived epic with a hint to restore it, and allows live and new epics", async () => {
    const root = await temporaryRepository();
    await folderEpic(root, "epics", "_archive", "2026-10", ID);
    await expect(assertEpicWritable(root, ID)).rejects.toThrow(`harnix archive --restore ${ID}`);

    await folderEpic(root, "epics", "2026-10", "20261028-080000-live");
    await expect(assertEpicWritable(root, "20261028-080000-live")).resolves.toBeUndefined();
    await expect(assertEpicWritable(root, "20261029-080000-new")).resolves.toBeUndefined();
  });
});
