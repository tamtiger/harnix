import { readFile } from "node:fs/promises";
import type { TaskMode, TaskRecordV3 } from "src/core/tasks/task.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";

export interface InitTaskOptions {
  title: string;
  mode?: TaskMode;
  goal?: string;
  criterion?: string;
  command?: string;
  input?: string[];
  followUp?: string;
  injectedNow?: string;
}

function toSlug(title: string): string {
  const normalized = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
  return normalized.slice(0, 40) || "task";
}

function makeIdPrefix(isoTimestamp: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/u.exec(isoTimestamp);
  if (!match) return "20261005-000000";
  const [, y, m, d, hh, mm, ss] = match;
  return `${y}${m}${d}-${hh}${mm}${ss}`;
}

export async function initTaskWorkflow(root: string, options: InitTaskOptions): Promise<TaskRecordV3> {
  const title = options.title?.trim();
  if (!title) {
    throw new Error("workflow --init requires a non-empty --title.");
  }
  const mode: TaskMode = options.mode === "full" ? "full" : "lite";
  const now = await currentInstant(root, options.injectedNow);
  const prefix = makeIdPrefix(now);
  const slug = toSlug(title);
  const id = `${prefix}-${slug}`;

  const goal = options.goal?.trim() || title;
  const criterionText = options.criterion?.trim() || title;
  const command = options.command?.trim() || "pnpm test";
  const inputs = Array.isArray(options.input) && options.input.length > 0 ? [...new Set(options.input)].sort() : ["src/**"];

  let relevantPaths: string[] = [];
  let relevantSpecs: string[] = [];
  let epicId: string | undefined;

  if (options.followUp) {
    const parentId = options.followUp.trim();
    try {
      const harnixDir = await resolveSafeHarnixPath(root);
      const parentTaskFile = await resolveSafeProjectPath(harnixDir, `tasks/${parentId}/task.json`);
      const raw = await readFile(parentTaskFile, "utf8");
      const parent = JSON.parse(raw) as Partial<TaskRecordV3>;
      relevantPaths = Array.isArray(parent.relevantPaths) ? [...parent.relevantPaths] : [];
      relevantSpecs = Array.isArray(parent.relevantSpecs) ? [...parent.relevantSpecs] : [];
      epicId = parent.epicId;
    } catch {
      throw new Error(`Follow-up task '${parentId}' not found.`);
    }
  }

  const candidate: TaskRecordV3 = {
    generator: "harnix",
    schemaVersion: 3,
    id,
    title,
    mode,
    status: "planning",
    checkpoint: "planning",
    goal,
    nonGoals: [],
    ...(epicId !== undefined ? { epicId } : {}),
    acceptanceCriteria: [
      {
        id: "ac-1",
        text: criterionText,
        status: "pending",
        evidenceIds: [],
      },
    ],
    validationPlan: [
      {
        id: "check-1",
        description: `Verify ${title}`,
        scope: "focused",
        required: true,
        command,
        criterionIds: ["ac-1"],
        inputs,
      },
    ],
    evidence: [],
    relevantPaths,
    relevantSpecs,
    createdAt: now,
    updatedAt: now,
  };

  return (await saveWorkflow(root, { task: candidate })) as TaskRecordV3;
}
