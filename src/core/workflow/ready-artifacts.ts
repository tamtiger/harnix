import { readFile } from "node:fs/promises";

import type { TaskArtifacts, TaskRecord } from "src/core/tasks/task.js";
import { planHasChecklistItem } from "src/core/tasks/workflow-helpers.js";
import { resolveSafeProjectPath } from "src/utils/paths.js";

import {
  criteriaWithoutFocusedCheck,
  missingCriteriaInPlan,
  scanPlaceholders,
  type ContentFindings,
} from "./ready-content.js";

const FULL_ARTIFACTS_MESSAGE = "Full tasks require non-empty prd.md and plan.md at ready.";
const CHECKLIST_MESSAGE = "Full task plan.md needs at least one checklist item ('- [ ] ...') at ready.";

async function loadFullArtifacts(
  harnixRoot: string,
  task: TaskRecord,
  artifacts: TaskArtifacts | undefined,
): Promise<{ prd: string; plan: string } | undefined> {
  try {
    const taskDirectory = await resolveSafeProjectPath(harnixRoot, `tasks/${task.id}`);
    const prdPath = await resolveSafeProjectPath(taskDirectory, "prd.md");
    const planPath = await resolveSafeProjectPath(taskDirectory, "plan.md");
    const [prd, plan] = await Promise.all([
      artifacts?.prd ?? readFile(prdPath, "utf8").catch(() => ""),
      artifacts?.plan ?? readFile(planPath, "utf8").catch(() => ""),
    ]);
    return { prd, plan };
  } catch {
    return undefined;
  }
}

function focusedCheckFindings(task: TaskRecord): ContentFindings {
  const messages = criteriaWithoutFocusedCheck(task).map((id) => `criterion '${id}' has no focused required check`);
  return task.mode === "full" ? { issues: messages, advisories: [] } : { issues: [], advisories: messages };
}

/**
 * What the ready gate finds in the task's own artifacts. Presence and checklist rules always apply to a Full task;
 * the content rules (placeholders, criterion ids named in the plan, a focused check per criterion) apply only when
 * the task is entering ready/ready, so a task already at ready is never blocked from an unrelated save.
 */
export async function artifactFindings(
  harnixRoot: string,
  task: TaskRecord,
  artifacts: TaskArtifacts | undefined,
  entering: boolean,
): Promise<ContentFindings> {
  if (task.mode !== "full") return entering ? focusedCheckFindings(task) : { issues: [], advisories: [] };
  const loaded = await loadFullArtifacts(harnixRoot, task, artifacts);
  if (loaded === undefined || !loaded.prd.trim() || !loaded.plan.trim())
    return { issues: [FULL_ARTIFACTS_MESSAGE], advisories: [] };
  if (!planHasChecklistItem(loaded.plan)) return { issues: [CHECKLIST_MESSAGE], advisories: [] };
  if (!entering) return { issues: [], advisories: [] };
  const prd = scanPlaceholders("prd.md", loaded.prd);
  const plan = scanPlaceholders("plan.md", loaded.plan);
  const focused = focusedCheckFindings(task);
  return {
    issues: [
      ...prd.issues,
      ...plan.issues,
      ...missingCriteriaInPlan(task, loaded.plan).map((id) => `plan.md never mentions criterion '${id}'`),
      ...focused.issues,
    ],
    advisories: [...prd.advisories, ...plan.advisories],
  };
}
