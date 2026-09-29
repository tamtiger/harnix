import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { migrateLegacyEpics } from "src/core/epics/migrate.js";
import { buildEpic, createTestProject } from "test/support/builders.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-epic-migrate-");

async function projectWithLegacyEpic(id = "old-epic"): Promise<{ root: string; json: string }> {
  const root = await createTestProject(await temporaryRepository());
  const json = `${JSON.stringify(buildEpic({ id }), null, 2)}\n`;
  await mkdir(join(root, ".harnix", "roadmaps"), { recursive: true });
  await writeFile(join(root, ".harnix", "roadmaps", `${id}.json`), json);
  await writeFile(join(root, ".harnix", "roadmaps", `${id}.md`), "# stale derived page\n");
  return { root, json };
}

describe("legacy epic migration", () => {
  it("does nothing when there is no legacy directory", async () => {
    const root = await createTestProject(await temporaryRepository());

    expect(await migrateLegacyEpics(root)).toEqual({ created: [], deleted: [], preserved: [] });
  });

  it("copies the record byte-for-byte, regenerates the page and removes the legacy files", async () => {
    const { root, json } = await projectWithLegacyEpic();

    const result = await migrateLegacyEpics(root);

    expect(result).toEqual({
      created: [".harnix/epics/old-epic.json"],
      deleted: [".harnix/roadmaps/old-epic.json"],
      preserved: [],
    });
    expect(await readFile(join(root, ".harnix", "epics", "old-epic.json"), "utf8")).toBe(json);
    expect(await readFile(join(root, ".harnix", "epics", "old-epic.md"), "utf8")).toContain("# Epic: Example epic");
    await expect(readdir(join(root, ".harnix", "roadmaps"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("is idempotent once everything has moved", async () => {
    const { root } = await projectWithLegacyEpic();
    await migrateLegacyEpics(root);

    expect(await migrateLegacyEpics(root)).toEqual({ created: [], deleted: [], preserved: [] });
  });

  it("keeps both files when the destination differs and leaves invalid records alone", async () => {
    const { root, json } = await projectWithLegacyEpic();
    await mkdir(join(root, ".harnix", "epics"), { recursive: true });
    await writeFile(join(root, ".harnix", "epics", "old-epic.json"), `${JSON.stringify({ different: true })}\n`);
    await writeFile(join(root, ".harnix", "roadmaps", "broken.json"), "{ not json");

    const result = await migrateLegacyEpics(root);

    expect(result.preserved).toEqual([".harnix/roadmaps/broken.json", ".harnix/roadmaps/old-epic.json"]);
    expect(result.created).toEqual([]);
    expect(await readFile(join(root, ".harnix", "roadmaps", "old-epic.json"), "utf8")).toBe(json);
  });

  it("removes a legacy file whose identical copy already exists at the destination", async () => {
    const { root, json } = await projectWithLegacyEpic();
    await mkdir(join(root, ".harnix", "epics"), { recursive: true });
    await writeFile(join(root, ".harnix", "epics", "old-epic.json"), json);

    const result = await migrateLegacyEpics(root);

    expect(result.created).toEqual([]);
    expect(result.deleted).toEqual([".harnix/roadmaps/old-epic.json"]);
  });
});
