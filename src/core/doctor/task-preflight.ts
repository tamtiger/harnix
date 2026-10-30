import { readFile } from "node:fs/promises";

import { finding, type DoctorFinding } from "src/core/doctor/findings.js";
import { taskDisplayPath, taskFilePath } from "src/core/tasks/task-location.js";
import type { TaskRecord } from "src/core/tasks/task.js";
import { findSimilarTasks } from "src/core/workflow/similar-tasks.js";
import { missingCriteriaInPlan } from "src/core/workflow/ready-content.js";
import { compareCodeUnits } from "src/utils/order.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";

const isOpen = (task: TaskRecord): boolean => task.status !== "completed" && task.status !== "cancelled";
const isDraft = (task: TaskRecord): boolean => task.status === "planning" || task.status === "ready";

/** The one non-root package whose directory holds every input, or undefined when inputs span packages or the root. */
function packageOfInputs(inputs: readonly string[], packagePaths: readonly string[]): string | undefined {
  const packages = packagePaths.map((path) => path.replace(/^\.\//u, "")).filter((path) => path !== "." && path !== "");
  const owners = inputs.map(
    (input) =>
      packages
        .filter((path) => input === path || input.startsWith(`${path}/`))
        .sort((left, right) => right.length - left.length)[0],
  );
  const first = owners[0];
  return first !== undefined && owners.every((owner) => owner === first) ? first : undefined;
}

function cwdFindings(task: TaskRecord, packagePaths: readonly string[], findings: DoctorFinding[]): void {
  if (packagePaths.length < 2 || task.schemaVersion === 1) return;
  for (const check of task.validationPlan) {
    if (!("inputs" in check) || check.command === undefined || check.cwd !== undefined) continue;
    const owner = packageOfInputs(check.inputs, packagePaths);
    if (owner === undefined) continue;
    findings.push(
      finding(
        "task-check-cwd-missing",
        "warning",
        taskDisplayPath(task.id, "task.json"),
        `Check ${check.id} only reads inside ${owner} but declares no cwd; set --cwd ${owner} so its command runs in that package.`,
        false,
      ),
    );
  }
}

async function planFindings(root: string, task: TaskRecord, findings: DoctorFinding[]): Promise<void> {
  if (task.mode !== "full") return;
  let plan: string;
  try {
    plan = await readFile(await taskFilePath(await resolveSafeHarnixPath(root), task.id, "plan.md"), "utf8");
  } catch {
    return; // a missing artifact is task-full-artifact-missing
  }
  if (plan.trim() === "") return;
  const missing = missingCriteriaInPlan(task, plan);
  if (missing.length === 0) return;
  findings.push(
    finding(
      "task-plan-criterion-missing",
      "warning",
      taskDisplayPath(task.id, "plan.md"),
      `plan.md never mentions criterion ${missing.map((id) => `'${id}'`).join(", ")}; add the id to a plan.md checklist item.`,
      false,
    ),
  );
}

function duplicateFindings(tasks: readonly TaskRecord[], findings: DoctorFinding[]): void {
  const drafts = tasks.filter(isDraft).sort((left, right) => compareCodeUnits(left.id, right.id));
  drafts.forEach((task, index) => {
    const older = drafts.slice(0, index).map(({ id, status, title, goal }) => ({ id, status, title, goal }));
    for (const match of findSimilarTasks(task, older))
      findings.push(
        finding(
          "task-near-duplicate",
          "warning",
          taskDisplayPath(task.id, "task.json"),
          `Task looks like ${match.id} (${match.status}, similarity ${match.score.toFixed(2)}); reuse it with --set-goal --task ${match.id} or cancel one with --cancel --task <id>.`,
          false,
        ),
      );
  });
}

/**
 * Warnings about unfinished tasks that would only fail later: a package check without cwd, a Full plan.md that skips a
 * criterion, and two planning/ready tasks that describe the same work. `packagePaths` are the config's package roots.
 */
export async function inspectTaskPreflight(
  root: string,
  tasks: ReadonlyMap<string, TaskRecord>,
  packagePaths: readonly string[],
  findings: DoctorFinding[],
): Promise<void> {
  const open = [...tasks.values()].filter(isOpen).sort((left, right) => compareCodeUnits(left.id, right.id));
  for (const task of open) {
    cwdFindings(task, packagePaths, findings);
    await planFindings(root, task, findings);
  }
  duplicateFindings(open, findings);
}
