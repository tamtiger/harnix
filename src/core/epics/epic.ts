import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { isIsoTimestamp, isRecord } from "../tasks/task.js";
import { loadTask } from "../tasks/task.js";
import { formatDisplay } from "../../utils/clock.js";
import { readProjectTimezone } from "../config/config.js";

export class EpicValidationError extends Error {
  override name = "EpicValidationError";
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
    throw new EpicValidationError("Invalid or unsupported epic record.");
  }

  assertExactKeys(value, EPIC_RECORD_FIELDS, "EpicRecord");

  for (const key of ["id", "title", "goal", "createdAt", "updatedAt"]) {
    if (typeof value[key] !== "string") {
      throw new EpicValidationError(`Epic ${key} is required.`);
    }
  }

  if (!validId(String(value.id))) {
    throw new EpicValidationError("Epic ID is invalid.");
  }

  if (typeof value.title !== "string" || value.title.length === 0 || value.title.length > 500) {
    throw new EpicValidationError("Epic title must be 1-500 characters.");
  }

  if (typeof value.goal !== "string" || value.goal.length === 0 || value.goal.length > 2000) {
    throw new EpicValidationError("Epic goal must be 1-2000 characters.");
  }

  if (
    value.nonGoals !== undefined &&
    (!Array.isArray(value.nonGoals) || !value.nonGoals.every((item) => typeof item === "string"))
  ) {
    throw new EpicValidationError("Epic nonGoals must be a string array.");
  }

  if (!isIsoTimestamp(String(value.createdAt)) || !isIsoTimestamp(String(value.updatedAt))) {
    throw new EpicValidationError("Epic timestamp is invalid.");
  }

  if (Date.parse(String(value.updatedAt)) < Date.parse(String(value.createdAt))) {
    throw new EpicValidationError("Epic updatedAt must be >= createdAt.");
  }

  return value as unknown as EpicRecord;
}

// Helpers (mirrored from task.ts pattern).
function validId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value);
}

function assertExactKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>, label: string): void {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new EpicValidationError(`${label} contains an unknown schema field.`);
}

export const EPICS_DIRECTORY = "epics";
/** Pre-2.0 directory name; still read as a fallback until `harnix update` moves the files. */
export const LEGACY_EPICS_DIRECTORY = "roadmaps";

export interface EpicMember {
  id: string;
  status: string;
  title: string;
  goal: string;
  acceptanceCriteriaCount: number;
}

async function pathExists(path: string): Promise<boolean> {
  try { await access(path); return true; }
  catch { return false; }
}

/** Path of an epic file: the current directory first, then the legacy one, else where it would be created. */
export async function resolveEpicFile(harnixRoot: string, epicId: string, extension: "json" | "md"): Promise<string> {
  const current = join(harnixRoot, EPICS_DIRECTORY, `${epicId}.${extension}`);
  if (await pathExists(current)) return current;
  const legacy = join(harnixRoot, LEGACY_EPICS_DIRECTORY, `${epicId}.${extension}`);
  return (await pathExists(legacy)) ? legacy : current;
}

/** Sorted epic IDs from both directories; an ID present in both is listed once. */
export async function listEpicIds(harnixRoot: string): Promise<string[]> {
  const ids = new Set<string>();
  for (const directory of [EPICS_DIRECTORY, LEGACY_EPICS_DIRECTORY]) {
    try {
      for (const entry of await readdir(join(harnixRoot, directory), { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith(".json")) ids.add(entry.name.slice(0, -".json".length));
      }
    } catch {
      // A missing directory simply contributes no epics.
    }
  }
  return [...ids].sort();
}

/** Tasks (schema v2+) that carry this epicId, ordered by task ID; unreadable task records are skipped. */
export async function collectEpicMembers(harnixRoot: string, epicId: string): Promise<EpicMember[]> {
  const tasksDirectory = join(harnixRoot, "tasks");
  const members: EpicMember[] = [];
  let entries;
  try { entries = await readdir(tasksDirectory, { withFileTypes: true }); }
  catch { return members; }
  for (const entry of entries.filter((candidate) => candidate.isDirectory()).sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0))) {
    try {
      const task = await loadTask(join(tasksDirectory, entry.name, "task.json"));
      if (task.schemaVersion !== 1 && task.epicId === epicId) {
        members.push({ id: entry.name, status: task.status, title: task.title, goal: task.goal, acceptanceCriteriaCount: task.acceptanceCriteria.length });
      }
    } catch {
      // Skip tasks that cannot be loaded.
    }
  }
  return members;
}

