import { readFile } from "node:fs/promises";
import { readProjectTimezone } from "src/core/config/config.js";
import { buildVerifyPlan } from "src/core/stack/verify-plan.js";
import type { TaskMode, TaskRecordV3 } from "src/core/tasks/task.js";
import { idPrefix } from "src/utils/clock.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";

export interface InitTaskOptions {
  title: string;
  mode?: TaskMode;
  goal?: string | undefined;
  criterion?: string | undefined;
  command?: string | undefined;
  input?: string[] | undefined;
  followUp?: string | undefined;
  injectedNow?: string | undefined;
}

function toSlug(title: string): string {
  const normalized = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
  return normalized.slice(0, 40).replace(/-+$/u, "") || "task";
}

async function detectedTestCommand(root: string): Promise<string> {
  const command = (await buildVerifyPlan(root)).commands.test?.trim();
  if (!command) throw new Error("workflow --init found no project test command; pass --command <cmd> explicitly.");
  return command;
}

export async function initTaskWorkflow(root: string, options: InitTaskOptions): Promise<TaskRecordV3> {
  const title = options.title?.trim();
  if (!title) {
    throw new Error("workflow --init requires a non-empty --title.");
  }
  if (options.mode !== undefined && options.mode !== "lite" && options.mode !== "full")
    throw new Error("workflow --init --mode must be lite or full.");
  const mode: TaskMode = options.mode ?? "lite";
  const now = await currentInstant(root, options.injectedNow);
  const prefix = idPrefix(Date.parse(now), await readProjectTimezone(await resolveSafeHarnixPath(root)));
  const slug = toSlug(title);
  const id = `${prefix}-${slug}`;

  const goal = options.goal?.trim() || title;
  const criterionText = options.criterion?.trim() || title;
  const command = options.command?.trim() || (await detectedTestCommand(root));
  const inputs = Array.isArray(options.input) && options.input.length > 0 ? [...new Set(options.input)].sort() : ["**"];

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
