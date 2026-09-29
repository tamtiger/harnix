import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { globby } from "globby";

import { selectLatestEvidence, type TaskRecordV3, type ValidationCheckV3 } from "../tasks/task.js";
import { normalizeRepositoryPath, resolveSafeProjectPath } from "../../utils/paths.js";

export interface InputDigestEntry {
  path: string;
  sha256: string;
}

/** Returned by `workflow --snapshot`; never persisted, so a task carries no sidecar file. */
export interface InputDigestSnapshot {
  generator: "harnix";
  schemaVersion: 3;
  taskId: string;
  checkId: string;
  taskContractHash: string;
  entries: InputDigestEntry[];
  inputDigest: string;
}

/**
 * Digest of the contract and declared inputs for one v3 check. Evidence stores
 * only the resulting digest; freshness is decided by recomputing it, so there
 * is no snapshot file to write, diff, or keep in sync.
 */
export async function computeInputDigest(
  projectRoot: string,
  task: TaskRecordV3,
  checkId: string,
): Promise<InputDigestSnapshot> {
  const check = task.validationPlan.find((candidate) => candidate.id === checkId);
  if (check === undefined) throw new Error(`Verification input check ${checkId} is not declared.`);
  const workflowOwned = new Set([
    `.harnix/tasks/${task.id}/task.json`,
    `.harnix/tasks/${task.id}/review.md`,
    `.harnix/tasks/${task.id}/verification-inputs.json`,
  ]);
  const paths = new Set<string>();
  for (const input of check.inputs) {
    const matches = await globby(input, {
      absolute: false,
      cwd: projectRoot,
      dot: true,
      followSymbolicLinks: false,
      gitignore: true,
      onlyFiles: true,
    });
    if (matches.length === 0) throw new Error(`Verification input pattern for check ${checkId} matched no files.`);
    for (const match of matches) {
      const normalized = normalizeRepositoryPath(match);
      if (!workflowOwned.has(normalized)) paths.add(normalized);
    }
  }
  const entries: InputDigestEntry[] = [];
  for (const path of [...paths].sort(compareText)) {
    try {
      entries.push({ path, sha256: hashBytes(await readFile(await resolveSafeProjectPath(projectRoot, path))) });
    } catch {
      throw new Error(`Verification input for check ${checkId} is missing or unreadable: ${path}`);
    }
  }
  const taskContractHash = hashText(canonicalTaskContract(task));
  return {
    generator: "harnix",
    schemaVersion: 3,
    taskId: task.id,
    checkId,
    taskContractHash,
    entries,
    inputDigest: hashText(JSON.stringify({ digest: 3, taskId: task.id, checkId, taskContractHash, entries })),
  };
}

/** Save-time gate: a newly appended pass (or digest-carrying fail) must describe the inputs as they are right now. */
export async function assertNewEvidenceDigests(
  projectRoot: string,
  previousEvidence: readonly { id: string }[],
  candidate: TaskRecordV3,
): Promise<void> {
  const previousIds = new Set(previousEvidence.map((evidence) => evidence.id));
  const requiredChecks = new Set(candidate.validationPlan.filter((check) => check.required).map((check) => check.id));
  for (const evidence of candidate.evidence) {
    if (previousIds.has(evidence.id) || evidence.checkId === undefined || !requiredChecks.has(evidence.checkId))
      continue;
    if (evidence.result !== "pass" && !(evidence.result === "fail" && evidence.inputDigest !== undefined)) continue;
    const snapshot = await computeInputDigest(projectRoot, candidate, evidence.checkId);
    if (snapshot.inputDigest !== evidence.inputDigest)
      throw new Error(`Verification input digest does not match the current snapshot for check ${evidence.checkId}.`);
  }
}

/** Finish-time gate: every required check's latest pass must still match the current inputs. */
export async function assertInputDigestsFresh(projectRoot: string, task: TaskRecordV3): Promise<void> {
  for (const check of task.validationPlan.filter((candidate) => candidate.required)) {
    const latest = selectLatestEvidence(task.evidence, check.id);
    if (latest?.result !== "pass") continue;
    const current = await computeInputDigest(projectRoot, task, check.id);
    if (current.inputDigest !== latest.inputDigest) {
      throw new Error(
        `Verification inputs are stale for check ${check.id}: evidence ${latest.id} recorded at ${latest.recordedAt} no longer matches current content.`,
      );
    }
  }
}

/** Review-only fields (decisions, residual risks) and evidence stay outside the contract on purpose. */
function canonicalTaskContract(task: TaskRecordV3): string {
  return JSON.stringify({
    schemaVersion: 3,
    taskId: task.id,
    mode: task.mode,
    acceptanceCriteria: [...task.acceptanceCriteria]
      .map((criterion) => ({ id: criterion.id, text: criterion.text }))
      .sort((left, right) => compareText(left.id, right.id)),
    validationPlan: [...task.validationPlan].map(canonicalCheck).sort((left, right) => compareText(left.id, right.id)),
  });
}

function canonicalCheck(check: ValidationCheckV3) {
  return {
    id: check.id,
    description: check.description,
    command: check.command ?? null,
    scope: check.scope,
    required: check.required,
    criterionIds: [...check.criterionIds].sort(compareText),
    inputs: [...check.inputs],
  };
}

function hashBytes(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}
function hashText(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}
function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
