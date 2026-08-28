import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { mkdir, readFile } from "node:fs/promises";

import { globby } from "globby";

import type { TaskRecordV2, ValidationCheckV2 } from "../tasks/task.js";
import { normalizeRepositoryPath, resolveSafeProjectPath } from "../../utils/paths.js";
import { atomicWriteFile } from "../../utils/atomic-write.js";

export type VerificationInputNormalizer = "planning-contract-v1" | "raw-v1";

export interface VerificationInputEntryV1 {
  path: string;
  sha256: string;
}

export interface VerificationInputEntryV2 extends VerificationInputEntryV1 {
  normalizer: VerificationInputNormalizer;
}

interface VerificationInputSnapshotBase {
  generator: "harnix";
  taskId: string;
  checkId: string;
  taskContractHash: string;
  inputDigest: string;
}

export interface VerificationInputSnapshotV1 extends VerificationInputSnapshotBase {
  schemaVersion: 1;
  entries: VerificationInputEntryV1[];
}

export interface VerificationInputSnapshotV2 extends VerificationInputSnapshotBase {
  schemaVersion: 2;
  entries: VerificationInputEntryV2[];
}

export type VerificationInputSnapshot = VerificationInputSnapshotV1 | VerificationInputSnapshotV2;

export interface VerificationInputChange {
  path: string;
  kind: "changed" | "missing";
}

export type StoredVerificationInputSnapshot = VerificationInputSnapshot & { evidenceId: string };

export interface VerificationInputSidecar {
  generator: "harnix";
  schemaVersion: 1;
  taskId: string;
  snapshots: StoredVerificationInputSnapshot[];
}

export interface VerificationInputSnapshotOptions {
  artifacts?: { plan?: string | undefined; prd?: string | undefined } | undefined;
  schemaVersion?: 1 | 2 | undefined;
}

export async function computeVerificationInputSnapshot(
  projectRoot: string,
  task: TaskRecordV2,
  checkId: string,
  options: VerificationInputSnapshotOptions = {},
): Promise<VerificationInputSnapshot> {
  const check = task.validationPlan.find((candidate) => candidate.id === checkId);
  if (check === undefined) throw new Error(`Verification input check ${checkId} is not declared.`);
  const activeWorkflowOwnedPaths = new Set([
    `.harnix/tasks/${task.id}/task.json`,
    `.harnix/tasks/${task.id}/verification-inputs.json`,
  ]);
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
      if (!activeWorkflowOwnedPaths.has(normalized)) paths.add(normalized);
    }
  }
  if (task.mode === "full") {
    paths.add(`.harnix/tasks/${task.id}/plan.md`);
    paths.add(`.harnix/tasks/${task.id}/prd.md`);
  }
  const schemaVersion = options.schemaVersion ?? 2;
  const entries: VerificationInputEntryV2[] = [];
  for (const path of [...paths].sort(compareText)) {
    const planningArtifact = task.mode === "full" && path === `.harnix/tasks/${task.id}/plan.md`
      ? options.artifacts?.plan
      : task.mode === "full" && path === `.harnix/tasks/${task.id}/prd.md`
        ? options.artifacts?.prd
        : undefined;
    let content: string | Uint8Array;
    try {
      const resolved = planningArtifact === undefined ? await resolveSafeProjectPath(projectRoot, path) : undefined;
      content = planningArtifact ?? await readFile(resolved!);
    } catch {
      throw new Error(`Verification input for check ${checkId} is missing or unreadable: ${path}`);
    }
    const normalizer: VerificationInputNormalizer = schemaVersion === 2 && isPlanningArtifactPath(task, path) ? "planning-contract-v1" : "raw-v1";
    const sha256 = normalizer === "planning-contract-v1"
      ? hashText(canonicalizePlanningArtifactV1(
        typeof content === "string" ? content : Buffer.from(content).toString("utf8"),
        path.endsWith("/plan.md") ? "plan" : "prd",
      ))
      : typeof content === "string" ? hashText(content) : hashBytes(content);
    entries.push({ path, sha256, normalizer });
  }
  const taskContractHash = hashText(canonicalTaskContract(task));
  if (schemaVersion === 1) {
    const legacyEntries = entries.map(({ path, sha256 }) => ({ path, sha256 }));
    return {
      generator: "harnix",
      schemaVersion: 1,
      taskId: task.id,
      checkId,
      taskContractHash,
      entries: legacyEntries,
      inputDigest: hashText(legacyDigestPayload(task.id, checkId, taskContractHash, legacyEntries)),
    };
  }
  const digestPayload = snapshotV2DigestPayload(task.id, checkId, taskContractHash, entries);
  return {
    generator: "harnix",
    schemaVersion: 2,
    taskId: task.id,
    checkId,
    taskContractHash,
    entries,
    inputDigest: hashText(digestPayload),
  };
}

