import type { TaskMode, TaskRecordV3 } from "src/core/tasks/task.js";

import { renderPlanTemplate, renderPrdTemplate } from "./artifact-templates.js";

export interface InitArtifactText {
  prd?: string | undefined;
  plan?: string | undefined;
}

/**
 * The `prd.md` and `plan.md` a new task starts with: only a Full task has them, each is the given text or else the
 * generated template, and giving text to a Lite task is refused instead of dropped.
 */
export function initArtifacts(
  mode: TaskMode,
  candidate: TaskRecordV3,
  given: InitArtifactText,
): { prd: string; plan: string } | undefined {
  if (mode !== "full") {
    if (given.prd !== undefined || given.plan !== undefined)
      throw new Error("--prd-file and --plan-file require --mode full: a Lite task has no prd.md or plan.md.");
    return undefined;
  }
  return { prd: given.prd ?? renderPrdTemplate(candidate), plan: given.plan ?? renderPlanTemplate(candidate) };
}
