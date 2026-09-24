import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { isIsoTimestamp, isRecord } from "../tasks/task.js";
import { loadTask } from "../tasks/task.js";

export class RoadmapValidationError extends Error {
  override name = "RoadmapValidationError";
}

export interface EpicRecord {
  generator: "harnix";
  schemaVersion: 1;
  id: string;
  title: string;
  goal: string;
  nonGoals?: string[];
  createdAt: string;
  updatedAt: string;
}

const EPIC_RECORD_FIELDS = new Set<string>(["generator", "schemaVersion", "id", "title", "goal", "nonGoals", "createdAt", "updatedAt"]);

export function validateEpic(value: unknown): EpicRecord {
  if (!isRecord(value) || value.generator !== "harnix" || value.schemaVersion !== 1) {
    throw new RoadmapValidationError("Invalid or unsupported epic record.");
  }

  assertExactKeys(value, EPIC_RECORD_FIELDS, "EpicRecord");

  for (const key of ["id", "title", "goal", "createdAt", "updatedAt"]) {
    if (typeof value[key] !== "string") {
      throw new RoadmapValidationError(`Epic ${key} is required.`);
    }
  }

  if (!validId(String(value.id))) {
    throw new RoadmapValidationError("Epic ID is invalid.");
  }

  if (typeof value.title !== "string" || value.title.length === 0 || value.title.length > 500) {
    throw new RoadmapValidationError("Epic title must be 1-500 characters.");
  }

  if (typeof value.goal !== "string" || value.goal.length === 0 || value.goal.length > 2000) {
    throw new RoadmapValidationError("Epic goal must be 1-2000 characters.");
  }

  if (
    value.nonGoals !== undefined &&
    (!Array.isArray(value.nonGoals) || !value.nonGoals.every((item) => typeof item === "string"))
  ) {
    throw new RoadmapValidationError("Epic nonGoals must be a string array.");
  }

  if (!isIsoTimestamp(String(value.createdAt)) || !isIsoTimestamp(String(value.updatedAt))) {
    throw new RoadmapValidationError("Epic timestamp is invalid.");
  }

  if (Date.parse(String(value.updatedAt)) < Date.parse(String(value.createdAt))) {
    throw new RoadmapValidationError("Epic updatedAt must be >= createdAt.");
  }

  return value as unknown as EpicRecord;
}

// Helpers (mirrored from task.ts pattern).
function validId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value);
}

function assertExactKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>, label: string): void {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new RoadmapValidationError(`${label} contains an unknown schema field.`);
}

export async function upsertEpic(root: string, epic: EpicRecord): Promise<void> {
  const roadmapsDir = join(root, ".harnix", "roadmaps");
  await mkdir(roadmapsDir, { recursive: true });
  const epicPath = join(roadmapsDir, `${epic.id}.json`);
  await writeFile(epicPath, JSON.stringify(epic, null, 2), "utf8");
  await renderRoadmapMarkdown(root, epic.id, epic);
}

/** Returns undefined when the epic record does not exist or fails to parse/validate. */
export async function loadEpicRecord(root: string, epicId: string): Promise<EpicRecord | undefined> {
  try {
    const content = await readFile(join(root, ".harnix", "roadmaps", `${epicId}.json`), "utf8");
    return validateEpic(JSON.parse(content));
  } catch {
    return undefined;
  }
}

export async function renderRoadmapMarkdown(root: string, epicId: string, epic?: EpicRecord): Promise<void> {
  const mdPath = join(root, ".harnix", "roadmaps", `${epicId}.md`);
  const title = epic?.title || epicId;
  const goal = epic?.goal ? `\n\n${epic.goal}` : "";

  // Collect tasks that belong to this epic
  const harnixRoot = join(root, ".harnix");
  const tasksDir = join(harnixRoot, "tasks");
  const memberTasks: Array<{ id: string; status: string }> = [];

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
          memberTasks.push({ id: taskId, status: task.status });
        }
      } catch {
        // Skip tasks that cannot be loaded
      }
    }
  } catch {
    // If tasks directory doesn't exist, memberTasks remains empty
  }

  let memberLines = "";
  if (memberTasks.length === 0) {
    memberLines = "\n## Members (0 tasks)\n\nNo task members yet.\n";
  } else {
    memberLines = `\n## Members (${memberTasks.length} task${memberTasks.length === 1 ? "" : "s"})\n\n`;
    memberLines += "| # | Task ID | Status |\n";
    memberLines += "|---|---------|--------|\n";
    memberTasks.forEach((task, index) => {
      memberLines += `| ${index + 1} | ${task.id} | ${task.status} |\n`;
    });
  }

  const content = `# Epic: ${title}${goal}${memberLines}`;
  await writeFile(mdPath, content, "utf8");
}
