import { join } from "node:path";
import { acquireHarnixFileLock } from "src/utils/file-lock.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";

/**
 * Runs a task-state mutation under the one lock of a project's `.harnix`, so `--save`, `--finish` and `--cancel`
 * cannot interleave: whoever holds the lock reads the persisted task, decides and writes without another writer
 * slipping in between. The lock is not re-entrant; a section must not call another locked transport.
 *
 * The lock lives inside the project (`.harnix/tmp`, git-ignored) rather than in the temporary directory of the
 * process: TMPDIR/TEMP differ between a sandboxed agent and a terminal, and a path spelled another way (case,
 * symlink, junction) names the same directory, so every writer of the project meets the same lock.
 */
export async function withWorkflowLock<T>(harnixRoot: string, section: () => Promise<T>): Promise<T> {
  // Only the stable `tmp` directory is checked: the lock directory itself appears and disappears while writers race.
  const lock = await acquireHarnixFileLock(join(await resolveSafeProjectPath(harnixRoot, "tmp"), "workflow.lock"));
  try {
    return await section();
  } finally {
    await lock.release();
  }
}
