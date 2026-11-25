import {
  briefTask,
  prepareChecksBatch,
  type RunCheckResult,
  type RunChecksResult,
} from "src/commands/internal-workflow.js";

/** What `--run-check` prints: the brief task line, the outcome, and for a failure its short tail and the log path. */
export function presentRun(run: RunCheckResult): unknown {
  return {
    ...briefTask(run.task, run.evidenceId),
    result: run.result,
    exitCode: run.exitCode,
    ...(run.result === "fail" ? { outputTail: run.outputTail } : {}),
    ...(run.logPath === undefined ? {} : { logPath: run.logPath }),
  };
}

/** True when `--run-checks` is the first step of a longer finish batch (criterion, transition, finish after it). */
export const isChecksBatch = (actions: readonly string[]): boolean => actions[0] === "runChecks" && actions.length > 1;

/** Before the first check of a batch: an implementing task moves to verifying, a task that has not started is refused. */
export async function prepareBatch(root: string, actions: readonly string[]): Promise<void> {
  if (isChecksBatch(actions)) await prepareChecksBatch(root);
}

/**
 * What to print when a failing check stops a finish batch (the report of the checks plus the steps that were not
 * taken), or undefined to carry on with the next step.
 */
export function stoppedBatch(action: string, actions: readonly string[], result: unknown): unknown {
  if (action !== "runChecks" || !isChecksBatch(actions)) return undefined;
  const report = result as RunChecksResult;
  if (!report.ran.some((check) => check.result === "fail")) return undefined;
  return { ...report, skipped: actions.slice(1) };
}
