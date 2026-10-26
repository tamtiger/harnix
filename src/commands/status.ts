import { readConfig } from "src/core/config/config.js";
import {
  createActiveStatus,
  createNoActiveStatus,
  inspectRequiredCheckEvidence,
  summarizeStatus,
  type HarnixStatusResultV1,
  type StatusEpicContext,
  type StatusSummaryResultV1,
} from "src/core/status.js";
import { detailPublicEpic, type PublicEpicBriefResult, type PublicEpicDetailResult } from "src/commands/epic.js";
import { listEpicIds } from "src/core/epics/epic.js";
import { resolveActiveTask, TaskValidationError } from "src/core/tasks/task.js";
import { inspectRequiredChecks, type RequiredCheckState } from "src/core/verification/check-report.js";
import { taskContextDrift } from "src/core/workflow/index.js";
import { findInitializedProject, initializedChildrenHint } from "src/utils/project-discovery.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { readGitContext, runGit } from "src/utils/git.js";
import {
  readWorkspaceGitStatus,
  type GitRunner,
  type WorkspaceGitStatusResult,
} from "src/core/workspace/git-status.js";
import { resolveWorkspaceRoot } from "src/core/workspace/resolve-root.js";
import { reportProjectChecks, type ChecksReportResultV1 } from "./checks.js";
import { auditProjectTask } from "./audit.js";
import type { TaskAuditResultV1 } from "src/core/tasks/task-audit.js";

/** Read-only Git table of the sub-repositories below a workspace root; needs no initialized project. */
export async function inspectWorkspaceGitStatus(
  cwd: string,
  workspacePath: string | undefined,
  run: GitRunner = runGit,
): Promise<WorkspaceGitStatusResult> {
  return readWorkspaceGitStatus(await resolveWorkspaceRoot(cwd, workspacePath), run);
}

export async function inspectProjectStatus(cwd: string, now = Date.now()): Promise<HarnixStatusResultV1> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready")
    throw new Error(`Status requires an initialized Harnix project.${await initializedChildrenHint(cwd)}`);
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  await readConfig(await resolveSafeHarnixPath(project.root, "config.yaml"));
  const task = await resolveActiveTask(harnixRoot);
  if (task === undefined) {
    let epicContext;
    try {
      const epics = await listEpicIds(harnixRoot);
      for (const epicId of epics) {
        const detail = (await detailPublicEpic(project.root, epicId, true)) as PublicEpicBriefResult;
        if (detail.nextTask !== null) {
          epicContext = {
            id: epicId,
            title: detail.epic.title,
            nextTask: detail.nextTask,
            resumeCommand: `harnix resume ${detail.nextTask.id}`,
          };
          break;
        }
      }
    } catch {
      // Best effort
    }
    const noActive = createNoActiveStatus(epicContext);
    const git = await readGitContext(project.root);
    return git === undefined ? noActive : { ...noActive, git };
  }
  const contextDrift = await taskContextDrift(project.root, harnixRoot, task);
  const requiredCheckStates = await inspectRequiredCheckEvidence(project.root, harnixRoot, task, now);
  let epicContext: StatusEpicContext | undefined;
  if (task.epicId) {
    try {
      const detail = (await detailPublicEpic(project.root, task.epicId, false)) as PublicEpicDetailResult;
      const index = detail.members.findIndex((m) => m.id === task.id);
      epicContext = {
        id: task.epicId,
        title: detail.epic.title,
        nextTask: detail.nextTask,
        resumeCommand: detail.nextTask ? `harnix resume ${detail.nextTask.id}` : "",
        ...(index >= 0 ? { taskIndex: index + 1 } : {}),
        totalTasks: detail.members.length,
        completedTasks: detail.members.filter((m) => m.status === "completed").length,
      };
    } catch {
      // Best effort
    }
  }
  const activeStatus = createActiveStatus(task, contextDrift, requiredCheckStates, epicContext);
  const git = await readGitContext(project.root);
  return git === undefined ? activeStatus : { ...activeStatus, git };
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
export async function explainProjectStatus(
  cwd: string,
  limit: number,
  now = Date.now(),
): Promise<StatusExplainResultV1> {
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

export async function summarizeProjectStatus(cwd: string, now = Date.now()): Promise<StatusSummaryResultV1> {
  const status = await inspectProjectStatus(cwd, now);
  return summarizeStatus(status);
}

export interface StatusCriteriaItem {
  readonly id: string;
  readonly status: "pending" | "met" | "waived";
  readonly text: string;
  readonly coveredBy: readonly string[];
}

export interface StatusCriteriaResultV1 {
  /** Null, with no criteria, when no task is active: the same "nothing active" answer the other status modes give. */
  readonly taskId: string | null;
  readonly mode?: string;
  readonly status?: string;
  readonly criteria: readonly StatusCriteriaItem[];
}

export async function reportProjectCriteria(cwd: string): Promise<StatusCriteriaResultV1> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready")
    throw new Error(`Status requires an initialized Harnix project.${await initializedChildrenHint(cwd)}`);
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  const task = await resolveActiveTask(harnixRoot);
  if (task === undefined) return { taskId: null, criteria: [] };

  const criteria: StatusCriteriaItem[] = task.acceptanceCriteria.map((c) => {
    const coveringChecks = task.validationPlan
      .filter((check) => check.criterionIds?.includes(c.id) ?? false)
      .map((check) => check.id);
    return {
      id: c.id,
      status: c.status,
      text: c.text,
      coveredBy: coveringChecks,
    };
  });

  return {
    taskId: task.id,
    mode: task.mode,
    status: task.status,
    criteria,
  };
}

export interface StatusChecksItem {
  readonly id: string;
  readonly scope: "focused" | "full";
  readonly required: boolean;
  readonly criterionIds: readonly string[];
  readonly command?: string;
  /** Freshness of a required check; a check that is not required has no state to judge. */
  readonly state: RequiredCheckState | "optional";
}

export interface StatusChecksResultV1 {
  /** Null, with no checks, when no task is active: the same "nothing active" answer the other status modes give. */
  readonly taskId: string | null;
  readonly checks: readonly StatusChecksItem[];
}

/** The compact check list `status --checks` prints, so nobody has to read task.json to see what runs. */
export async function listProjectChecks(cwd: string, now = Date.now()): Promise<StatusChecksResultV1> {
  const project = await findInitializedProject({ cwd });
  if (project.kind !== "ready")
    throw new Error(`Status requires an initialized Harnix project.${await initializedChildrenHint(cwd)}`);
  const harnixRoot = await resolveSafeHarnixPath(project.root);
  const task = await resolveActiveTask(harnixRoot);
  if (task === undefined) return { taskId: null, checks: [] };
  const states = new Map(
    (await inspectRequiredChecks(project.root, harnixRoot, task, now)).map((item) => [item.id, item.state]),
  );
  return {
    taskId: task.id,
    checks: task.validationPlan.map((check) => ({
      id: check.id,
      scope: check.scope,
      required: check.required,
      criterionIds: check.criterionIds ?? [],
      ...(check.command === undefined ? {} : { command: check.command }),
      state: states.get(check.id) ?? "optional",
    })),
  };
}
