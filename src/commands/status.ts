import { readConfig } from "../core/config/config.js";
import { createActiveStatus, createNoActiveStatus, inspectRequiredCheckEvidence, type HarnixStatusResultV1 } from "../core/status.js";
import { resolveActiveTask } from "../core/tasks/task.js";
import { taskContextDrift } from "../core/workflow.js";
import { findInitializedProject } from "../utils/project-discovery.js";
import { resolveSafeHarnixPath } from "../utils/paths.js";

export async function inspectProjectStatus(cwd: string, now = Date.now()): Promise<HarnixStatusResultV1> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw new Error("Status requires an initialized Harnix project.");
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));
  const task = await resolveActiveTask(harnixRoot);
  if (task === undefined) return createNoActiveStatus();
  const contextDrift = await taskContextDrift(project.root, harnixRoot, task);
  const requiredCheckStates = await inspectRequiredCheckEvidence(project.root, harnixRoot, task, now);
  return createActiveStatus(task, contextDrift, requiredCheckStates);
}
