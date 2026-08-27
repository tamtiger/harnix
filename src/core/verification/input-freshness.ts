import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";

import { globby } from "globby";

import type { TaskRecordV2, ValidationCheckV2 } from "../tasks/task.js";
import { normalizeRepositoryPath, resolveSafeProjectPath } from "../../utils/paths.js";
import { atomicWriteFile } from "../../utils/atomic-write.js";

export interface VerificationInputEntry {
  path: string;
  sha256: string;
}

export interface VerificationInputSnapshot {
  generator: "harnix";
  schemaVersion: 1;
  taskId: string;
  checkId: string;
  taskContractHash: string;
  entries: VerificationInputEntry[];
  inputDigest: string;
}

export interface VerificationInputChange {
  path: string;
  kind: "changed" | "missing";
}

export interface StoredVerificationInputSnapshot extends VerificationInputSnapshot {
  evidenceId: string;
}

export interface VerificationInputSidecar {
  generator: "harnix";
  schemaVersion: 1;
  taskId: string;
  snapshots: StoredVerificationInputSnapshot[];
}

export async function computeVerificationInputSnapshot(projectRoot: string, task: TaskRecordV2, checkId: string): Promise<VerificationInputSnapshot> {
  const check = task.validationPlan.find((candidate) => candidate.id === checkId);
  if (check === undefined) throw new Error(`Verification input check ${checkId} is not declared.`);
  const activeTaskRecordPath = `.harnix/tasks/${task.id}/task.json`;
  const paths = new Set<string>();
  for (const input of check.inputs) {
    if (input === "@task-contract") continue;
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
      if (normalized !== activeTaskRecordPath) paths.add(normalized);
    }
  }
  if (task.mode === "full") {
    paths.add(`.harnix/tasks/${task.id}/plan.md`);
    paths.add(`.harnix/tasks/${task.id}/prd.md`);
  }
  const entries: VerificationInputEntry[] = [];
  for (const path of [...paths].sort(compareText)) {
    try {
      const resolved = await resolveSafeProjectPath(projectRoot, path);
      entries.push({ path, sha256: hashBytes(await readFile(resolved)) });
    } catch {
      throw new Error(`Verification input for check ${checkId} is missing or unreadable: ${path}`);
    }
  }
  const taskContractHash = hashText(canonicalTaskContract(task));
  const digestPayload = JSON.stringify({
    schemaVersion: 2,
    taskId: task.id,
    checkId,
    taskContractHash,
    entries,
  });
  return {
    generator: "harnix",
    schemaVersion: 1,
    taskId: task.id,
    checkId,
    taskContractHash,
    entries,
    inputDigest: hashText(digestPayload),
  };
}

export function compareVerificationInputSnapshots(previous: VerificationInputSnapshot, current: VerificationInputSnapshot): VerificationInputChange[] {
  const currentByPath = new Map(current.entries.map((entry) => [entry.path, entry.sha256]));
  const previousPaths = new Set(previous.entries.map((entry) => entry.path));
  const changes: VerificationInputChange[] = [];
  for (const entry of previous.entries) {
    const hash = currentByPath.get(entry.path);
    if (hash === undefined) changes.push({ path: entry.path, kind: "missing" });
    else if (hash !== entry.sha256) changes.push({ path: entry.path, kind: "changed" });
  }
  for (const entry of current.entries) if (!previousPaths.has(entry.path)) changes.push({ path: entry.path, kind: "changed" });
  return changes.sort((left, right) => compareText(left.path, right.path) || compareText(left.kind, right.kind));
}

export async function persistNewVerificationInputSnapshots(
  projectRoot: string,
  harnixRoot: string,
  previousEvidence: readonly { id: string }[],
  candidate: TaskRecordV2,
): Promise<void> {
  const previousEvidenceIds = new Set(previousEvidence.map((evidence) => evidence.id));
  const requiredChecks = new Map(candidate.validationPlan.filter((check) => check.required).map((check) => [check.id, check]));
  const additions: StoredVerificationInputSnapshot[] = [];
  for (const evidence of candidate.evidence) {
    if (previousEvidenceIds.has(evidence.id) || evidence.result !== "pass" || evidence.checkId === undefined || !requiredChecks.has(evidence.checkId)) continue;
    const snapshot = await computeVerificationInputSnapshot(projectRoot, candidate, evidence.checkId);
    if (snapshot.inputDigest !== evidence.inputDigest) throw new Error(`Verification input digest does not match the current snapshot for check ${evidence.checkId}.`);
    additions.push({ evidenceId: evidence.id, ...snapshot });
  }
  if (additions.length === 0) return;
  const existing = await loadVerificationInputSidecar(harnixRoot, candidate.id);
  const snapshots = [...(existing?.snapshots ?? [])];
  const byEvidenceId = new Map(snapshots.map((snapshot) => [snapshot.evidenceId, snapshot]));
  for (const addition of additions) {
    const current = byEvidenceId.get(addition.evidenceId);
    if (current !== undefined && JSON.stringify(current) !== JSON.stringify(addition)) throw new Error(`Verification input snapshot ${addition.evidenceId} is immutable.`);
    if (current === undefined) {
      snapshots.push(addition);
      byEvidenceId.set(addition.evidenceId, addition);
    }
  }
  snapshots.sort((left, right) => compareText(left.evidenceId, right.evidenceId));
  const path = await verificationInputSidecarPath(harnixRoot, candidate.id);
  await mkdir(await resolveSafeProjectPath(harnixRoot, `tasks/${candidate.id}`), { recursive: true });
  await atomicWriteFile(path, `${JSON.stringify({ generator: "harnix", schemaVersion: 1, taskId: candidate.id, snapshots }, null, 2)}\n`);
}

