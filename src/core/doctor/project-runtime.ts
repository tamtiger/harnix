import { finding, type DoctorFinding } from "src/core/doctor/findings.js";
import { runGit } from "src/utils/git.js";

const ACTIVE_POINTER = ".harnix/tasks/.active";

/** Runs a read-only git command in the project root and returns its stdout; injected so tests need no repository. */
export type GitReader = (root: string, args: readonly string[]) => Promise<string>;

/**
 * `.harnix/tasks/.active` is a per-person pointer: once git tracks it, every task switch shows up as a change and it
 * travels into other people's checkouts. A repository without git (or no answer) is not a finding.
 */
export async function inspectTrackedRuntimeFiles(
  root: string,
  findings: DoctorFinding[],
  git: GitReader = (cwd, args) => runGit(cwd, args),
): Promise<void> {
  let tracked: string;
  try {
    tracked = await git(root, ["ls-files", "--", ACTIVE_POINTER]);
  } catch {
    return;
  }
  if (tracked.split(/\r?\n/u).some((line) => line.trim() === ACTIVE_POINTER))
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
