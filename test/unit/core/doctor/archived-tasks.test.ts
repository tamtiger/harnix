import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { readArchivedTasks } from "src/core/doctor/archived-tasks.js";
import { buildCompletedTaskV3 } from "test/support/builders.js";
import { taskMonth } from "test/support/task-paths.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-doctor-archived-");

async function archived(root: string, id: string, content: string): Promise<string> {
  const directory = join(root, ".harnix", "tasks", "_archive", taskMonth(id), id);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "task.json"), content);
  return join(directory, "task.json");
}

describe("readArchivedTasks", () => {
  it("returns the valid archived tasks by id, skips invalid ones and never writes", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const good = "20260105-090000-good";
    const goodContent = JSON.stringify(buildCompletedTaskV3({ id: good }));
    const goodPath = await archived(root, good, goodContent);
    await archived(root, "20260105-090001-broken", "{ not json");

    const tasks = await readArchivedTasks(root);

    expect([...tasks.keys()]).toEqual([good]);
    await expect(readFile(goodPath, "utf8")).resolves.toBe(goodContent);
  });

  it("is empty when there is no archive", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });

    expect((await readArchivedTasks(root)).size).toBe(0);
  });
});
