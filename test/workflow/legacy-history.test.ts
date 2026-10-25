import { cp, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { initializeProject } from "src/commands/init.js";
import { detailPublicEpic, listPublicEpics } from "src/commands/epic.js";
import { inspectProjectStatus } from "src/commands/status.js";
import { listProjectTasks } from "src/commands/tasks.js";
import { loadTask, type TaskRecord } from "src/core/tasks/task.js";

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

let disposableRoot: string | undefined;

afterAll(async () => {
  if (disposableRoot) await rm(disposableRoot, { force: true, recursive: true });
});

/** A disposable project that holds a copy of this repository's legacy task records and epic files, so the real data is never touched. */
async function projectWithHistory(): Promise<History> {
  const root = await mkdtemp(join(tmpdir(), "harnix-legacy-"));
  disposableRoot = root;
  await initializeProject({ root, developer: "tam", yes: true });
  const allIds = (await readdir(join(repositoryHarnix, "tasks"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  // Historical v1 and v2 records originate from August and September 2026 before schema v3 was introduced.
  const ids = allIds.filter((id) => id.startsWith("202608") || id.startsWith("202609") || KNOWN_MALFORMED.includes(id));
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
  let history: History;

  beforeAll(async () => {
    history = await projectWithHistory();
  });

  it("loads every persisted v1 and v2 task record through the current validator", async () => {
    const { tasks, unreadable } = history;
    const legacy = tasks.filter((task) => task.schemaVersion === 1 || task.schemaVersion === 2);

    expect(unreadable).toEqual(KNOWN_MALFORMED);
    expect(legacy.length).toBeGreaterThanOrEqual(69);
    expect(legacy.some((task) => task.schemaVersion === 1)).toBe(true);
    expect(legacy.some((task) => task.schemaVersion === 2)).toBe(true);
  });

  it("lists every readable historical task through the public task index", async () => {
    const { root, tasks } = history;

    const index = await listProjectTasks(root, { limit: 100 });

    expect(index.summary.invalid).toBe(KNOWN_MALFORMED.length);
    expect(index.summary.valid).toBe(tasks.length);
  });

  it("projects status for a historical v1 and v2 task selected as active", async () => {
    const { root, tasks } = history;
    for (const version of [1, 2] as const) {
      const sample = tasks.find((task) => task.schemaVersion === version && task.status === "completed");
      expect(sample, `a completed v${version} task exists`).toBeDefined();
      await writeFile(join(root, ".harnix", "tasks", ".active"), `${sample!.id}\n`);

      const status = await inspectProjectStatus(root);

      expect(status.activeTask?.id).toBe(sample!.id);
    }
  });

  it("reads epics and their historical members through the epic commands", async () => {
    const { root } = history;

    const list = await listPublicEpics(root, 100);
    // Newest first: pick an epic that has members, since the newest historical epic may have none.
    const withMembers = list.epics.find((epic) => epic.totalTasks > 0)!;
    const detail = await detailPublicEpic(root, withMembers.id);

    expect(list.total).toBeGreaterThan(0);
    expect(detail.members.length).toBeGreaterThan(0);
  }, 60_000);
});
