import { AsyncLocalStorage } from "node:async_hooks";

/**
 * One harnix command reads a task, decides and then saves it. Two commands running at once would otherwise both save
 * from the same read, and the later save would silently drop the earlier change. Inside `trackTaskReads` the first raw
 * text seen for each task id is the command's base; a save whose file no longer holds that text is refused with
 * `TaskConflictError`, and every committed save becomes the new base. Outside a tracked section nothing is checked.
 */
interface Attempt {
  readonly bases: Map<string, string>;
  /** Set by the first committed save: from then on a retry would repeat a write instead of replacing a lost one. */
  wrote: boolean;
}

const reads = new AsyncLocalStorage<Attempt>();

export class TaskConflictError extends Error {}

const MAX_ATTEMPTS = 5;

const newAttempt = (): Attempt => ({ bases: new Map(), wrote: false });

/** A short, growing and jittered wait, so writers that collided do not collide again in lockstep. */
const defaultPause = (attempt: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, attempt * 10 + Math.floor(Math.random() * 20)));

export function trackTaskReads<T>(section: () => Promise<T>): Promise<T> {
  return reads.run(newAttempt(), section);
}

/**
 * Runs a command again (with fresh reads) when another writer committed between its read and its save. An attempt
 * that already saved is never repeated: its conflict is reported instead, since running it twice could apply part of
 * it twice. A caller whose command starts a process wraps only its final save, not the process.
 */
export async function retryOnTaskConflict<T>(
  command: () => Promise<T>,
  pause: (attempt: number) => Promise<void> = defaultPause,
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    const state = newAttempt();
    try {
      return await reads.run(state, command);
    } catch (error: unknown) {
      if (!(error instanceof TaskConflictError) || state.wrote || attempt >= MAX_ATTEMPTS) throw error;
      await pause(attempt);
    }
  }
}

export function noteTaskRead(id: string, raw: string): void {
  const attempt = reads.getStore();
  if (attempt !== undefined && !attempt.bases.has(id)) attempt.bases.set(id, raw);
}

export function noteTaskWritten(id: string, raw: string): void {
  const attempt = reads.getStore();
  if (attempt === undefined) return;
  attempt.bases.set(id, raw);
  attempt.wrote = true;
}

/** `current` is the raw task file read under the workflow lock, or undefined when the task does not exist yet. */
export function assertTaskUnchangedSinceRead(id: string, current: string | undefined): void {
  const base = reads.getStore()?.bases.get(id);
  if (base === undefined || current === undefined || current === base) return;
  throw new TaskConflictError(
    `Task ${id} changed while this command was running (another harnix workflow write finished first); nothing was saved. Rerun the command.`,
  );
}
