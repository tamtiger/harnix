import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { detailPublicEpic, listPublicEpics } from "src/commands/epic.js";
import { diagnoseProject } from "src/commands/doctor.js";
import { initializeProject } from "src/commands/init.js";
import { updateProject } from "src/commands/update.js";
import { buildEpic } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-epic-migration-");

const epic = buildEpic({
  id: "old-epic",
  title: "Old epic",
  goal: "Goal",
  createdAt: "2026-09-24T04:00:00.000Z",
  updatedAt: "2026-09-24T04:00:00.000Z",
});
const legacyJson = `${JSON.stringify(epic, null, 2)}\n`;

async function legacyProject(): Promise<string> {
  const root = await temporaryRepository();
  await initializeProject({ root, developer: "tam", yes: true });
  await mkdir(join(root, ".harnix", "roadmaps"), { recursive: true });
  await writeFile(join(root, ".harnix", "roadmaps", "old-epic.json"), legacyJson);
  await writeFile(join(root, ".harnix", "roadmaps", "old-epic.md"), "# stale derived page\n");
  return root;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe("roadmaps to epics migration", () => {
  it("keeps legacy .harnix/roadmaps data readable before it is moved", async () => {
    const root = await legacyProject();

    const list = await listPublicEpics(root, 20);
    const detail = await detailPublicEpic(root, "old-epic");

    expect(list.epics.map((item) => item.id)).toEqual(["old-epic"]);
    expect(detail.epic.title).toBe("Old epic");
  });

  it("moves the record byte-for-byte, regenerates the page and removes the legacy files on update", async () => {
    const root = await legacyProject();

    const result = await updateProject({ root });

    expect(result.created).toContain(".harnix/epics/old-epic.json");
    expect(result.deleted).toContain(".harnix/roadmaps/old-epic.json");
    expect(await readFile(join(root, ".harnix", "epics", "old-epic.json"), "utf8")).toBe(legacyJson);
    expect(await readFile(join(root, ".harnix", "epics", "old-epic.md"), "utf8")).toContain("# Epic: Old epic");
    expect(await exists(join(root, ".harnix", "roadmaps"))).toBe(false);
    expect((await listPublicEpics(root, 20)).epics.map((item) => item.id)).toEqual(["old-epic"]);
  });

  it("is idempotent", async () => {
    const root = await legacyProject();
    await updateProject({ root });
    const before = await readFile(join(root, ".harnix", "epics", "old-epic.md"), "utf8");

    const second = await updateProject({ root });

    expect(second.created.filter((path) => path.includes("epics"))).toEqual([]);
    expect(second.deleted.filter((path) => path.includes("roadmaps"))).toEqual([]);
    expect(await readFile(join(root, ".harnix", "epics", "old-epic.md"), "utf8")).toBe(before);
  });

  it("keeps both files when a different epic record already sits at the destination", async () => {
    const root = await legacyProject();
    await mkdir(join(root, ".harnix", "epics"), { recursive: true });
    const different = `${JSON.stringify({ ...epic, title: "Newer title" }, null, 2)}\n`;
    await writeFile(join(root, ".harnix", "epics", "old-epic.json"), different);

    const result = await updateProject({ root });

    expect(result.preserved).toContain(".harnix/roadmaps/old-epic.json");
    expect(await readFile(join(root, ".harnix", "epics", "old-epic.json"), "utf8")).toBe(different);
    expect(await readFile(join(root, ".harnix", "roadmaps", "old-epic.json"), "utf8")).toBe(legacyJson);
  });

  it("leaves an invalid legacy record and unrelated files untouched", async () => {
    const root = await legacyProject();
    await writeFile(join(root, ".harnix", "roadmaps", "broken.json"), "{ not json");
    await writeFile(join(root, ".harnix", "roadmaps", "notes.txt"), "keep me");

    const result = await updateProject({ root });

    expect(result.preserved).toContain(".harnix/roadmaps/broken.json");
    expect((await readdir(join(root, ".harnix", "roadmaps"))).sort()).toEqual(["broken.json", "notes.txt"]);
  });

  it("is also performed by doctor --fix", async () => {
    const root = await legacyProject();

    await diagnoseProject({ root, fix: true });

    expect(await exists(join(root, ".harnix", "epics", "old-epic.json"))).toBe(true);
    expect(await exists(join(root, ".harnix", "roadmaps", "old-epic.json"))).toBe(false);
  });
});
