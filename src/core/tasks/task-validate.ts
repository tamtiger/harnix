import {
  acceptanceCriterionKeys,
  evidenceFindingKeys,
  evidenceV1Keys,
  evidenceV2Keys,
  taskRecordKeys,
  taskRecordV2Keys,
  transitions,
  validationCheckV1Keys,
  validationCheckV2Keys,
} from "./task-schema.js";
import type {
  AcceptanceCriterion,
  Evidence,
  TaskRecord,
  TaskValidationOptions,
  ValidationCheck,
} from "./task-schema.js";
import {
  TaskValidationError,
  assertExactKeys,
  ensureUnique,
  isBoundedText,
  isIsoTimestamp,
  isRecord,
  isSafeRepositoryPath,
  taskIdPattern,
  validId,
} from "./task-validate-common.js";
import { validateV2Contracts, validateV3Contracts } from "./task-validate-contracts.js";
import { assertBlocker, assertCancellation, assertStatusCheckpointAndCompletion } from "./task-validate-lifecycle.js";

const checkpointNames = [
  "triage",
  "planning",
  "ready",
  "implementing",
  "debugging",
  "replan",
  "verifying",
  "finishing",
  "cancelling",
];
type TaskObject = Record<string, unknown>;

function asTaskObject(value: unknown): TaskObject {
  if (
    !isRecord(value) ||
    value.generator !== "harnix" ||
    (value.schemaVersion !== 1 && value.schemaVersion !== 2 && value.schemaVersion !== 3)
  )
    throw new TaskValidationError("Invalid or unsupported task record.");
  return value;
}

function assertTopLevelKeysAndStrings(value: TaskObject): void {
  assertExactKeys(value, value.schemaVersion === 1 ? taskRecordKeys : taskRecordV2Keys, "TaskRecord");
  for (const key of ["id", "title", "goal", "createdAt", "updatedAt"])
    if (typeof value[key] !== "string") throw new TaskValidationError(`Task ${key} is required.`);
}

function assertIdentity(value: TaskObject): void {
  if (
    !taskIdPattern.test(String(value.id)) ||
    !["lite", "full"].includes(String(value.mode)) ||
    !Object.keys(transitions).includes(String(value.status)) ||
    !checkpointNames.includes(String(value.checkpoint))
  )
    throw new TaskValidationError("Task identity, mode, status, or checkpoint is invalid.");
  if (
    value.schemaVersion !== 1 &&
    value.epicId !== undefined &&
    (typeof value.epicId !== "string" || !validId(value.epicId))
  )
    throw new TaskValidationError("Task epicId is invalid.");
}

function assertArraysAndTimestamps(value: TaskObject): void {
  if (
    !Array.isArray(value.nonGoals) ||
    !Array.isArray(value.acceptanceCriteria) ||
    !Array.isArray(value.relevantPaths) ||
    !Array.isArray(value.relevantSpecs) ||
    !Array.isArray(value.validationPlan) ||
    !Array.isArray(value.evidence)
  )
    throw new TaskValidationError("Task arrays are required.");
  if (
    !isIsoTimestamp(value.createdAt) ||
    !isIsoTimestamp(value.updatedAt) ||
    Date.parse(value.updatedAt) < Date.parse(value.createdAt)
  )
    throw new TaskValidationError("Task timestamp is invalid.");
  if (
    !(value.nonGoals as unknown[]).every((item) => typeof item === "string") ||
    !(value.relevantPaths as unknown[]).every((item) => typeof item === "string") ||
    !(value.relevantSpecs as unknown[]).every((item) => typeof item === "string")
  )
    throw new TaskValidationError("Task path and goal arrays are invalid.");
}

function assertValidationPlan(value: TaskObject): void {
  for (const item of value.validationPlan as unknown[]) {
    if (!isRecord(item) || !validId(item.id) || typeof item.description !== "string") {
      throw new TaskValidationError("Validation plan is invalid.");
    }
    if (!["focused", "full"].includes(String(item.scope))) {
      throw new TaskValidationError(
        `Validation plan check '${String(item.id)}' has invalid scope '${String(item.scope)}'; expected 'focused' or 'full'.`,
      );
    }
    if (typeof item.required !== "boolean" || (item.command !== undefined && typeof item.command !== "string")) {
      throw new TaskValidationError("Validation plan is invalid.");
    }
  }
  for (const item of value.validationPlan as Record<string, unknown>[])
    assertExactKeys(
      item,
      value.schemaVersion === 1 ? validationCheckV1Keys : validationCheckV2Keys,
      "Validation check",
    );
  if (
    value.schemaVersion === 1 &&
    !(value.validationPlan as unknown[]).every(
      (item) => isRecord(item) && item.criterionIds === undefined && item.inputs === undefined,
    )
  )
    throw new TaskValidationError("TaskRecord v1 validation plan is invalid.");
}

function isEvidenceShape(item: unknown, allowUnsafeArtifacts: boolean): boolean {
  return (
    isRecord(item) &&
    validId(item.id) &&
    (item.checkId === undefined || validId(item.checkId)) &&
    typeof item.recordedAt === "string" &&
    isIsoTimestamp(item.recordedAt) &&
    ["pass", "fail", "skipped"].includes(String(item.result)) &&
    (item.exitCode === undefined || Number.isInteger(item.exitCode)) &&
    typeof item.summary === "string" &&
    Array.isArray(item.artifactPaths) &&
    (allowUnsafeArtifacts || (item.artifactPaths as unknown[]).every(isSafeRepositoryPath))
  );
}

