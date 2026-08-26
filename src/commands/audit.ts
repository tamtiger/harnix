import { readConfig } from "../core/config/config.js";
import { createNoActiveTaskAudit, createTaskAudit, type TaskAuditResultV1 } from "../core/tasks/task-audit.js";
import { resolveActiveTask } from "../core/tasks/task.js";
import { findInitializedProject } from "../utils/project-discovery.js";
import { resolveSafeHarnixPath } from "../utils/paths.js";

export async function auditProjectTask(cwd: string, now = Date.now()): Promise<TaskAuditResultV1> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready") throw new Error("Audit requires an initialized Harnix project.");
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));
  const task = await resolveActiveTask(harnixRoot);
  return task === undefined ? createNoActiveTaskAudit() : createTaskAudit(project.root, harnixRoot, task, now);
}
