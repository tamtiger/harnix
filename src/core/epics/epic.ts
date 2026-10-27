import { access, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { isIsoTimestamp, isRecord, unknownFieldsMessage } from "src/core/tasks/task.js";
import { assertEpicWritable, epicFolder, locateEpicFile } from "./epic-location.js";
import { collectEpicMembers, nextEpicMember } from "./members.js";
import { orderEpicMembers, validateEpicOrder } from "./order.js";
import { atomicWriteFile } from "src/utils/atomic-write.js";
import { formatDisplay } from "src/utils/clock.js";
import { readProjectTimezone } from "src/core/config/config.js";

export const epicIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;

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
  /** Optional explicit run order (task ids); members not listed follow by ascending id. */
  order?: string[];
  createdAt: string;
  updatedAt: string;
}

const EPIC_RECORD_FIELDS = new Set<string>([
  "generator",
  "schemaVersion",
  "id",
  "title",
  "goal",
  "nonGoals",
  "order",
  "createdAt",
  "updatedAt",
]);

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

  assertEpicOrder(value.order);

  if (!isIsoTimestamp(String(value.createdAt)) || !isIsoTimestamp(String(value.updatedAt))) {
    throw new EpicValidationError("Epic timestamp is invalid.");
  }

  if (Date.parse(String(value.updatedAt)) < Date.parse(String(value.createdAt))) {
    throw new EpicValidationError("Epic updatedAt must be >= createdAt.");
  }

  return value as unknown as EpicRecord;
}

function assertEpicOrder(order: unknown): void {
  if (order === undefined) return;
  try {
    validateEpicOrder(order);
  } catch (error: unknown) {
    throw new EpicValidationError(error instanceof Error ? error.message : "Epic order is invalid.");
  }
}

// Helpers (mirrored from task.ts pattern).
function validId(value: unknown): value is string {
  return typeof value === "string" && epicIdPattern.test(value);
}

function assertExactKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>, label: string): void {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new EpicValidationError(unknownFieldsMessage(label, unknown));
}

export { EPICS_DIRECTORY, LEGACY_EPICS_DIRECTORY, listEpicIds } from "./epic-location.js";
export { collectEpicMembers, collectEpicMembersByEpic, nextEpicMember, type EpicMember } from "./members.js";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Path of an epic file wherever it is, else where it would be created (the month bucket). */
export async function resolveEpicFile(harnixRoot: string, epicId: string, extension: "json" | "md"): Promise<string> {
  const found = await locateEpicFile(harnixRoot, epicId, extension);
  return found?.path ?? join(await epicFolder(harnixRoot, epicId), `epic.${extension}`);
}

export async function upsertEpic(root: string, epic: EpicRecord): Promise<void> {
  await mkdir(join(root, ".harnix"), { recursive: true });
  await assertEpicWritable(join(root, ".harnix"), epic.id);
  const folder = await epicFolder(join(root, ".harnix"), epic.id);
  await mkdir(folder, { recursive: true });
  const jsonContent = `${JSON.stringify(epic, null, 2)}\n`;
  await atomicWriteFile(join(folder, "epic.json"), jsonContent);
  await renderEpicMarkdown(root, epic.id, epic);
}

/** Loads an epic by ID for the public views; an unreadable or missing record is reported as not found. */
export async function loadEpicOrThrow(harnixRoot: string, epicId: string): Promise<EpicRecord> {
  let content: string;
  try {
    content = await readFile(await resolveEpicFile(harnixRoot, epicId, "json"), "utf8");
  } catch {
    throw new Error(`No epic found with ID '${epicId}'.`);
  }
  return validateEpic(JSON.parse(content));
}

/** Returns undefined when the epic record does not exist or fails to parse/validate. */
export async function loadEpicRecord(root: string, epicId: string): Promise<EpicRecord | undefined> {
  try {
    return validateEpic(
      JSON.parse(await readFile(await resolveEpicFile(join(root, ".harnix"), epicId, "json"), "utf8")),
    );
  } catch {
    return undefined;
  }
}

/** Derived, always-overwritten page: header, goal, non-goals, next task and the member table. */
export async function renderEpicMarkdown(root: string, epicId: string, epic?: EpicRecord): Promise<void> {
  const harnixRoot = join(root, ".harnix");
  await assertEpicWritable(harnixRoot, epicId);
  const timezone = await readProjectTimezone(harnixRoot);
  const members = orderEpicMembers(await collectEpicMembers(harnixRoot, epicId), epic?.order);
  const next = nextEpicMember(members);

  const sections: string[] = [`# Epic: ${epic?.title || epicId}`];
  if (epic?.goal) sections.push(epic.goal);
  if (epic !== undefined) sections.push(`- **Cập nhật:** ${formatDisplay(epic.updatedAt, timezone)}`);
  if (epic?.nonGoals !== undefined && epic.nonGoals.length > 0)
    sections.push(["## Non-goals", "", ...epic.nonGoals.map((item) => `- ${item}`)].join("\n"));

  sections.push(
    [
      "## Next task",
      "",
      next !== null
        ? `- \`${next.id}\` — ${next.title} (\`${next.status}\`)`
        : members.length === 0
          ? "Chưa có task thành viên."
          : "Không còn task nào chưa hoàn tất.",
    ].join("\n"),
  );

  if (members.length === 0) {
    sections.push("## Members (0 tasks)\n\nNo task members yet.");
  } else {
    const table = members.map(
      (member, index) =>
        `| ${index + 1} | \`${member.id}\` | ${member.title} | \`${member.mode}\` | \`${member.status}\` |`,
    );
    sections.push(
      [
        `## Members (${members.length} task${members.length === 1 ? "" : "s"})`,
        "",
        "| # | Task ID | Title | Mode | Status |",
        "|---|---------|-------|------|--------|",
        ...table,
      ].join("\n"),
    );
    const overview = members.map((member, index) =>
      [
        `### ${index + 1}. \`${member.id}\` — ${member.title}`,
        "",
        `- **Trạng thái:** \`${member.status}\``,
        `- **Mục tiêu:** ${member.goal}`,
        ...(member.acceptanceCriteriaCount > 0
          ? [`- **Tiêu chí nghiệm thu:** ${member.acceptanceCriteriaCount} tiêu chí`]
          : []),
      ].join("\n"),
    );
    sections.push(["## Task Overview & Scope", "", overview.join("\n\n")].join("\n"));
  }

  const folder = await epicFolder(harnixRoot, epicId);
  const artifacts: string[] = [];
  if (await pathExists(join(folder, "research.md")))
    artifacts.push("- [`research.md`](./research.md) — Khảo sát công nghệ & đối sánh giải pháp.");
  if (await pathExists(join(folder, "spec.md")))
    artifacts.push("- [`spec.md`](./spec.md) — Đặc tả thiết kế miền & hợp đồng kiến trúc.");
  if (artifacts.length > 0) sections.push(["## Supporting Artifacts", "", ...artifacts].join("\n"));

  const folderMdContent = `${sections.join("\n\n")}\n`;
  await mkdir(folder, { recursive: true });
  await atomicWriteFile(join(folder, "epic.md"), folderMdContent);
}
