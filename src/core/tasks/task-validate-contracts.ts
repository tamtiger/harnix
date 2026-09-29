import {
  createTaskV2MigrationEvidence,
  createTaskV3MigrationEvidence,
  TASK_V2_MIGRATION_EVIDENCE_ID,
  TASK_V3_MIGRATION_EVIDENCE_ID,
} from "./task-migration.js";
import type {
  AcceptanceCriterion,
  EvidenceV2,
  EvidenceV3,
  ValidationCheck,
  ValidationCheckV2,
  ValidationCheckV3,
} from "./task-schema.js";
import { TaskValidationError, isInputDigest, isSortedUnique, validId } from "./task-validate-common.js";

type SchemaLabel = "v2" | "v3";

function isSafeVerificationInput(value: unknown): value is string {
  if (value === "@task-contract") return true;
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.startsWith("!") ||
    value.includes("\\") ||
    value.startsWith("/") ||
    /^[A-Za-z]:/u.test(value) ||
    value.includes("\0")
  )
    return false;
  const segments = value.split("/");
  return segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
}
/** A v3 input is a repository glob; the `@task-contract` token belongs to v2 only. */
function isSafeInputGlob(value: unknown): value is string {
  return value !== "@task-contract" && isSafeVerificationInput(value);
}
function isBehavioralCheck(check: ValidationCheckV2): boolean {
  return /(?:^|[^a-z])(repository|source|file|build|test|lint|typecheck|package|runtime|code|compile|smoke|acceptance)(?:$|[^a-z])/iu.test(
    `${check.id} ${check.description} ${check.command ?? ""}`,
  );
}

function assertCriterionIds(criteria: AcceptanceCriterion[], label: SchemaLabel): void {
  if (criteria.some((criterion) => !validId(criterion.id)))
    throw new TaskValidationError(`TaskRecord ${label} acceptance criterion ID is invalid.`);
}

function assertCheckCriteria(check: ValidationCheckV2, criterionIds: ReadonlySet<string>, label: SchemaLabel): void {
  if (
    !Array.isArray(check.criterionIds) ||
    !check.criterionIds.every(validId) ||
    !isSortedUnique(check.criterionIds) ||
    (check.required && check.criterionIds.length === 0)
  ) {
    throw new TaskValidationError(`TaskRecord ${label} validation criterion coverage is invalid.`);
  }
  if (check.criterionIds.some((id) => !criterionIds.has(id)))
    throw new TaskValidationError(`TaskRecord ${label} validation criterion reference is invalid.`);
}

function assertCriterionCoverage(
  criteria: AcceptanceCriterion[],
  validationPlan: ValidationCheckV2[],
  label: SchemaLabel,
): void {
  const covered = new Set(validationPlan.filter((check) => check.required).flatMap((check) => check.criterionIds));
  if (criteria.some((criterion) => criterion.status !== "waived" && !covered.has(criterion.id))) {
    throw new TaskValidationError(`TaskRecord ${label} criterion coverage is incomplete.`);
  }
}

/** Returns the index of the schema-migration evidence (or -1) after checking it is byte-exact. */
function locateMigrationEvidence(
  evidenceList: EvidenceV2[],
  migrationId: string,
  expected: (recordedAt: string) => EvidenceV2,
  label: SchemaLabel,
): number {
  const migrationIndex = evidenceList.findIndex((evidence) => evidence.id === migrationId);
  if (
    migrationIndex >= 0 &&
    JSON.stringify(evidenceList[migrationIndex]) !== JSON.stringify(expected(evidenceList[migrationIndex]!.recordedAt))
  ) {
    throw new TaskValidationError(`TaskRecord ${label} migration evidence is invalid.`);
  }
  return migrationIndex;
}

function assertV2CheckInputs(check: ValidationCheckV2): void {
  if (
    !Array.isArray(check.inputs) ||
    check.inputs.length === 0 ||
    !check.inputs.every(isSafeVerificationInput) ||
    !isSortedUnique(check.inputs) ||
    !check.inputs.includes("@task-contract")
  ) {
    throw new TaskValidationError("TaskRecord v2 validation inputs are invalid.");
  }
  if (isBehavioralCheck(check) && check.inputs.every((input) => input === "@task-contract")) {
    throw new TaskValidationError("Behavioral TaskRecord v2 validation requires a repository input.");
  }
}

