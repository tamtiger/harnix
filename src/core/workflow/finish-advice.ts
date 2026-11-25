import { lstat } from "node:fs/promises";
import { join } from "node:path";

import type { TaskRecord } from "src/core/tasks/task.js";

import { coveredFiles, relevantPatterns } from "./relevant-paths.js";
import { changedPaths, type SecretScanGitRunner } from "./secret-scan-changes.js";

const MAX_OUTSIDE = 10;

export interface FinishCommitAdvice {
  /** A commit message proposal: the task title. Advice only; finish never commits. */
  suggestedMessage: string;
  /** Files changed since HEAD that no relevantPaths pattern covers (at most ten, path order); absent when none. */
  outsidePaths?: string[];
}

async function exists(root: string, path: string): Promise<boolean> {
  try {
    await lstat(join(root, path));
    return true;
  } catch {
    return false;
  }
}

/**
 * What to tell the user at finish: a commit message proposal and the changed files outside the task's declared
 * relevantPaths, so a stray edit is noticed before the commit. Read-only, bounded, never a reason to refuse a finish;
 * without relevantPaths or without Git the outside check is simply skipped. `.harnix/` always changes and is ignored.
 */
export async function finishCommitAdvice(
  root: string,
  task: TaskRecord,
  git?: SecretScanGitRunner,
): Promise<FinishCommitAdvice> {
  const advice: FinishCommitAdvice = { suggestedMessage: task.title };
  const patterns = relevantPatterns(task);
  if (patterns.length === 0) return advice;
  try {
    const changed = await changedPaths(root, git);
    if (changed === undefined) return advice;
    const covered = await coveredFiles(root, patterns);
    const candidates = [...changed].filter((path) => !path.startsWith(".harnix/") && !covered.has(path)).sort();
    const outside: string[] = [];
    for (const path of candidates) {
      if (outside.length >= MAX_OUTSIDE) break;
      // A deleted file cannot be matched against the globs (they list existing files), so it is never called outside.
      if (await exists(root, path)) outside.push(path);
    }
    return outside.length === 0 ? advice : { ...advice, outsidePaths: outside };
  } catch {
    return advice;
  }
}
