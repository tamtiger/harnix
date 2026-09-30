import { resolveActiveTask, type TaskRecord } from "src/core/tasks/task.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { runCheckProcess, type CheckRunner } from "src/utils/check-runner.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { appendEvidenceFlagsWorkflow } from "./evidence-flags.js";

export type { CheckRunner } from "src/utils/check-runner.js";

const OUTPUT_TAIL_LENGTH = 2000;

export interface RunCheckDependencies {
  runner?: CheckRunner | undefined;
  summary?: string | undefined;
  now?: string | undefined;
}

export interface RunCheckResult {
  task: TaskRecord;
  evidenceId: string;
  result: "pass" | "fail";
  exitCode: number;
  outputTail: string;
}

/**
 * Snapshot, run, snapshot, record: the evidence is written only when the
 * check ran against unchanged inputs. The output tail is returned to the
 * caller and never persisted because command output can carry secrets.
 */
export async function runCheckWorkflow(
  root: string,
  checkId: string,
  argv: readonly string[],
  dependencies: RunCheckDependencies = {},
): Promise<RunCheckResult> {
  const [executable, ...args] = argv;
  if (executable === undefined) throw new Error("workflow --run-check requires an executable after --.");
  const task = await resolveActiveTask(await resolveSafeHarnixPath(root));
  if (!task) throw new Error("Workflow run-check requires an active task.");
  if (task.schemaVersion !== 3) throw new Error("Workflow --run-check requires a TaskRecord schema v3 task.");
  if (!task.validationPlan.some((check) => check.id === checkId))
    throw new Error(`Workflow run-check check ${checkId} is not declared.`);
  const before = (await computeInputDigest(root, task, checkId)).inputDigest;
  const run = await (dependencies.runner ?? runCheckProcess)(executable, args, root);
  const after = (await computeInputDigest(root, task, checkId)).inputDigest;
  if (before !== after)
    throw new Error(`Verification inputs for check ${checkId} changed while it ran; nothing was recorded.`);
  const result = run.exitCode === 0 ? "pass" : "fail";
  const appended = await appendEvidenceFlagsWorkflow(
    root,
    {
      check: checkId,
      result,
      exitCode: String(run.exitCode),
      summary: dependencies.summary ?? `${executable} — exit ${run.exitCode}`,
      digest: before,
    },
    dependencies.now,
  );
  return {
    task: appended.task,
    evidenceId: appended.evidenceId,
    result,
    exitCode: run.exitCode,
    outputTail: run.output.slice(-OUTPUT_TAIL_LENGTH),
  };
}
