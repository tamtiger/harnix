import { resolveActiveTask, type EvidenceV3, type TaskRecord } from "src/core/tasks/task.js";
import { laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { computeInputDigest } from "src/core/verification/input-digest.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { saveWorkflow } from "./save.js";
import { currentInstant } from "./support.js";

export interface EvidenceFlags {
  check: string;
  result: string;
  summary: string;
  exitCode?: string | undefined;
  artifacts?: readonly string[] | undefined;
  digest?: string | undefined;
}

export interface AppendedEvidence {
  task: TaskRecord;
  evidenceId: string;
}

const RESULTS = ["pass", "fail", "skipped"] as const;
type EvidenceResult = (typeof RESULTS)[number];

function parseResult(value: string): EvidenceResult {
  if (!RESULTS.includes(value as EvidenceResult)) throw new Error("--result must be pass, fail, or skipped.");
  return value as EvidenceResult;
}

function parseExitCode(value: string | undefined, required: boolean): number | undefined {
  if (value === undefined) {
    if (!required) return undefined;
    throw new Error("--exit-code is required for a pass or fail result and for any command-backed check.");
  }
  if (!/^-?\d+$/u.test(value)) throw new Error("--exit-code must be an integer.");
  return Number(value);
}

function nextEvidenceId(task: TaskRecord, checkId: string): string {
  const used = new Set(task.evidence.map((item) => item.id));
  for (let index = 1; ; index += 1) {
    const candidate = `ev-${checkId}-${index}`;
    if (!used.has(candidate)) return candidate;
  }
}

async function evidenceDigest(
  root: string,
  task: TaskRecord,
  checkId: string,
  result: EvidenceResult,
  supplied: string | undefined,
): Promise<string | undefined> {
  if (supplied !== undefined) return supplied;
  const check = task.validationPlan.find((candidate) => candidate.id === checkId);
  if (task.schemaVersion !== 3 || check?.required !== true || result === "skipped") return undefined;
  try {
    return (await computeInputDigest(root, task, checkId)).inputDigest;
  } catch (error: unknown) {
    // A failed run whose inputs cannot be hashed is still recoverable evidence; a pass without a digest is not.
    if (result === "fail") return undefined;
    throw error;
  }
}

/**
 * Appends one evidence item built from flags: the caller states only what
 * happened, while the id, the clock time and the current input digest are
 * filled in here so a stage owner never hand-writes them.
 */
export async function appendEvidenceFlagsWorkflow(
  root: string,
  flags: EvidenceFlags,
  injectedNow?: string,
): Promise<AppendedEvidence> {
  const now = await currentInstant(root, injectedNow);
  const result = parseResult(flags.result);
  const summary = flags.summary.trim();
  if (summary === "") throw new Error("--summary must not be empty.");
  const task = await resolveActiveTask(await resolveSafeHarnixPath(root));
  if (!task) throw new Error("Workflow evidence capture requires an active task.");
  const check = task.validationPlan.find((candidate) => candidate.id === flags.check);
  if (check === undefined) throw new Error(`Workflow evidence check ${flags.check} is not declared.`);
  const exitCode = parseExitCode(flags.exitCode, result !== "skipped" || check.command !== undefined);
  const inputDigest = await evidenceDigest(root, task, flags.check, result, flags.digest);
  const evidence: EvidenceV3 = {
    id: nextEvidenceId(task, flags.check),
    checkId: flags.check,
    recordedAt: now,
    result,
    ...(exitCode === undefined ? {} : { exitCode }),
    summary,
    artifactPaths: [...(flags.artifacts ?? [])],
    ...(inputDigest === undefined ? {} : { inputDigest }),
  };
  const saved = await saveWorkflow(root, {
    task: { ...task, evidence: [...task.evidence, evidence], updatedAt: laterTimestamp(task.updatedAt, now) },
  });
  return { task: saved, evidenceId: evidence.id };
}
