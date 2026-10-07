import { readdir, readFile, stat } from "node:fs/promises";

import { selectLatestEvidence, validateTask, type TaskRecord, type TaskRecordV3 } from "src/core/tasks/task.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";
import { normalizeCommand } from "./command-match.js";

const MAX_SCANNED_TASKS = 8;
const MAX_TASK_RECORD_BYTES = 1_048_576;
const TASK_ID = /^\d{8}-\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

type Check = TaskRecordV3["validationPlan"][number];

async function finishedTasks(harnixRoot: string, activeId: string): Promise<TaskRecordV3[]> {
  const tasksRoot = await resolveSafeProjectPath(harnixRoot, "tasks");
  const ids = (await readdir(tasksRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && TASK_ID.test(entry.name) && entry.name !== activeId)
    .map((entry) => entry.name)
    .sort()
    .reverse()
    .slice(0, MAX_SCANNED_TASKS);
  const tasks: TaskRecordV3[] = [];
  for (const id of ids) {
    try {
      const path = await resolveSafeProjectPath(harnixRoot, `tasks/${id}/task.json`);
      if ((await stat(path)).size > MAX_TASK_RECORD_BYTES) continue;
      const task: TaskRecord = validateTask(JSON.parse(await readFile(path, "utf8")) as unknown);
      if (task.schemaVersion === 3 && (task.status === "completed" || task.status === "cancelled")) tasks.push(task);
    } catch {
      // An unreadable or invalid record only means one task fewer to look at.
    }
  }
  return tasks;
}

/** The same suite (full scope, same command) as `suite`, if the task declared one. */
function sameSuite(task: TaskRecordV3, suite: Check): Check | undefined {
  const wanted = normalizeCommand(suite.command ?? "");
  return task.validationPlan.find(
    (check) => check.scope === "full" && check.command !== undefined && normalizeCommand(check.command) === wanted,
  );
}

function wasRed(task: TaskRecordV3, check: Check): boolean {
  if (check.baseline?.result === "fail") return true;
  return selectLatestEvidence(task.evidence, check.id, Date.now())?.result === "fail";
}

/**
 * One line telling the agent to ask the user for an authorized baseline when the suite of the task in progress was
 * already red in the two latest finished tasks, instead of working around the red suite task after task. It only
 * reads local task records and never changes anything.
 */
export async function baselineHint(root: string, task: TaskRecord): Promise<string | undefined> {
  if (task.schemaVersion !== 3 || (task.status !== "in_progress" && task.status !== "verifying")) return undefined;
  const suites = task.validationPlan.filter(
    (check) => check.scope === "full" && check.command !== undefined && check.baseline?.authorizedBy === undefined,
  );
  if (suites.length === 0) return undefined;
  try {
    const finished = await finishedTasks(await resolveSafeHarnixPath(root), task.id);
    for (const suite of suites) {
      const recent = finished
        .map((candidate) => ({ candidate, check: sameSuite(candidate, suite) }))
        .filter((entry): entry is { candidate: TaskRecordV3; check: Check } => entry.check !== undefined)
        .slice(0, 2);
      if (recent.length === 2 && recent.every(({ candidate, check }) => wasRed(candidate, check)))
        return `Suite '${suite.id}' was red in the last 2 finished tasks; if it is still red before your change, ask the user to authorize it once: harnix workflow --set-baseline ${suite.id} --result fail --classification pre-existing --authorized-by user --scope "<why>" (never set it yourself).`;
    }
  } catch {
    return undefined;
  }
  return undefined;
}
