import { AsyncLocalStorage } from "node:async_hooks";

/**
 * One harnix command reads a task, decides and then saves it. Two commands running at once would otherwise both save
 * from the same read, and the later save would silently drop the earlier change. Inside `trackTaskReads` the first raw
 * text seen for each task id is the command's base; a save whose file no longer holds that text is refused with
 * `TaskConflictError`, and every committed save becomes the new base. Outside a tracked section nothing is checked.
 */
const reads = new AsyncLocalStorage<Map<string, string>>();

export class TaskConflictError extends Error {}

const MAX_ATTEMPTS = 5;

export function trackTaskReads<T>(section: () => Promise<T>): Promise<T> {
  return reads.run(new Map(), section);
}

/** Runs a whole command again (with fresh reads) when another writer committed between its read and its save. */
export async function retryOnTaskConflict<T>(command: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await trackTaskReads(command);
    } catch (error: unknown) {
      if (!(error instanceof TaskConflictError) || attempt >= MAX_ATTEMPTS) throw error;
    }
  }
}

export function noteTaskRead(id: string, raw: string): void {
  const seen = reads.getStore();
  if (seen !== undefined && !seen.has(id)) seen.set(id, raw);
}

export function noteTaskWritten(id: string, raw: string): void {
  reads.getStore()?.set(id, raw);
}

/** `current` is the raw task file read under the workflow lock, or undefined when the task does not exist yet. */
export function assertTaskUnchangedSinceRead(id: string, current: string | undefined): void {
  const base = reads.getStore()?.get(id);
  if (base === undefined || current === undefined || current === base) return;
  throw new TaskConflictError(
    `Task ${id} changed while this command was running (another harnix workflow write finished first); nothing was saved. Rerun the command.`,
  );
}