export function nextEpicMember<T extends { status: string }>(members: readonly T[]): T | null {
  return members.find((member) => member.status !== "completed" && member.status !== "cancelled") ?? null;
}

export async function upsertEpic(root: string, epic: EpicRecord): Promise<void> {
  const directory = join(root, ".harnix", EPICS_DIRECTORY);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, `${epic.id}.json`), JSON.stringify(epic, null, 2), "utf8");
  await renderEpicMarkdown(root, epic.id, epic);
}

/** Returns undefined when the epic record does not exist or fails to parse/validate. */
export async function loadEpicRecord(root: string, epicId: string): Promise<EpicRecord | undefined> {
  try {
    return validateEpic(JSON.parse(await readFile(await resolveEpicFile(join(root, ".harnix"), epicId, "json"), "utf8")));
  } catch {
    return undefined;
  }
}

/** Derived, always-overwritten page: header, goal, non-goals, next task and the member table. */
export async function renderEpicMarkdown(root: string, epicId: string, epic?: EpicRecord): Promise<void> {
  const harnixRoot = join(root, ".harnix");
  const timezone = await readProjectTimezone(harnixRoot);
  const members = await collectEpicMembers(harnixRoot, epicId);
  const next = nextEpicMember(members);

  const sections: string[] = [`# Epic: ${epic?.title || epicId}`];
  if (epic?.goal) sections.push(epic.goal);
  if (epic !== undefined) sections.push(`- **Cập nhật:** ${formatDisplay(epic.updatedAt, timezone)}`);
  if (epic?.nonGoals !== undefined && epic.nonGoals.length > 0) sections.push(["## Non-goals", "", ...epic.nonGoals.map((item) => `- ${item}`)].join("\n"));

  sections.push(["## Next task", "", next !== null
    ? `- \`${next.id}\` — ${next.title} (\`${next.status}\`)`
    : members.length === 0 ? "Chưa có task thành viên." : "Không còn task nào chưa hoàn tất."].join("\n"));

  if (members.length === 0) {
    sections.push("## Members (0 tasks)\n\nNo task members yet.");
  } else {
    const table = members.map((member, index) => `| ${index + 1} | \`${member.id}\` | ${member.title} | \`${member.status}\` |`);
    sections.push([`## Members (${members.length} task${members.length === 1 ? "" : "s"})`, "", "| # | Task ID | Title | Status |", "|---|---------|-------|--------|", ...table].join("\n"));
    const overview = members.map((member, index) => [
      `### ${index + 1}. \`${member.id}\` — ${member.title}`,
      "",
      `- **Trạng thái:** \`${member.status}\``,
      `- **Mục tiêu:** ${member.goal}`,
      ...(member.acceptanceCriteriaCount > 0 ? [`- **Tiêu chí nghiệm thu:** ${member.acceptanceCriteriaCount} tiêu chí`] : []),
    ].join("\n"));
    sections.push(["## Task Overview & Scope", "", overview.join("\n\n")].join("\n"));
  }

  await mkdir(join(harnixRoot, EPICS_DIRECTORY), { recursive: true });
  await writeFile(join(harnixRoot, EPICS_DIRECTORY, `${epicId}.md`), `${sections.join("\n\n")}\n`, "utf8");
}
