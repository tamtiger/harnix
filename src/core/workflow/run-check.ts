import { normalizeCheckCwd } from "src/core/tasks/check-cwd.js";
import { retryOnTaskConflict } from "src/core/tasks/read-tracker.js";
import { unknownIdError } from "src/utils/suggest.js";
import { resolveActiveTask, type TaskRecord, type ValidationCheckV3 } from "src/core/tasks/task.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { saveInputDigestSnapshot } from "src/core/verification/snapshot-cache.js";
import { runCheckProcess, type CheckRunner } from "src/utils/check-runner.js";
import { resolveSafeHarnixPath, resolveSafeProjectPath } from "src/utils/paths.js";
import { removeCheckLog, writeCheckLog } from "./check-log.js";
import { launcherFailure, noTestsRan, summarizeCheckOutput } from "./check-output.js";
import { describeCommand, sameCommand, splitCommand } from "./command-match.js";
import { redactCheckOutput } from "./output-redaction.js";
import { appendEvidenceFlagsWorkflow } from "./evidence-flags.js";
import { assertRetryAllowed } from "./retry-guard.js";
import { noActiveTaskError } from "src/core/workflow/no-active-task.js";

export type { CheckRunner } from "src/utils/check-runner.js";

export interface RunCheckDependencies {
  runner?: CheckRunner | undefined;
  summary?: string | undefined;
  now?: string | undefined;
  cwd?: string | undefined;
  /** Monotonic milliseconds clock for the run duration; tests inject it. */
  monotonicNow?: (() => number) | undefined;
}

export interface RunCheckResult {
  task: TaskRecord;
  evidenceId: string;
  result: "pass" | "fail";
  exitCode: number;
  outputTail: string;
  /** Milliseconds the check's process ran. */
  durationMs: number;
  /** Repository-relative path of the full cleaned output; only for a failing run (see `writeCheckLog`). */
  logPath?: string | undefined;
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

/** A required check must declare the command it runs, and a run must be exactly that command. */
function assertDeclaredCommand(declared: ValidationCheckV3, argv: readonly string[]): void {
  if (declared.command === undefined) {
    if (declared.required)
      throw new Error(
        `Check ${declared.id} declares no command, so a run cannot be tied to it; nothing was run. Declare it first: harnix workflow --set-check ${declared.id} --command "<cmd>" --reason "<why>" (see harnix status --checks).`,
      );
    return;
  }
  if (!sameCommand(declared.command, argv))
    throw new Error(
      `Workflow run-check command differs from the command declared by check ${declared.id}. The declared command is: ${describeCommand(splitCommand(declared.command))}. Rerun exactly: harnix workflow --run-check ${declared.id} -- ${describeCommand(splitCommand(declared.command))} (or without repeating it: harnix workflow --run-check ${declared.id})`,
    );
}

/** The command of a run that names none: the declared one. A check without a declared command has nothing to run. */
function declaredArgv(declared: ValidationCheckV3): readonly string[] {
  if (declared.command === undefined)
    throw new Error(
      `Check ${declared.id} declares no command, so there is nothing to run without one after --; nothing was run. Declare it first: harnix workflow --set-check ${declared.id} --command "<cmd>" --reason "<why>" (see harnix status --checks), or pass the command after --.`,
    );
  return splitCommand(declared.command);
}

/** The full cleaned output of a failing run, kept for reading; a pass drops the log of an earlier failure. */
async function keepLog(
  harnixRoot: string,
  checkId: string,
  result: string,
  output: string,
): Promise<string | undefined> {
  try {
    if (result === "pass") {
      await removeCheckLog(harnixRoot, checkId);
      return undefined;
    }
    return await writeCheckLog(harnixRoot, checkId, output);
  } catch {
    // The log is a convenience: the evidence is already recorded and the short tail is still returned.
    return undefined;
  }
}

/**
 * Snapshot, run, snapshot, record: the evidence is written only when the
 * check ran against unchanged inputs. The output tail is returned to the
 * caller (a short failure summary, nothing for a pass); the evidence never carries command output. A failing run
 * also leaves the whole output, cleaned of colors, machine paths and secrets, in a git-ignored log (`logPath`).
 * No command after the check id means the declared command. A launcher error means the check never ran, so it
 * throws and records no evidence.
 */
export async function runCheckWorkflow(
  root: string,
  checkId: string,
  argv: readonly string[],
  dependencies: RunCheckDependencies = {},
): Promise<RunCheckResult> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  if (!task) throw noActiveTaskError("Workflow run-check");
  if (task.schemaVersion !== 3) throw new Error("Workflow --run-check requires a TaskRecord schema v3 task.");
  const declared = task.validationPlan.find((check) => check.id === checkId);
  if (!declared)
    throw unknownIdError(
      `Workflow run-check check ${checkId} is not declared.`,
      "check",
      checkId,
      task.validationPlan.map((check) => check.id),
    );
  if (task.status === "planning" && !task.evidence.some((evidence) => evidence.checkId !== undefined))
    process.stderr.write(
      "notice: a check run while the task is still planning records evidence, and evidence freezes the planning obligations; finish editing criteria and checks first, or use --replace-check afterwards.\n",
    );
  const command = argv.length > 0 ? argv : declaredArgv(declared);
  const [executable, ...args] = command;
  if (executable === undefined) throw new Error("workflow --run-check requires an executable after --.");
  const beforeSnapshot = await computeInputDigest(root, task, checkId);
  const before = beforeSnapshot.inputDigest;
  assertRetryAllowed(task, checkId, dependencies.now ? Date.parse(dependencies.now) : undefined, before);
  assertDeclaredCommand(declared, command);
  const runCwd = await resolveRunCwd(root, checkId, declared.cwd, dependencies.cwd);
  await saveInputDigestSnapshot(harnixRoot, beforeSnapshot);
  const clock = dependencies.monotonicNow ?? (() => performance.now());
  const startedAt = clock();
  const run = await (dependencies.runner ?? runCheckProcess)(executable, args, runCwd);
  const durationMs = Math.max(0, Math.round(clock() - startedAt));
  const launcher = launcherFailure(run.output, run.exitCode, executable);
  if (launcher !== undefined) throw new Error(`Check ${checkId} could not start: ${launcher}; nothing was recorded.`);
  const empty = noTestsRan(run.output, run.exitCode);
  if (empty !== undefined)
    throw new Error(
      `Check ${checkId} ran no tests: ${empty}; nothing was recorded.\nGợi ý: khai báo lệnh chạy test thật (xem harnix verify-plan), ví dụ trỏ tới solution có project test.`,
    );
  const after = (await computeInputDigest(root, task, checkId)).inputDigest;
  if (before !== after)
    throw new Error(`Verification inputs for check ${checkId} changed while it ran; nothing was recorded.`);
  const result = run.exitCode === 0 ? "pass" : "fail";
  // The check already ran: only the save is retried after a concurrent write, never the process.
  const appended = await retryOnTaskConflict(() =>
    appendEvidenceFlagsWorkflow(
      root,
      {
        check: checkId,
        result,
        exitCode: String(run.exitCode),
        summary: dependencies.summary ?? `${describeCommand(command)} — exit ${run.exitCode}`,
        digest: before,
        durationMs,
      },
      dependencies.now,
    ),
  );
  const logPath = await keepLog(harnixRoot, checkId, result, run.output);
  return {
    task: appended.task,
    evidenceId: appended.evidenceId,
    result,
    exitCode: run.exitCode,
    outputTail: result === "fail" ? summarizeCheckOutput(redactCheckOutput(run.output)) : "",
    durationMs,
    ...(logPath === undefined ? {} : { logPath }),
  };
}
