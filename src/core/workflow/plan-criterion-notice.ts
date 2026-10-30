import { readFile } from "node:fs/promises";

import { resolveTaskDirectory } from "src/core/tasks/task-location.js";
import type { TaskRecordV3 } from "src/core/tasks/task.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";

import { missingCriteriaInPlan } from "./ready-content.js";

/** The ready gate's fix for a criterion id that plan.md never mentions. */
export const PLAN_CRITERION_FIX =
  "add the id to a plan.md checklist item, for example '- [ ] [chk-id] what it proves (ac-1)'";

/**
 * After a criterion edit on a Full task, tells (on stderr) which of `ids` plan.md still does not mention. plan.md is a
 * user-owned file, so Harnix never edits it; the notice names what the ready gate would otherwise reject later.
 */
export async function notePlanMissingCriteria(root: string, task: TaskRecordV3, ids: readonly string[]): Promise<void> {
  if (task.mode !== "full") return;
  let plan: string;
  try {
    const directory = await resolveTaskDirectory(await resolveSafeHarnixPath(root), task.id);
    plan = await readFile(await resolveSafeProjectPath(directory, "plan.md"), "utf8");
  } catch {
    return;
  }
  if (plan.trim() === "") return;
  const missing = missingCriteriaInPlan(task, plan).filter((id) => ids.includes(id));
  if (missing.length === 0) return;
  process.stderr.write(
    `notice: plan.md does not mention criterion ${missing.map((id) => `'${id}'`).join(", ")} yet; Harnix does not edit plan.md, so ${PLAN_CRITERION_FIX} before --transition ready/ready.\n`,
  );
}
