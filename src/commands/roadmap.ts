import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { resolveSafeHarnixPath } from "../utils/paths.js";
import { validateEpic, type EpicRecord } from "../core/roadmaps/roadmap.js";
import { loadTask } from "../core/tasks/task.js";

export interface PublicRoadmapListResult {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly epics: readonly RoadmapEpicSummary[];
  readonly total: number;
}

export interface PublicRoadmapDetailResult {
  readonly generator: "harnix";
  readonly schemaVersion: 1;
  readonly epic: EpicRecord;
  readonly members: readonly RoadmapTaskMember[];
  readonly nextTask: RoadmapTaskMember | null;
}

export interface RoadmapEpicSummary {
  readonly id: string;
  readonly title: string;
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly cancelledTasks: number;
}

export interface RoadmapTaskMember {
  readonly id: string;
  readonly status: string;
}

export async function listPublicRoadmaps(
  root: string,
  limit: number,
): Promise<PublicRoadmapListResult> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const roadmapsDir = join(harnixRoot, "roadmaps");

  const epics: RoadmapEpicSummary[] = [];

  try {
    const files = await readdir(roadmapsDir, { withFileTypes: true });
    const jsonFiles = files
      .filter(f => f.isFile() && f.name.endsWith(".json"))
      .map(f => f.name.replace(/\.json$/, ""))
      .sort()
      .slice(0, limit);

    for (const epicId of jsonFiles) {
      try {
        const epic = await loadEpic(harnixRoot, epicId);
        const { total, completed, cancelled } = await countEpicMembers(root, epicId);
        epics.push({
          id: epicId,
          title: epic.title,
          totalTasks: total,
          completedTasks: completed,
          cancelledTasks: cancelled,
        });
      } catch {
        // Skip epics that cannot be loaded
      }
    }
  } catch {
    // If roadmaps directory doesn't exist, return empty list
  }

  return {
    generator: "harnix",
    schemaVersion: 1,
    epics,
    total: epics.length,
  };
}

export async function detailPublicRoadmap(
  root: string,
  epicId: string,
): Promise<PublicRoadmapDetailResult> {
  const harnixRoot = await resolveSafeHarnixPath(root);

  const epic = await loadEpic(harnixRoot, epicId);
  const members = await loadEpicMembers(root, epicId);
  const nextTask = members.find(m => m.status !== "completed" && m.status !== "cancelled") ?? null;

  return {
    generator: "harnix",
    schemaVersion: 1,
    epic,
    members,
    nextTask,
  };
}

async function loadEpic(harnixRoot: string, epicId: string): Promise<EpicRecord> {
  const epicPath = join(harnixRoot, "roadmaps", `${epicId}.json`);
  let content: string;
  try {
    content = await readFile(epicPath, "utf8");
  } catch {
    throw new Error(`No roadmap epic found with ID '${epicId}'.`);
  }
  const data = JSON.parse(content);
  return validateEpic(data);
}

async function countEpicMembers(root: string, epicId: string): Promise<{ total: number; completed: number; cancelled: number }> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const tasksDir = join(harnixRoot, "tasks");
  let total = 0, completed = 0, cancelled = 0;

  try {
    const taskDirs = await readdir(tasksDir, { withFileTypes: true });
    const taskIds = taskDirs
      .filter(d => d.isDirectory() && d.name !== ".active")
      .map(d => d.name);

    for (const taskId of taskIds) {
      try {
        const task = await loadTask(join(tasksDir, taskId, "task.json"));
        if (task.schemaVersion === 2 && task.epicId === epicId) {
          total++;
          if (task.status === "completed") completed++;
          else if (task.status === "cancelled") cancelled++;
        }
      } catch {
        // Skip tasks that cannot be loaded
      }
    }
  } catch {
    // If tasks directory doesn't exist, counts remain 0
  }

  return { total, completed, cancelled };
}

async function loadEpicMembers(root: string, epicId: string): Promise<RoadmapTaskMember[]> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const tasksDir = join(harnixRoot, "tasks");
  const members: RoadmapTaskMember[] = [];

  try {
    const taskDirs = await readdir(tasksDir, { withFileTypes: true });
    const taskIds = taskDirs
      .filter(d => d.isDirectory() && d.name !== ".active")
      .map(d => d.name)
      .sort();

    for (const taskId of taskIds) {
      try {
        const task = await loadTask(join(tasksDir, taskId, "task.json"));
        if (task.schemaVersion === 2 && task.epicId === epicId) {
          members.push({ id: taskId, status: task.status });
        }
      } catch {
        // Skip tasks that cannot be loaded
      }
    }
  } catch {
    // If tasks directory doesn't exist, members remains empty
  }

  return members;
}
