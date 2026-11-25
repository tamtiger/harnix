import type { TaskRecord } from "src/core/tasks/task.js";

import { evidenceModeAdvisories } from "./evidence-mode-advisory.js";
import { earlyEditAdvisories, staleDraftAdvisories } from "./git-advisories.js";
import type { SecretScanGitRunner } from "./secret-scan-changes.js";

/**
 * The advisories a transition target carries: ready/ready (early edits, stale draft), in_progress/implementing (early
 * edits) and verifying/finishing (a code-only or partial run without a risk). A dry run lists them in `advisories`; a
 * real transition prints them as `notice:` lines on stderr. They never change `valid`, the exit code or the task.
 */
export async function transitionAdvisories(
  root: string,
  task: TaskRecord,
  status: string,
  checkpoint: string,
  now: string,
  git?: SecretScanGitRunner,
): Promise<string[]> {
  if (status === "ready" && checkpoint === "ready") {
    return [...(await earlyEditAdvisories(root, task, git)), ...(await staleDraftAdvisories(root, task, now, git))];
  }
  if (status === "in_progress" && checkpoint === "implementing") return earlyEditAdvisories(root, task, git);
  if (status === "verifying" && checkpoint === "finishing") return evidenceModeAdvisories(task);
  return [];
}
