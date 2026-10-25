import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface GitContext {
  branch: string;
  clean: boolean;
  commit: string;
}

/**
 * A cloned or copied repository can carry its own `.git/config`; `core.fsmonitor` and `core.untrackedCache` make a plain
 * `git status` run a program or a hook of the repository. Every read-only call turns them off and never lets an
 * inherited git environment point at another repository.
 */
const SAFE_CONFIG = ["-c", "core.fsmonitor=false", "-c", "core.untrackedCache=false"] as const;
const INHERITED_GIT_VARIABLES = ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_EXTERNAL_DIFF"] as const;

export function safeGitArgs(args: readonly string[]): string[] {
  return [...SAFE_CONFIG, ...args];
}

export function safeGitEnvironment(source: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = { ...source, GIT_OPTIONAL_LOCKS: "0", GIT_PAGER: "cat" };
  for (const name of INHERITED_GIT_VARIABLES) delete environment[name];
  return environment;
}

const readOnly = (cwd: string, args: readonly string[], timeout: number) =>
  execFileAsync("git", safeGitArgs(args), {
    cwd,
    env: safeGitEnvironment(),
    maxBuffer: 8 * 1024 * 1024,
    timeout,
    windowsHide: true,
  });

/**
 * A tree whose only changes are tracked files that differ in line endings (CRLF/LF checkout settings) is clean in
 * substance: `git diff --ignore-space-at-eol` finds nothing to commit. Untracked or staged-new files still count.
 */
async function isClean(cwd: string, porcelain: string): Promise<boolean> {
  const lines = porcelain.split(/\r?\n/u).filter((line) => line.length > 0);
  if (lines.length === 0) return true;
  if (lines.some((line) => !/^( M|M |MM)/u.test(line))) return false;
  try {
    await readOnly(cwd, ["diff", "--ignore-space-at-eol", "--quiet", "HEAD"], 2000);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely reads read-only Git context (current branch, clean status, short commit hash).
 * Returns undefined if cwd is not a Git repository or Git is unavailable.
 */
export async function readGitContext(cwd: string): Promise<GitContext | undefined> {
  try {
    const [commitResult, branchResult, statusResult] = await Promise.all([
      readOnly(cwd, ["rev-parse", "--short", "HEAD"], 2000).catch(() => undefined),
      readOnly(cwd, ["branch", "--show-current"], 2000).catch(() => undefined),
      readOnly(cwd, ["status", "--porcelain"], 2000).catch(() => undefined),
    ]);

    if (!commitResult || commitResult.stdout.trim().length === 0) {
      return undefined;
    }

    const commit = commitResult.stdout.trim();
    let branch = branchResult?.stdout.trim() ?? "";
    if (branch.length === 0) {
      branch = `HEAD (${commit})`;
    }

    const clean = await isClean(cwd, statusResult?.stdout ?? "");

    return { branch, clean, commit };
  } catch {
    return undefined;
  }
}

/** Default runner for read-only Git calls: no shell, bounded time, stdout only, repository programs disabled. */
export async function runGit(cwd: string, args: readonly string[], timeout = 5000): Promise<string> {
  return (await readOnly(cwd, args, timeout)).stdout;
}
