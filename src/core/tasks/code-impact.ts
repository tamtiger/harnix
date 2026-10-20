import { runGit } from "src/utils/git.js";
import { compareCodeUnits } from "src/utils/order.js";
import type { CodeImpactItem } from "./task-review.js";

/** Runs `git <args>` in a directory and resolves with stdout; rejects on a non-zero exit, a timeout or a spawn error. */
export type CodeImpactGitRunner = (cwd: string, args: readonly string[]) => Promise<string>;

export interface CodeImpact {
  items: CodeImpactItem[];
  /** Number of changed files beyond {@link CODE_IMPACT_LIMIT} that are not listed. */
  truncated: number;
}

export const CODE_IMPACT_LIMIT = 50;
const GIT_TIMEOUT_MS = 2000;
const STATUS_ARGS = ["--no-optional-locks", "status", "--porcelain=v2", "--untracked-files=all", "-z"] as const;
const PREFIX_ARGS = ["--no-optional-locks", "rev-parse", "--show-prefix"] as const;
const DIFF_ARGS = ["--no-optional-locks", "diff", "--no-ext-diff", "--no-textconv", "--numstat", "-z", "HEAD"] as const;
const READ_ONLY_SUBCOMMANDS = new Set(["status", "diff", "rev-parse"]);

const defaultRunner: CodeImpactGitRunner = (cwd, args) => runGit(cwd, args, GIT_TIMEOUT_MS);

/** Refuses any git invocation that is not a read-only subcommand run without optional index locks. */
export function assertReadOnlyCodeImpactGit(args: readonly string[]): void {
  const subcommand = args.find((arg) => !arg.startsWith("-"));
  if (args[0] !== "--no-optional-locks" || subcommand === undefined || !READ_ONLY_SUBCOMMANDS.has(subcommand))
    throw new Error("Code impact only runs read-only git commands.");
}

function statusOf(code: string): CodeImpactItem["status"] {
  if (code.includes("D")) return "deleted";
  return code.includes("A") || code === "?" ? "added" : "modified";
}

/** The `path` of every changed entry of `git status --porcelain=v2 -z`, with the status its XY code means. */
export function parsePorcelainV2(output: string): Map<string, CodeImpactItem["status"]> {
  const changes = new Map<string, CodeImpactItem["status"]>();
  const tokens = output.split("\0");
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index] ?? "";
    if (token.startsWith("? ")) changes.set(token.slice(2), "added");
    else if (token.startsWith("1 ")) changes.set(token.split(" ").slice(8).join(" "), statusOf(token.slice(2, 4)));
    else if (token.startsWith("2 ")) {
      changes.set(token.split(" ").slice(9).join(" "), statusOf(token.slice(2, 4)));
      index += 1; // the original path of a rename or copy is a separate NUL field
    } else if (token.startsWith("u ")) changes.set(token.split(" ").slice(10).join(" "), "modified");
  }
  return changes;
}

/** `added<TAB>deleted<TAB>path` records of `git diff --numstat -z`; a rename carries an empty path then old and new. */
export function parseNumstat(output: string): Map<string, { additions?: number; deletions?: number }> {
  const stats = new Map<string, { additions?: number; deletions?: number }>();
  const tokens = output.split("\0");
  for (let index = 0; index < tokens.length; index += 1) {
    const match = /^(\d+|-)\t(\d+|-)\t(.*)$/su.exec(tokens[index] ?? "");
    if (!match) continue;
    let path = match[3] ?? "";
    if (path === "") {
      path = tokens[index + 2] ?? "";
      index += 2;
    }
    stats.set(path, match[1] === "-" ? {} : { additions: Number(match[1]), deletions: Number(match[2]) });
  }
  return stats;
}

/**
 * Read-only changes of a project against `HEAD`, for the review page. Returns undefined when nothing changed or when
 * the project is only a subdirectory of the repository (git reports repository-relative paths, so unrelated files
 * would be listed), and null when git cannot answer (outside Git, a failure or a timeout) so the caller keeps what it
 * had. A missing HEAD (no commit yet) only costs the line counts. It never throws: saving a task must not depend on git.
 */
export async function readCodeImpact(
  projectRoot: string,
  run: CodeImpactGitRunner = defaultRunner,
): Promise<CodeImpact | undefined | null> {
  try {
    for (const args of [PREFIX_ARGS, STATUS_ARGS, DIFF_ARGS]) assertReadOnlyCodeImpactGit(args);
    // allSettled, not all: a failed command must not return while its siblings still hold the directory as their cwd.
    const [prefix, status, numstat] = await Promise.allSettled([
      run(projectRoot, PREFIX_ARGS),
      run(projectRoot, STATUS_ARGS),
      run(projectRoot, DIFF_ARGS),
    ]);
    if (prefix.status === "rejected" || status.status === "rejected") return null;
    if (prefix.value.trim() !== "") return undefined;
    const changes = parsePorcelainV2(status.value);
    const stats =
      numstat.status === "fulfilled"
        ? parseNumstat(numstat.value)
        : new Map<string, { additions?: number; deletions?: number }>();
    for (const path of stats.keys()) if (!changes.has(path)) changes.set(path, "modified");
    const items = [...changes]
      .filter(([path]) => path !== ".harnix" && !path.startsWith(".harnix/"))
      .sort(([left], [right]) => compareCodeUnits(left, right))
      .map(([path, itemStatus]): CodeImpactItem => ({ path, status: itemStatus, ...stats.get(path) }));
    if (items.length === 0) return undefined;
    return { items: items.slice(0, CODE_IMPACT_LIMIT), truncated: Math.max(0, items.length - CODE_IMPACT_LIMIT) };
  } catch {
    return null;
  }
}
