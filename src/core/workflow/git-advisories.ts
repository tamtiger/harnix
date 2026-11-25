import type { TaskRecord } from "src/core/tasks/task.js";

import { coveredFiles, expandBraces, relevantPatterns } from "./relevant-paths.js";
import { changedPaths, defaultGitRunner, type SecretScanGitRunner } from "./secret-scan-changes.js";

const MAX_NAMED = 5;
const STALE_AFTER_DAYS = 3;
const DAY_MS = 86_400_000;

/** A task in these statuses has not been authorized to edit the product yet. */
const NOT_STARTED = new Set(["planning", "ready"]);

/**
 * Advisory (never a blocker): files inside the task's `relevantPaths` already differ from HEAD although the task is
 * still `planning` or `ready`, so product edits may have started before the plan was frozen. It compares the working
 * tree with HEAD and does not remember what was dirty before the task, so a tree that was already dirty also speaks;
 * it is silent without Git, without `relevantPaths` and for a clean tree. Only a hint: nothing is added to the task.
 */
export async function earlyEditAdvisories(
  root: string,
  task: TaskRecord,
  git: SecretScanGitRunner = defaultGitRunner,
): Promise<string[]> {
  if (!NOT_STARTED.has(task.status)) return [];
  const patterns = relevantPatterns(task);
  if (patterns.length === 0) return [];
  try {
    const changed = await changedPaths(root, git);
    if (changed === undefined) return [];
    const covered = await coveredFiles(root, patterns);
    const hits = [...changed].filter((path) => !path.startsWith(".harnix/") && covered.has(path)).sort();
    if (hits.length === 0) return [];
    const more = hits.length > MAX_NAMED ? `, +${hits.length - MAX_NAMED} more` : "";
    return [
      `Files inside relevantPaths already changed while the task is ${task.status} (${hits.slice(0, MAX_NAMED).join(", ")}${more}): product edits belong after 'in_progress/implementing'. Ignore this when the changes predate the task.`,
    ];
  } catch {
    return [];
  }
}

/**
 * The first whole second after `createdAt`, as the epoch seconds Git accepts (no instant is formatted here: the clock
 * module owns that). Git compares commit dates in whole seconds and counts a commit made in the creation second itself,
 * which is usually the commit that was just made before the task was created, so only later commits are counted.
 */
function sinceAfter(instant: string): string {
  return String(Math.floor(Date.parse(instant) / 1000) + 1);
}

/**
 * Advisory (never a blocker) for a task still in `planning`: its draft criteria and checks were written a while ago
 * (three days or more) or a commit touched its `relevantPaths` since `createdAt`, so they may no longer match the
 * code. Read-only (`git log --since` on glob pathspecs); silent without Git, without `relevantPaths` or when it
 * cannot tell. Epic members are created up front, which is where this happens.
 */
export async function staleDraftAdvisories(
  root: string,
  task: TaskRecord,
  now: string,
  git: SecretScanGitRunner = defaultGitRunner,
): Promise<string[]> {
  if (task.status !== "planning") return [];
  const patterns = relevantPatterns(task);
  if (patterns.length === 0) return [];
  const created = Date.parse(task.createdAt);
  const current = Date.parse(now);
  if (!Number.isFinite(created) || !Number.isFinite(current)) return [];
  const days = Math.max(0, Math.floor((current - created) / DAY_MS));
  let commits: number;
  try {
    const output = await git(root, [
      "--no-optional-locks",
      "log",
      "--format=%H",
      `--since=${sinceAfter(task.createdAt)}`,
      "--",
      ...patterns.flatMap(expandBraces).map((pattern) => `:(glob)${pattern}`),
    ]);
    commits = output.split("\n").filter((line) => line.trim() !== "").length;
  } catch {
    return [];
  }
  if (days < STALE_AFTER_DAYS && commits === 0) return [];
  return [
    `Draft obligations are ${days} day(s) old and ${commits} commit(s) touched relevantPaths since createdAt: check the criteria, checks and paths against the current code before ready ('harnix skill harnix-plan --reference ready-review').`,
  ];
}
