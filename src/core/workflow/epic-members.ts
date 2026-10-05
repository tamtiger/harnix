import { rm } from "node:fs/promises";
import { loadTask, saveTask, type TaskRecord } from "src/core/tasks/task.js";
import { isMissing, semanticTaskEqual } from "src/core/tasks/workflow-helpers.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";

type MemberWriter = (harnixRoot: string, task: TaskRecord) => Promise<void>;

async function loadPersisted(harnixRoot: string, id: string): Promise<TaskRecord | undefined> {
  try {
    return await loadTask(await resolveSafeProjectPath(harnixRoot, `tasks/${id}/task.json`));
  } catch (error: unknown) {
    if (isMissing(error)) return undefined;
    throw error;
  }
}

/**
 * Validates every planned epic member before anything is written and returns those that do not exist yet. A member
 * that already exists is accepted only as an identical replay; a different one is never overwritten, because its
 * evidence and status belong to the user.
 */
export async function prepareEpicMembers(
  harnixRoot: string,
  members: readonly TaskRecord[],
  targetEpicId: string | undefined,
): Promise<TaskRecord[]> {
  const created: TaskRecord[] = [];
  const seen = new Set<string>();
  for (const member of members) {
    if (member.schemaVersion !== 3 || member.status !== "planning") {
      throw new Error(`Epic member task ${member.id} must be schemaVersion 3 and in planning status.`);
    }
    if (targetEpicId && member.epicId !== targetEpicId) {
      throw new Error(`Epic member task ${member.id} epicId must match ${targetEpicId}.`);
    }
    if (seen.has(member.id)) throw new Error(`Epic member task ${member.id} is listed more than once.`);
    seen.add(member.id);
    const persisted = await loadPersisted(harnixRoot, member.id);
    if (persisted === undefined) created.push(member);
    else if (!semanticTaskEqual(persisted, member)) {
      throw new Error(
        `Epic member task ${member.id} already exists and differs from the planned member; it is not overwritten.`,
      );
    }
  }
  return created;
}

/** Writes new members in order; if one write fails, the members this call already created are removed again. */
export async function writeEpicMembers(
  harnixRoot: string,
  members: readonly TaskRecord[],
  write: MemberWriter = saveTask,
): Promise<string[]> {
  const written: string[] = [];
  try {
    for (const member of members) {
      await write(harnixRoot, member);
      written.push(member.id);
    }
  } catch (error: unknown) {
    await removeEpicMembers(harnixRoot, written);
    throw error;
  }
  return written;
}

/** Removes the task directories this save created; callers pass only ids prepared as new. */
export async function removeEpicMembers(harnixRoot: string, ids: readonly string[]): Promise<void> {
  for (const id of ids)
    await rm(await resolveSafeProjectPath(harnixRoot, `tasks/${id}`), { force: true, recursive: true });
}
