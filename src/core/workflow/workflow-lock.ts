import { tmpdir } from "node:os";
import { join } from "node:path";
import { acquireHarnixFileLock } from "src/utils/file-lock.js";
import { sha256 } from "src/utils/hashing.js";

/**
 * Runs a task-state mutation under the one lock of a project's `.harnix`, so `--save`, `--finish` and `--cancel`
 * cannot interleave: whoever holds the lock reads the persisted task, decides and writes without another writer
 * slipping in between. The lock is not re-entrant; a section must not call another locked transport.
 */
export async function withWorkflowLock<T>(harnixRoot: string, section: () => Promise<T>): Promise<T> {
  const lock = await acquireHarnixFileLock(join(tmpdir(), "harnix-workflow-locks", `${sha256(harnixRoot)}.lock`));
  try {
    return await section();
  } finally {
    await lock.release();
  }
}
