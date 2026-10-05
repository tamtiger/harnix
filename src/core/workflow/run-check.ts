import { normalizeCheckCwd } from "src/core/tasks/check-cwd.js";
import { resolveActiveTask, type TaskRecord } from "src/core/tasks/task.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { runCheckProcess, type CheckRunner } from "src/utils/check-runner.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";
import { describeCommand, sameCommand } from "./command-match.js";
import { appendEvidenceFlagsWorkflow } from "./evidence-flags.js";
import { assertRetryAllowed } from "./retry-guard.js";

export type { CheckRunner } from "src/utils/check-runner.js";

const OUTPUT_TAIL_LENGTH = 2000;

export interface RunCheckDependencies {
  runner?: CheckRunner | undefined;
  summary?: string | undefined;
  now?: string | undefined;
  cwd?: string | undefined;
}

export interface RunCheckResult {
  task: TaskRecord;
  evidenceId: string;
  result: "pass" | "fail";
  exitCode: number;
  outputTail: string;
}

function safeCwd(value: string, label: string): string {
  try {
    return normalizeCheckCwd(value);
  } catch {
    throw new Error(`${label} is not a safe repository-relative cwd.`);
  }
}

/** Working directory of a run: the declared cwd of the check only. A run-time --cwd may repeat it but never change it. */
async function resolveRunCwd(
  root: string,
  checkId: string,
  declared: string | undefined,
  requested: string | undefined,
): Promise<string> {
  const declaredCwd = declared === undefined ? undefined : safeCwd(declared, `The cwd declared by check ${checkId}`);
  if (requested !== undefined) {
    const requestedCwd = safeCwd(requested, "workflow --run-check --cwd");
    if (declaredCwd === undefined)
      throw new Error(`Check ${checkId} declares no cwd; declare it first with --set-check --cwd.`);
    if (requestedCwd !== declaredCwd)
      throw new Error(`workflow --run-check --cwd differs from the cwd declared by check ${checkId}.`);
  }
  return declaredCwd === undefined || declaredCwd === "." ? root : resolveSafeProjectPath(root, declaredCwd);
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
  const declared = task.validationPlan.find((check) => check.id === checkId);
  if (!declared) throw new Error(`Workflow run-check check ${checkId} is not declared.`);
  assertRetryAllowed(task, checkId);
  if (declared.command !== undefined && !sameCommand(declared.command, argv)) {
    throw new Error(`Workflow run-check command differs from the command declared by check ${checkId}.`);
  }
  const runCwd = await resolveRunCwd(root, checkId, declared.cwd, dependencies.cwd);
  const before = (await computeInputDigest(root, task, checkId)).inputDigest;
  const run = await (dependencies.runner ?? runCheckProcess)(executable, args, runCwd);
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
      summary: dependencies.summary ?? `${describeCommand(argv)} — exit ${run.exitCode}`,
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
