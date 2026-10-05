import { createTaskV3MigrationEvidence, type TaskRecord } from "src/core/tasks/task.js";
import { semanticJsonEqual } from "src/core/tasks/workflow-helpers.js";
import { compareCodeUnits } from "src/utils/order.js";

const MIGRATE_HINT =
  "Save it once as TaskRecord schema v3 (workflow --save) preserving its criteria, required checks and evidence, then continue.";

/** Legacy v1/v2 records are read-only except for the one-save migration to v3; finished tasks are never rewritten. */
export function assertSchemaEvolution(previous: TaskRecord, next: TaskRecord): void {
  if (previous.schemaVersion === next.schemaVersion) {
    if (previous.schemaVersion !== 3 && previous.status !== "completed" && previous.status !== "cancelled") {
      throw new Error(
        `Unfinished TaskRecord v${previous.schemaVersion} tasks must migrate before any other change. ${MIGRATE_HINT}`,
      );
    }
    return;
  }
  if (next.schemaVersion !== 3 || previous.schemaVersion === 3)
    throw new Error("Workflow save cannot downgrade TaskRecord schema.");
  assertMigratableState(previous, next);
  assertMigrationPreservesCriteria(previous, next);
  assertMigrationPreservesRequiredChecks(previous, next);
  assertMigrationEvidence(previous, next);
}

function assertMigratableState(previous: TaskRecord, next: TaskRecord): void {
  if (
    previous.status === "completed" ||
    previous.status === "cancelled" ||
    previous.status === "blocked" ||
    previous.status !== next.status ||
    previous.checkpoint !== next.checkpoint
  ) {
    throw new Error(
      "TaskRecord migration to v3 is allowed only for an unfinished, unblocked task and keeps its status and checkpoint.",
    );
  }
}

function assertMigrationPreservesCriteria(previous: TaskRecord, next: TaskRecord): void {
  const sorted = (task: TaskRecord) =>
    [...task.acceptanceCriteria].sort((left, right) => compareCodeUnits(left.id, right.id));
  if (!semanticJsonEqual(sorted(previous), sorted(next))) {
    throw new Error("TaskRecord migration to v3 must preserve acceptance criteria exactly.");
  }
}

function assertMigrationPreservesRequiredChecks(previous: TaskRecord, next: TaskRecord): void {
  const nextChecks = new Map(next.validationPlan.map((check) => [check.id, check]));
  for (const check of previous.validationPlan.filter((candidate) => candidate.required)) {
    const candidate = nextChecks.get(check.id);
    const sameCoverage =
      previous.schemaVersion === 1 ||
      semanticJsonEqual(candidate?.criterionIds, (check as { criterionIds?: string[] }).criterionIds);
    if (
      candidate === undefined ||
      candidate.description !== check.description ||
      candidate.command !== check.command ||
      candidate.scope !== check.scope ||
      candidate.required !== check.required ||
      !sameCoverage ||
      !sameInputs(previous, check, candidate)
    ) {
      throw new Error(`TaskRecord migration to v3 must preserve required validation check ${check.id} exactly.`);
    }
  }
}

/** A v2 check declared its inputs, so they carry over unchanged minus the retired @task-contract token. */
function sameInputs(
  previous: TaskRecord,
  check: TaskRecord["validationPlan"][number],
  candidate: TaskRecord["validationPlan"][number],
): boolean {
  if (previous.schemaVersion !== 2) return true;
  const unique = (values: readonly string[] | undefined) => [...new Set(values ?? [])].sort(compareCodeUnits);
  const carried = unique(check.inputs?.filter((input) => input !== "@task-contract"));
  return carried.length === 0 || semanticJsonEqual(unique(candidate.inputs), carried);
}

function assertMigrationEvidence(previous: TaskRecord, next: TaskRecord): void {
  const expected = createTaskV3MigrationEvidence(previous.id, next.updatedAt);
  if (
    next.evidence.length !== previous.evidence.length + 1 ||
    !semanticJsonEqual(next.evidence.slice(0, previous.evidence.length), previous.evidence) ||
    !semanticJsonEqual(next.evidence.at(-1), expected)
  ) {
    throw new Error("TaskRecord migration to v3 requires exact appended migration evidence.");
  }
}
