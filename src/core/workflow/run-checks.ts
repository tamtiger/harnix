import { resolveActiveTask } from "src/core/tasks/task.js";
import { inspectRequiredChecks } from "src/core/verification/check-report.js";
import { type CheckRunner } from "src/utils/check-runner.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { verificationRetryDisposition } from "./completion.js";
import { splitCommand } from "./command-match.js";
import { runCheckWorkflow } from "./run-check.js";

export interface RunChecksDependencies {
  runner?: CheckRunner | undefined;
  now?: string | undefined;
}

export interface RanCheck {
  id: string;
  result: "pass" | "fail";
  exitCode: number;
  /** Only a failing check carries its output, so a pass costs no tokens. */
  outputTail?: string;
}

export interface RunChecksResult {
  ran: RanCheck[];
  remaining: string[];
}

/**
 * Runs every required check that is not currently passing, focused before full and otherwise in declaration order,
 * each exactly like `--run-check` with its declared command and cwd, and stops at the first failure. Nothing runs
 * when any of them is at the circuit breaker or has no command to run.
 */
export async function runChecksWorkflow(
  root: string,
  dependencies: RunChecksDependencies = {},
): Promise<RunChecksResult> {
  const task = await resolveActiveTask(await resolveSafeHarnixPath(root));
  if (!task) throw new Error("Workflow run-checks requires an active task.");
  if (task.schemaVersion !== 3) throw new Error("Workflow --run-checks requires a TaskRecord schema v3 task.");
  const pending = new Set(
    (await inspectRequiredChecks(root, await resolveSafeHarnixPath(root), task))
      .filter((inspection) => inspection.state !== "passed")
      .map((inspection) => inspection.id),
  );
  const todo = task.validationPlan
    .filter((check) => pending.has(check.id))
    .sort((left, right) => Number(right.scope === "focused") - Number(left.scope === "focused"));
  for (const check of todo) {
    if (verificationRetryDisposition(task, check.id, Date.now()) === "stop")
      throw new Error(
        `Check ${check.id} failed twice in a row; nothing was run. Stop and report to the user, or continue with a user-authorized harnix workflow --replace-check ${check.id} <new-id> --reason "<why>".`,
      );
    if (check.command === undefined)
      throw new Error(`Check ${check.id} declares no command; nothing was run. Declare it with --set-check --command.`);
  }
  const ran: RanCheck[] = [];
  for (const [index, check] of todo.entries()) {
    const run = await runCheckWorkflow(root, check.id, splitCommand(check.command as string), {
      runner: dependencies.runner,
      now: dependencies.now,
    });
    if (run.result === "pass") {
      ran.push({ id: check.id, result: "pass", exitCode: run.exitCode });
      continue;
    }
    ran.push({ id: check.id, result: "fail", exitCode: run.exitCode, outputTail: run.outputTail });
    return { ran, remaining: todo.slice(index + 1).map((rest) => rest.id) };
  }
  return { ran, remaining: [] };
}
