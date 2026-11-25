import { resolveActiveTask } from "src/core/tasks/task.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";

import { noActiveTaskError } from "./no-active-task.js";
import { transitionWorkflow } from "./transition.js";

const START_HINT: Record<string, string> = {
  planning:
    "Persist ready first: harnix workflow --transition ready/ready (a Full task adds --reviewed and stops for the plan review).",
  ready:
    "The latest request must authorize implementation, then: harnix workflow --transition in_progress/implementing; the batch never starts it.",
};

/**
 * The state a batch that starts with `--run-checks` needs: an implementing task is moved to verifying/verifying first
 * (the same transition the agent would persist by hand, with every gate it has), a verifying task stays. A task that
 * has not started, or is already finished, is refused before any check runs, because the batch must not stand in for
 * the ready gate, the authorization to implement or the review.
 */
export async function prepareChecksBatch(root: string, now?: string): Promise<void> {
  const task = await resolveActiveTask(await resolveSafeHarnixPath(root));
  if (!task) throw noActiveTaskError("Workflow run-checks");
  if (task.status === "verifying") return;
  if (task.status === "in_progress") {
    await transitionWorkflow(root, "verifying", "verifying", now);
    return;
  }
  throw new Error(
    `workflow --run-checks with --criterion, --transition or --finish needs a task that is in_progress or verifying (this one is ${task.status}); nothing was run.\nGợi ý: ${START_HINT[task.status] ?? "A finished task has nothing left to run; use harnix status --checks."}`,
  );
}
