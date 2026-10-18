import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface GitContext {
  branch: string;
  clean: boolean;
  commit: string;
}

/**
 * Safely reads read-only Git context (current branch, clean status, short commit hash).
 * Returns undefined if cwd is not a Git repository or Git is unavailable.
 */
export async function readGitContext(cwd: string): Promise<GitContext | undefined> {
  try {
    const [commitResult, branchResult, statusResult] = await Promise.all([
      execFileAsync("git", ["rev-parse", "--short", "HEAD"], { cwd, windowsHide: true, timeout: 2000 }).catch(
        () => undefined,
      ),
      execFileAsync("git", ["branch", "--show-current"], { cwd, windowsHide: true, timeout: 2000 }).catch(
        () => undefined,
      ),
      execFileAsync("git", ["status", "--porcelain"], { cwd, windowsHide: true, timeout: 2000 }).catch(
        () => undefined,
      ),
    ]);

    if (!commitResult || commitResult.stdout.trim().length === 0) {
      return undefined;
    }

    const commit = commitResult.stdout.trim();
    let branch = branchResult?.stdout.trim() ?? "";
    if (branch.length === 0) {
      branch = `HEAD (${commit})`;
    }

    const clean = (statusResult?.stdout.trim().length ?? 0) === 0;

    return { branch, clean, commit };
  } catch {
    return undefined;
  }
}
