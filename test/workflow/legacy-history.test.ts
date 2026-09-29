import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { detailPublicEpic, listPublicEpics } from "src/commands/epic.js";
import { inspectProjectStatus } from "src/commands/status.js";
import { listProjectTasks } from "src/commands/tasks.js";
import { loadTask, type TaskRecord } from "src/core/tasks/task.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-legacy-");
const repositoryHarnix = join(process.cwd(), ".harnix");

/**
 * Two records from 2026-08-13 were already malformed before schema v3 (an out-of-enum
 * check scope, and command evidence without an exit code). The resilient task index
 * must keep reporting them as invalid rather than crashing; nothing else may regress.
 */
const KNOWN_MALFORMED = ["20260813-104800-templateversion", "20260813-105600-changelogrelease"];

interface History {
  root: string;
  tasks: TaskRecord[];
  unreadable: string[];
}

/** A disposable project that holds a copy of this repository's task records and epic files, so the real data is never touched. */
async function projectWithHistory(): Promise<History> {
  const root = await temporaryRepository();
  await initializeProject({ root, developer: "tam", yes: true });
  const ids = (await readdir(join(repositoryHarnix, "tasks"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const id of ids) {
    await mkdir(join(root, ".harnix", "tasks", id), { recursive: true });
    await cp(join(repositoryHarnix, "tasks", id, "task.json"), join(root, ".harnix", "tasks", id, "task.json"));
  }
  for (const directory of ["epics", "roadmaps"]) {
    try {
      await cp(join(repositoryHarnix, directory), join(root, ".harnix", directory), { recursive: true });
    } catch {
      /* the repository may hold only one of the two directory names */
    }
  }
  const tasks: TaskRecord[] = [];
  const unreadable: string[] = [];
  for (const id of ids) {
    try {
      tasks.push(await loadTask(join(root, ".harnix", "tasks", id, "task.json")));
    } catch {
      unreadable.push(id);
    }
  }
  return { root, tasks, unreadable };
}

describe("historical task data stays readable", () => {
  it("loads every persisted v1 and v2 task record through the current validator", async () => {
    const { tasks, unreadable } = await projectWithHistory();
    const legacy = tasks.filter((task) => task.schemaVersion === 1 || task.schemaVersion === 2);

    expect(unreadable).toEqual(KNOWN_MALFORMED);
    expect(legacy.length).toBeGreaterThanOrEqual(69);
    expect(legacy.some((task) => task.schemaVersion === 1)).toBe(true);
    expect(legacy.some((task) => task.schemaVersion === 2)).toBe(true);
  });

  it("lists every readable historical task through the public task index", async () => {
    const { root, tasks } = await projectWithHistory();

    const index = await listProjectTasks(root, { limit: 100 });

    expect(index.summary.invalid).toBe(KNOWN_MALFORMED.length);
    expect(index.summary.valid).toBe(tasks.length);
  });

  it("projects status for a historical v1 and v2 task selected as active", async () => {
    const { root, tasks } = await projectWithHistory();
    for (const version of [1, 2] as const) {
      const sample = tasks.find((task) => task.schemaVersion === version && task.status === "completed");
      expect(sample, `a completed v${version} task exists`).toBeDefined();
      await writeFile(join(root, ".harnix", "tasks", ".active"), `${sample!.id}\n`);

      const status = await inspectProjectStatus(root);

      expect(status.activeTask?.id).toBe(sample!.id);
    }
  });

  it("reads epics and their historical members through the epic commands", async () => {
    const { root } = await projectWithHistory();

    const list = await listPublicEpics(root, 100);
    const detail = await detailPublicEpic(root, list.epics[0]!.id);

    expect(list.total).toBeGreaterThan(0);
    expect(detail.members.length).toBeGreaterThan(0);
  });
});
