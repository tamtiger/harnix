import { readFile } from "node:fs/promises";
import type { TaskArtifacts, TaskRecord } from "../tasks/task.js";
import { isMissing, planHasChecklistItem } from "../tasks/workflow-helpers.js";
import { resolveSafeProjectPath } from "../../utils/paths.js";

/** Ready needs obligations and, for Full, free-form non-empty prd/plan with a checklist; there is no trace grammar. */
export async function assertReadyRequirements(
  harnixRoot: string,
  task: TaskRecord,
  artifacts?: TaskArtifacts,
): Promise<void> {
  if (task.acceptanceCriteria.length === 0)
    throw new Error("Workflow ready requires at least one acceptance criterion.");
  if (!task.validationPlan.some((check) => check.required))
    throw new Error("Workflow ready requires at least one required validation check.");
  if (task.mode !== "full") return;

  try {
    const taskDirectory = await resolveSafeProjectPath(harnixRoot, `tasks/${task.id}`);
    const prdPath = await resolveSafeProjectPath(taskDirectory, "prd.md");
    const planPath = await resolveSafeProjectPath(taskDirectory, "plan.md");
    const [prd, plan] = await Promise.all([
      artifacts?.prd ?? readFile(prdPath, "utf8"),
      artifacts?.plan ?? readFile(planPath, "utf8"),
    ]);
    if (!prd.trim() || !plan.trim()) throw new Error("Full tasks require non-empty prd.md and plan.md at ready.");
    if (!planHasChecklistItem(plan))
      throw new Error("Full task plan.md needs at least one checklist item ('- [ ] ...') at ready.");
  } catch (error: unknown) {
    if (isMissing(error)) throw new Error("Full tasks require non-empty prd.md and plan.md at ready.");
    throw error;
  }
}
