import { parsePorcelainV2 } from "src/core/tasks/code-impact.js";
import { runGit } from "src/utils/git.js";

/** Runs `git <args>` in a directory and resolves with stdout; rejects on a failure. */
export type SecretScanGitRunner = (cwd: string, args: readonly string[]) => Promise<string>;

const GIT_TIMEOUT_MS = 2000;
const PREFIX_ARGS = ["--no-optional-locks", "rev-parse", "--show-prefix"] as const;
const STATUS_ARGS = ["--no-optional-locks", "status", "--porcelain=v2", "--untracked-files=all", "-z"] as const;

const defaultRunner: SecretScanGitRunner = (cwd, args) => runGit(cwd, args, GIT_TIMEOUT_MS);

/**
 * The repository-relative paths that differ from HEAD (modified, staged and untracked), so the secret scan can skip
 * files the task never touched. Undefined when Git cannot answer (no repository, a project below the repository
 * root, a failure), in which case the caller scans every file as before.
 */
export async function changedPaths(
  root: string,
  run: SecretScanGitRunner = defaultRunner,
): Promise<Set<string> | undefined> {
  try {
    // allSettled, not all: a failed command must not return while its sibling still holds the directory as its cwd.
    const [prefix, status] = await Promise.allSettled([run(root, PREFIX_ARGS), run(root, STATUS_ARGS)]);
    if (prefix.status === "rejected" || status.status === "rejected" || prefix.value.trim() !== "") return undefined;
    return new Set(parsePorcelainV2(status.value).keys());
  } catch {
    return undefined;
  }
}