function assertEvidenceFindings(value: TaskObject): void {
  for (const item of value.evidence as Record<string, unknown>[]) {
    if (item.findings === undefined) continue;
    if (!Array.isArray(item.findings)) throw new TaskValidationError("Evidence finding is invalid.");
    for (const finding of item.findings as unknown[]) {
      if (
        !isRecord(finding) ||
        !validId(finding.id) ||
        !isBoundedText(finding.text) ||
        !["low", "medium", "high", "critical"].includes(String(finding.severity))
      ) {
        throw new TaskValidationError("Evidence finding is invalid.");
      }
      assertExactKeys(finding, evidenceFindingKeys, "Evidence finding");
    }
  }
}

function assertEvidence(value: TaskObject, options: TaskValidationOptions): void {
  const allowUnsafeCompletedEvidenceArtifacts =
    options.allowUnsafeCompletedEvidenceArtifacts === true && value.status === "completed";
  if (!(value.evidence as unknown[]).every((item) => isEvidenceShape(item, allowUnsafeCompletedEvidenceArtifacts)))
    throw new TaskValidationError("Evidence is invalid.");
  for (const item of value.evidence as Record<string, unknown>[])
    assertExactKeys(item, value.schemaVersion === 1 ? evidenceV1Keys : evidenceV2Keys, "Evidence");
  if (
    value.schemaVersion === 1 &&
    !(value.evidence as unknown[]).every((item) => isRecord(item) && item.inputDigest === undefined)
  )
    throw new TaskValidationError("TaskRecord v1 evidence is invalid.");
  if (value.schemaVersion !== 1) assertEvidenceFindings(value);
}

function assertCriteria(value: TaskObject): void {
  if (
    !(value.acceptanceCriteria as unknown[]).every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.text === "string" &&
        ["pending", "met", "waived"].includes(String(item.status)) &&
        Array.isArray(item.evidenceIds) &&
        (item.evidenceIds as unknown[]).every((id) => typeof id === "string"),
    )
  )
    throw new TaskValidationError("Acceptance criteria are invalid.");
  for (const item of value.acceptanceCriteria as Record<string, unknown>[])
    assertExactKeys(item, acceptanceCriterionKeys, "Acceptance criterion");
}

function assertUniquenessAndPaths(value: TaskObject): void {
  ensureUnique(
    (value.acceptanceCriteria as AcceptanceCriterion[]).map((item) => item.id),
    "acceptance criterion",
  );
  ensureUnique(
    (value.validationPlan as ValidationCheck[]).map((item) => item.id),
    "validation check",
  );
  ensureUnique(
    (value.evidence as Evidence[]).map((item) => item.id),
    "evidence",
  );
  if (
    !(value.relevantPaths as unknown[]).every(isSafeRepositoryPath) ||
    !(value.relevantSpecs as unknown[]).every(isSafeRepositoryPath)
  )
    throw new TaskValidationError("Task path is unsafe.");
}

function assertEvidenceCheckReferences(value: TaskObject, checks: Map<string, ValidationCheck>): void {
  for (const evidence of value.evidence as Evidence[]) {
    if (evidence.checkId === undefined) continue;
    const check = checks.get(evidence.checkId);
    if (check === undefined) throw new TaskValidationError("Evidence check reference is invalid.");
    if (check.command !== undefined && !Number.isInteger(evidence.exitCode))
      throw new TaskValidationError("Command evidence requires an integer exit code.");
  }
}

function assertCriterionSupport(value: TaskObject): void {
  const evidenceIds = new Set((value.evidence as Evidence[]).map((e) => e.id));
  for (const criterion of value.acceptanceCriteria as AcceptanceCriterion[]) {
    if (
      (criterion.status === "met" && !criterion.evidenceIds.some((id) => evidenceIds.has(id))) ||
      (criterion.status === "waived" && !criterion.waiverReason?.trim())
    )
      throw new TaskValidationError("Acceptance criterion evidence/waiver is invalid.");
  }
}

export function validateTask(value: unknown, options: TaskValidationOptions = {}): TaskRecord {
  const task = asTaskObject(value);
  // Structural core: later phases cast these shapes, so a failure here must stop immediately.
  assertTopLevelKeysAndStrings(task);
  assertIdentity(task);
  assertArraysAndTimestamps(task);
  // Independent shape/content phases: collect every problem so one --save round surfaces them all,
  // instead of forcing a resend of the whole envelope per hidden error.
  const problems = collectValidationErrors([
    () => assertValidationPlan(task),
    () => assertEvidence(task, options),
    () => assertCriteria(task),
    () => assertUniquenessAndPaths(task),
  ]);
  if (problems.length > 0) throw new TaskValidationError(problems.join("; "));
  const checks = new Map((task.validationPlan as ValidationCheck[]).map((check) => [check.id, check]));
  assertEvidenceCheckReferences(task, checks);
  if (task.schemaVersion === 2) validateV2Contracts(task, checks);
  if (task.schemaVersion === 3) validateV3Contracts(task, checks);
  assertCriterionSupport(task);
  assertBlocker(task);
  assertCancellation(task);
  assertStatusCheckpointAndCompletion(task);
  return task as unknown as TaskRecord;
}

/** Runs each independent assert, collecting TaskValidationError messages; re-throws any other error. */
function collectValidationErrors(asserts: readonly (() => void)[]): string[] {
  const messages: string[] = [];
  for (const assertOne of asserts) {
    try {
      assertOne();
    } catch (error: unknown) {
      if (error instanceof TaskValidationError) messages.push(error.message);
      else throw error;
    }
  }
  return messages;
}