export function compareVerificationInputSnapshots(previous: VerificationInputSnapshot, current: VerificationInputSnapshot): VerificationInputChange[] {
  const currentByPath = new Map(current.entries.map((entry) => [entry.path, entry]));
  const previousPaths = new Set(previous.entries.map((entry) => entry.path));
  const changes: VerificationInputChange[] = [];
  for (const entry of previous.entries) {
    const currentEntry = currentByPath.get(entry.path);
    if (currentEntry === undefined) changes.push({ path: entry.path, kind: "missing" });
    else if (currentEntry.sha256 !== entry.sha256 || entryNormalizer(currentEntry) !== entryNormalizer(entry)) changes.push({ path: entry.path, kind: "changed" });
  }
  for (const entry of current.entries) if (!previousPaths.has(entry.path)) changes.push({ path: entry.path, kind: "changed" });
  return changes.sort((left, right) => compareText(left.path, right.path) || compareText(left.kind, right.kind));
}

export async function persistNewVerificationInputSnapshots(
  projectRoot: string,
  harnixRoot: string,
  previousEvidence: readonly { id: string }[],
  candidate: TaskRecordV2,
  options: VerificationInputSnapshotOptions = {},
): Promise<void> {
  const previousEvidenceIds = new Set(previousEvidence.map((evidence) => evidence.id));
  const requiredChecks = new Map(candidate.validationPlan.filter((check) => check.required).map((check) => [check.id, check]));
  const additions: StoredVerificationInputSnapshot[] = [];
  for (const evidence of candidate.evidence) {
    if (previousEvidenceIds.has(evidence.id) || evidence.checkId === undefined || !requiredChecks.has(evidence.checkId)) continue;
    if (evidence.result !== "pass" && !(evidence.result === "fail" && evidence.inputDigest !== undefined)) continue;
    const snapshot = await computeVerificationInputSnapshot(projectRoot, candidate, evidence.checkId, options);
    if (snapshot.inputDigest !== evidence.inputDigest) throw new Error(`Verification input digest does not match the current snapshot for check ${evidence.checkId}.`);
    if (evidence.result === "pass") additions.push({ evidenceId: evidence.id, ...snapshot });
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
    const current = await computeVerificationInputSnapshot(projectRoot, task, check.id, { schemaVersion: stored.schemaVersion });
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
    && (snapshot.schemaVersion === 1 || snapshot.schemaVersion === 2)
    && snapshot.taskId === taskId
    && validId(snapshot.checkId)
    && /^[a-f0-9]{64}$/u.test(String(snapshot.taskContractHash))
    && /^[a-f0-9]{64}$/u.test(String(snapshot.inputDigest))
    && Array.isArray(snapshot.entries)
    && snapshot.entries.every((entry) => isRecord(entry)
      && typeof entry.path === "string"
      && isCanonicalSafePath(entry.path)
      && /^[a-f0-9]{64}$/u.test(String(entry.sha256))
      && (snapshot.schemaVersion === 1 ? entry.normalizer === undefined : isNormalizer(entry.normalizer))))) return false;
  const entries = snapshot.entries as unknown as VerificationInputEntryV2[];
  if (!isSortedUniqueText(entries.map((entry) => entry.path))) return false;
  const payload = snapshot.schemaVersion === 1
    ? legacyDigestPayload(taskId, String(snapshot.checkId), String(snapshot.taskContractHash), entries.map(({ path, sha256 }) => ({ path, sha256 })))
    : snapshotV2DigestPayload(taskId, String(snapshot.checkId), String(snapshot.taskContractHash), entries);
  return snapshot.inputDigest === hashText(payload);
}
export function canonicalizePlanningArtifactV1(source: string, artifact: "plan" | "prd" = "plan"): string {
  const begin = "<!-- harnix:execution-notes:begin -->";
  const end = "<!-- harnix:execution-notes:end -->";
  const maxExecutionNoteLines = 100;
  const maxExecutionNoteCharacters = 16_384;
  const executionNotePattern = /^(?:check|slice):[A-Za-z0-9][A-Za-z0-9._-]{0,63}=(?:pending|passed|failed|skipped)(?:@\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/u;
  const output: string[] = [];
  let insideNotes = false;
  let executionNoteLines = 0;
  let executionNoteCharacters = 0;
  let fence: { marker: "`" | "~"; length: number } | undefined;
  for (const rawLine of source.replace(/\r\n?/gu, "\n").split("\n")) {
    const line = normalizePlanningLineWhitespace(rawLine, artifact);
    if (artifact === "plan" && fence === undefined && rawLine === begin) {
      if (insideNotes) throw new Error("Planning execution-note marker is nested or malformed.");
      insideNotes = true;
      output.push(begin);
      continue;
    }
    if (artifact === "plan" && fence === undefined && rawLine === end) {
      if (!insideNotes) throw new Error("Planning execution-note marker is unmatched or malformed.");
      insideNotes = false;
      output.push(end);
      continue;
    }
    if (insideNotes) {
      executionNoteLines += 1;
      executionNoteCharacters += rawLine.length + 1;
      if (rawLine === begin
        || executionNoteLines > maxExecutionNoteLines
        || executionNoteCharacters > maxExecutionNoteCharacters
        || /^\s*(?:#{1,6}\s|(?:Criteria|Checks|Paths):)/u.test(rawLine)) {
        throw new Error("Planning execution-note region is malformed, too large, or contains contract syntax.");
      }
      if (rawLine.trim().length > 0 && !executionNotePattern.test(rawLine.trim())) {
        throw new Error("Planning execution-note region accepts only inert check/slice status grammar.");
      }
      continue;
    }
    const fenceMatch = /^\s*(`{3,}|~{3,})(.*)$/u.exec(line);
    if (fenceMatch) {
      const run = fenceMatch[1]!;
      const marker = run[0] as "`" | "~";
      if (fence === undefined) fence = { marker, length: run.length };
      else if (fence.marker === marker && run.length >= fence.length && fenceMatch[2]!.trim().length === 0) fence = undefined;
      output.push(line);
      continue;
    }
    output.push(artifact === "plan" && fence === undefined
      ? line.replace(/^(\s*-\s+)\[[ xX]\](\s+`[A-Z][A-Z0-9-]*`\s+—\s+.+)$/u, "$1[ ]$2")
      : line);
  }
  if (insideNotes) throw new Error("Planning execution-note marker is unclosed or malformed.");
  return output.join("\n");
}
function normalizePlanningLineWhitespace(line: string, artifact: "plan" | "prd"): string {
  const trimmed = line.replace(/[\t ]+$/gu, "");
  if (trimmed.length === 0 || /^#{1,6}(?:\s|$)/u.test(trimmed)) return trimmed;
  if (artifact === "plan" && (/^\s*-\s+\[[ xX]\]\s+`[A-Z][A-Z0-9-]*`\s+—\s+.+$/u.test(trimmed)
    || /^(?:Criteria|Checks|Paths):/u.test(trimmed)
    || trimmed === "<!-- harnix:execution-notes:begin -->"
    || trimmed === "<!-- harnix:execution-notes:end -->")) return trimmed;
  return line;
}
function isPlanningArtifactPath(task: TaskRecordV2, path: string): boolean {
  return path === `.harnix/tasks/${task.id}/plan.md` || path === `.harnix/tasks/${task.id}/prd.md`;
}
function entryNormalizer(entry: VerificationInputEntryV1 | VerificationInputEntryV2): VerificationInputNormalizer {
  return "normalizer" in entry ? entry.normalizer : "raw-v1";
}
function isNormalizer(value: unknown): value is VerificationInputNormalizer { return value === "raw-v1" || value === "planning-contract-v1"; }
function legacyDigestPayload(taskId: string, checkId: string, taskContractHash: string, entries: VerificationInputEntryV1[]): string {
  return JSON.stringify({ schemaVersion: 2, taskId, checkId, taskContractHash, entries });
}
function snapshotV2DigestPayload(taskId: string, checkId: string, taskContractHash: string, entries: VerificationInputEntryV2[]): string {
  return JSON.stringify({ schemaVersion: 3, taskId, checkId, taskContractHash, entries });
}
function isCanonicalSafePath(path: string): boolean { try { return normalizeRepositoryPath(path) === path; } catch { return false; } }
function isSortedUniqueText(values: readonly string[]): boolean { return new Set(values).size === values.length && values.every((value, index) => index === 0 || values[index - 1]! < value); }
function validId(value: unknown): value is string { return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isMissing(error: unknown): boolean { return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT"; }
