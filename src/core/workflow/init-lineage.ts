import { readFile } from "node:fs/promises";

import { epicIdPattern, loadEpicRecord } from "src/core/epics/epic.js";
import type { TaskRecordV3 } from "src/core/tasks/task.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";

export interface LineageOptions {
  epic?: string | undefined;
  followUp?: string | undefined;
}

export interface Lineage {
  epicId?: string;
  followUpOf?: string;
  relevantPaths: string[];
  relevantSpecs: string[];
}

async function requireEpic(root: string, requested: string): Promise<string> {
  const epicId = requested.trim();
  if (!epicIdPattern.test(epicId)) throw new Error(`workflow --init --epic '${epicId}' is not a valid epic id.`);
  if ((await loadEpicRecord(root, epicId)) === undefined) throw new Error(`Epic '${epicId}' not found.`);
  return epicId;
}

async function readParent(root: string, parentId: string): Promise<Partial<TaskRecordV3>> {
  try {
    const harnixDir = await resolveSafeHarnixPath(root);
    const parentTaskFile = await resolveSafeProjectPath(harnixDir, `tasks/${parentId}/task.json`);
    return JSON.parse(await readFile(parentTaskFile, "utf8")) as Partial<TaskRecordV3>;
  } catch {
    throw new Error(`Follow-up task '${parentId}' not found.`);
  }
}

/** Epic and follow-up lineage of a new task: an explicit epic must exist, a follow-up inherits its parent's epic and paths. */
export async function resolveLineage(root: string, options: LineageOptions): Promise<Lineage> {
  let epicId = options.epic === undefined ? undefined : await requireEpic(root, options.epic);
  if (!options.followUp) return { ...(epicId === undefined ? {} : { epicId }), relevantPaths: [], relevantSpecs: [] };
  const parentId = options.followUp.trim();
  const parent = await readParent(root, parentId);
  if (epicId !== undefined && parent.epicId !== undefined && parent.epicId !== epicId)
    throw new Error(`--epic ${epicId} conflicts with epic ${parent.epicId} of follow-up task ${parentId}.`);
  epicId ??= parent.epicId;
  return {
    ...(epicId === undefined ? {} : { epicId }),
    followUpOf: parentId,
    relevantPaths: Array.isArray(parent.relevantPaths) ? [...parent.relevantPaths] : [],
    relevantSpecs: Array.isArray(parent.relevantSpecs) ? [...parent.relevantSpecs] : [],
  };
}
