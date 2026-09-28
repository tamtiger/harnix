import { readConfig } from "../core/config/config.js";
import { createActiveStatus, createNoActiveStatus, inspectRequiredCheckEvidence, type HarnixStatusResultV1 } from "../core/status.js";
import { resolveActiveTask, TaskValidationError } from "../core/tasks/task.js";
import { taskContextDrift } from "../core/workflow.js";
import { findInitializedProject } from "../utils/project-discovery.js";
import { resolveSafeHarnixPath } from "../utils/paths.js";
import { reportProjectChecks, type ChecksReportResultV1 } from "./checks.js";
import { auditProjectTask } from "./audit.js";
import type { TaskAuditResultV1 } from "../core/tasks/task-audit.js";

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

export interface StatusExplainResultV1 extends HarnixStatusResultV1 {
  readonly explain: {
    readonly checks: ChecksReportResultV1;
    readonly audit: TaskAuditResultV1;
  };
}

/**
 * `harnix status --explain` supersedes the former standalone `checks` and `audit`
 * commands: it returns the ordinary status projection plus the required-check
 * freshness and readiness/completion-blocker detail under one bounded payload.
 */
export async function explainProjectStatus(cwd: string, limit: number, now = Date.now()): Promise<StatusExplainResultV1> {
  try {
    const status = await inspectProjectStatus(cwd, now);
    const checks = await reportProjectChecks(cwd, limit, now);
    const audit = await auditProjectTask(cwd, now);
    return { ...status, explain: { checks, audit } };
  } catch (error: unknown) {
    // Preserve the redaction the former `checks`/`audit` commands guaranteed: a corrupt
    // task record must never surface its raw bytes through the explain projection.
    if (error instanceof SyntaxError || (error instanceof TaskValidationError && error.cause instanceof SyntaxError)) {
      throw new Error("Status task state is unavailable; run harnix doctor.");
    }
    throw error;
  }
}
