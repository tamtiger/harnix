import { finding, type DoctorFinding } from "src/core/doctor/findings.js";
import { runGit } from "src/utils/git.js";

const ACTIVE_POINTER = ".harnix/tasks/.active";
const CACHE_DIRECTORY = ".harnix/cache";

/** Runs a read-only git command in the project root and returns its stdout; injected so tests need no repository. */
export type GitReader = (root: string, args: readonly string[]) => Promise<string>;

/**
 * `.harnix/tasks/.active` is a per-person pointer: once git tracks it, every task switch shows up as a change and it
 * travels into other people's checkouts. `.harnix/cache` holds regenerable data that repo-map rewrites on demand, so
 * tracked files there make every lookup dirty the working tree. A repository without git (or no answer) is not a
 * finding.
 */
export async function inspectTrackedRuntimeFiles(
  root: string,
  findings: DoctorFinding[],
  git: GitReader = (cwd, args) => runGit(cwd, args),
): Promise<void> {
  let tracked: string;
  try {
    tracked = await git(root, ["ls-files", "--", ACTIVE_POINTER, CACHE_DIRECTORY]);
  } catch {
    return;
  }
  const lines = tracked.split(/\r?\n/u).map((line) => line.trim());
  if (lines.includes(ACTIVE_POINTER)) {
    findings.push(
      finding(
        "active-pointer-tracked",
        "warning",
        ACTIVE_POINTER,
        "The per-person active task pointer is tracked by git; add it to .gitignore and run `git rm --cached` on it.",
        false,
      ),
    );
  }
  if (lines.some((line) => line.startsWith(`${CACHE_DIRECTORY}/`))) {
    findings.push(
      finding(
        "cache-tracked",
        "warning",
        CACHE_DIRECTORY,
        "Regenerable files under .harnix/cache are tracked by git; add the directory to .gitignore and run `git rm -r --cached` on it.",
        false,
      ),
    );
  }
}