export async function assertVerificationInputsFresh(projectRoot: string, harnixRoot: string, task: TaskRecordV2): Promise<void> {
  const sidecar = await loadVerificationInputSidecar(harnixRoot, task.id);
  const storedByEvidence = new Map(sidecar?.snapshots.map((snapshot) => [snapshot.evidenceId, snapshot]) ?? []);
  for (const check of task.validationPlan.filter((candidate) => candidate.required)) {
    let latest: TaskRecordV2["evidence"][number] | undefined;
    for (const evidence of task.evidence) {
      if (evidence.checkId === check.id && (latest === undefined || Date.parse(evidence.recordedAt) >= Date.parse(latest.recordedAt))) latest = evidence;
    }
    if (latest?.result !== "pass") continue;
    const stored = storedByEvidence.get(latest.id);
    if (stored === undefined || stored.inputDigest !== latest.inputDigest) throw new Error(`Verification input snapshot is missing or invalid for check ${check.id}.`);
    const current = await computeVerificationInputSnapshot(projectRoot, task, check.id);
    if (current.inputDigest === stored.inputDigest) continue;
    const paths = compareVerificationInputSnapshots(stored, current).map((change) => `${change.kind}:${change.path}`);
    throw new Error(`Verification inputs are stale for check ${check.id}${paths.length === 0 ? "" : ` (${paths.join(", ")})`}.`);
  }
}

export async function loadVerificationInputSidecar(harnixRoot: string, taskId: string): Promise<VerificationInputSidecar | undefined> {
  try {
    const value = JSON.parse(await readFile(await verificationInputSidecarPath(harnixRoot, taskId), "utf8")) as unknown;
    if (!isSidecar(value, taskId)) throw new Error("Invalid verification input sidecar.");
    return value;
  } catch (error: unknown) {
    if (isMissing(error)) return undefined;
    throw error;
  }
}

function canonicalTaskContract(task: TaskRecordV2): string {
  return JSON.stringify({
    schemaVersion: 2,
    taskId: task.id,
    mode: task.mode,
    acceptanceCriteria: [...task.acceptanceCriteria]
      .map((criterion) => ({ id: criterion.id, text: criterion.text }))
      .sort((left, right) => compareText(left.id, right.id)),
    validationPlan: [...task.validationPlan]
      .map(canonicalCheck)
      .sort((left, right) => compareText(left.id, right.id)),
  });
}

function canonicalCheck(check: ValidationCheckV2) {
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

function hashBytes(content: Uint8Array): string { return createHash("sha256").update(content).digest("hex"); }
function hashText(content: string): string { return createHash("sha256").update(content, "utf8").digest("hex"); }
function compareText(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }
async function verificationInputSidecarPath(harnixRoot: string, taskId: string): Promise<string> { return resolveSafeProjectPath(harnixRoot, `tasks/${taskId}/verification-inputs.json`); }
function isSidecar(value: unknown, taskId: string): value is VerificationInputSidecar {
  if (!isRecord(value) || value.generator !== "harnix" || value.schemaVersion !== 1 || value.taskId !== taskId || !Array.isArray(value.snapshots)) return false;
  if (!value.snapshots.every((snapshot) => isSnapshot(snapshot, taskId))) return false;
  const evidenceIds = value.snapshots.map((snapshot) => (snapshot as StoredVerificationInputSnapshot).evidenceId);
  return isSortedUniqueText(evidenceIds);
}
function isSnapshot(snapshot: unknown, taskId: string): snapshot is StoredVerificationInputSnapshot {
  if (!(isRecord(snapshot)
    && validId(snapshot.evidenceId)
    && snapshot.generator === "harnix"
    && snapshot.schemaVersion === 1
    && snapshot.taskId === taskId
    && validId(snapshot.checkId)
    && /^[a-f0-9]{64}$/u.test(String(snapshot.taskContractHash))
    && /^[a-f0-9]{64}$/u.test(String(snapshot.inputDigest))
    && Array.isArray(snapshot.entries)
    && snapshot.entries.every((entry) => isRecord(entry) && typeof entry.path === "string" && isCanonicalSafePath(entry.path) && /^[a-f0-9]{64}$/u.test(String(entry.sha256))))) return false;
  const entries = snapshot.entries as unknown as VerificationInputEntry[];
  if (!isSortedUniqueText(entries.map((entry) => entry.path))) return false;
  return snapshot.inputDigest === hashText(JSON.stringify({
    schemaVersion: 2,
    taskId,
    checkId: snapshot.checkId,
    taskContractHash: snapshot.taskContractHash,
    entries,
  }));
}
function isCanonicalSafePath(path: string): boolean { try { return normalizeRepositoryPath(path) === path; } catch { return false; } }
function isSortedUniqueText(values: readonly string[]): boolean { return new Set(values).size === values.length && values.every((value, index) => index === 0 || values[index - 1]! < value); }
function validId(value: unknown): value is string { return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isMissing(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"; }