function assertV2Evidence(
  evidenceList: EvidenceV2[],
  checks: Map<string, ValidationCheck>,
  migrationIndex: number,
): void {
  for (const [index, evidence] of evidenceList.entries()) {
    const check = evidence.checkId === undefined ? undefined : checks.get(evidence.checkId);
    const preservedLegacyPass = migrationIndex > index;
    if (
      evidence.result === "pass" &&
      check?.required === true &&
      !isInputDigest(evidence.inputDigest) &&
      !preservedLegacyPass
    ) {
      throw new TaskValidationError("Required passing TaskRecord v2 evidence requires a valid input digest.");
    }
    if (evidence.inputDigest !== undefined && !isInputDigest(evidence.inputDigest)) {
      throw new TaskValidationError("TaskRecord v2 evidence input digest is invalid.");
    }
  }
}

export function validateV2Contracts(value: Record<string, unknown>, checks: Map<string, ValidationCheck>): void {
  const criteria = value.acceptanceCriteria as AcceptanceCriterion[];
  assertCriterionIds(criteria, "v2");
  const criterionIds = new Set(criteria.map((criterion) => criterion.id));
  const validationPlan = value.validationPlan as ValidationCheckV2[];
  for (const check of validationPlan) {
    assertCheckCriteria(check, criterionIds, "v2");
    assertV2CheckInputs(check);
  }
  assertCriterionCoverage(criteria, validationPlan, "v2");
  const evidenceList = value.evidence as EvidenceV2[];
  const migrationIndex = locateMigrationEvidence(
    evidenceList,
    TASK_V2_MIGRATION_EVIDENCE_ID,
    (recordedAt) => createTaskV2MigrationEvidence(String(value.id), recordedAt),
    "v2",
  );
  assertV2Evidence(evidenceList, checks, migrationIndex);
}

function assertV3CheckInputs(check: ValidationCheckV3): void {
  if (
    !Array.isArray(check.inputs) ||
    !check.inputs.every(isSafeInputGlob) ||
    !isSortedUnique(check.inputs) ||
    (check.required && check.inputs.length === 0)
  ) {
    throw new TaskValidationError("TaskRecord v3 validation inputs are invalid.");
  }
}

function assertV3Evidence(
  evidenceList: EvidenceV3[],
  checks: Map<string, ValidationCheck>,
  migrationIndex: number,
): void {
  for (const [index, evidence] of evidenceList.entries()) {
    if (evidence.inputDigest !== undefined && !isInputDigest(evidence.inputDigest))
      throw new TaskValidationError("TaskRecord v3 evidence input digest is invalid.");
    const check = evidence.checkId === undefined ? undefined : checks.get(evidence.checkId);
    if (check === undefined || migrationIndex > index) continue; // evidence carried over from a migrated schema keeps its original shape
    if (evidence.result === "pass" && check.required && !isInputDigest(evidence.inputDigest)) {
      throw new TaskValidationError("Required passing TaskRecord v3 evidence requires a valid input digest.");
    }
    if (check.command !== undefined && evidence.result === "pass" && evidence.exitCode !== 0)
      throw new TaskValidationError("Passing command evidence requires exit code 0.");
    if (check.command !== undefined && evidence.result === "fail" && evidence.exitCode === 0)
      throw new TaskValidationError("Failing command evidence requires a non-zero exit code.");
  }
}

export function validateV3Contracts(value: Record<string, unknown>, checks: Map<string, ValidationCheck>): void {
  const criteria = value.acceptanceCriteria as AcceptanceCriterion[];
  assertCriterionIds(criteria, "v3");
  const criterionIds = new Set(criteria.map((criterion) => criterion.id));
  const validationPlan = value.validationPlan as ValidationCheckV3[];
  for (const check of validationPlan) {
    assertCheckCriteria(check, criterionIds, "v3");
    assertV3CheckInputs(check);
  }
  assertCriterionCoverage(criteria, validationPlan, "v3");
  const evidenceList = value.evidence as EvidenceV3[];
  const migrationIndex = locateMigrationEvidence(
    evidenceList,
    TASK_V3_MIGRATION_EVIDENCE_ID,
    (recordedAt) => createTaskV3MigrationEvidence(String(value.id), recordedAt),
    "v3",
  );
  assertV3Evidence(evidenceList, checks, migrationIndex);
}
