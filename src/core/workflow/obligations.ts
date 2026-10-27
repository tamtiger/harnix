import {
  TASK_V2_MIGRATION_EVIDENCE_ID,
  TASK_V3_MIGRATION_EVIDENCE_ID,
  validateTask,
  type Evidence,
  type TaskRecord,
  type TaskRecordV3,
} from "src/core/tasks/task.js";
import { semanticJsonEqual, semanticTaskEqual } from "src/core/tasks/workflow-helpers.js";
import { compareCodeUnits } from "src/utils/order.js";
import type { WorkflowSaveEnvelope } from "./envelope.js";
import { taskLogicalPath } from "src/core/tasks/task-location.js";

type ContractRevision = WorkflowSaveEnvelope["contractRevision"];

/** Enforces the freeze-at-first-ready rule, or applies a one-step contractRevision at the replan checkpoint. */
export function preserveObligations(previous: TaskRecord, next: TaskRecord, revision: ContractRevision): TaskRecord {
  if (!obligationsChanged(previous, next) || previous.schemaVersion !== next.schemaVersion) {
    if (revision !== undefined)
      throw new Error("Workflow contractRevision is allowed only when obligations change at persisted replan.");
    return next;
  }
  if (isEditablePlanningDraft(previous)) {
    if (previous.evidence.some((evidence) => evidence.checkId !== undefined))
      throw new Error("Workflow planning obligations with check evidence are already frozen.");
    if (revision !== undefined)
      throw new Error("Workflow planning obligations do not require contractRevision before first ready.");
    return next;
  }
  if (
    previous.schemaVersion === 3 &&
    next.schemaVersion === 3 &&
    next.checkpoint === "replan" &&
    previous.status === next.status
  ) {
    const reason = validateContractRevision(revision);
    preserveProvenObligations(previous, next);
    return appendContractRevisionEvidence(next, reason);
  }
  if (revision !== undefined)
    throw new Error("Workflow must persist replan before contractRevision can supersede an obligation.");

  const freezePoint = previous.schemaVersion === 1 ? "first persistence" : "first ready";
  assertFrozenCriteria(previous, next, freezePoint);
  assertFrozenRequiredChecks(previous, next, freezePoint);
  if (previous.schemaVersion === 1 && next.schemaVersion === 1) return next;
  throw new Error(
    "Workflow obligations freeze at first ready; persist replan and provide contractRevision to supersede an unproven obligation.",
  );
}

function assertFrozenCriteria(previous: TaskRecord, next: TaskRecord, freezePoint: string): void {
  const nextCriteria = new Map(next.acceptanceCriteria.map((criterion) => [criterion.id, criterion]));
  for (const criterion of previous.acceptanceCriteria) {
    const candidate = nextCriteria.get(criterion.id);
    if (!candidate)
      throw new Error(
        `Workflow obligations freeze at ${freezePoint}; cannot remove or rename acceptance criterion ${criterion.id}.`,
      );
    if (candidate.text !== criterion.text)
      throw new Error(
        `Workflow obligations freeze at ${freezePoint}; cannot mutate acceptance criterion text ${criterion.id}; pass --reason <10-1000 chars> with --add-criterion (or persist replan with contractRevision) to supersede unproven obligations.`,
      );
  }
}

function assertFrozenRequiredChecks(previous: TaskRecord, next: TaskRecord, freezePoint: string): void {
  const nextChecks = new Map(next.validationPlan.map((check) => [check.id, check]));
  for (const check of previous.validationPlan.filter((candidate) => candidate.required)) {
    const candidate = nextChecks.get(check.id);
    if (candidate?.required !== true)
      throw new Error(
        `Workflow obligations freeze at ${freezePoint}; cannot remove, rename, or demote required validation check ${check.id}.`,
      );
    const mutated =
      candidate.description !== check.description ||
      candidate.command !== check.command ||
      candidate.scope !== check.scope;
    if (mutated || hasChangedCoverage(previous, next, check, candidate)) {
      throw new Error(
        `Workflow obligations freeze at ${freezePoint}; cannot mutate required validation check ${check.id}; pass --reason <10-1000 chars> with --set-check (or persist replan with contractRevision) to supersede unproven obligations.`,
      );
    }
  }
}

function hasChangedCoverage(
  previous: TaskRecord,
  next: TaskRecord,
  check: TaskRecord["validationPlan"][number],
  candidate: TaskRecord["validationPlan"][number],
): boolean {
  return (
    previous.schemaVersion !== 1 &&
    next.schemaVersion !== 1 &&
    (!semanticJsonEqual(candidate.criterionIds, check.criterionIds) ||
      !semanticJsonEqual(candidate.inputs, check.inputs))
  );
}

/** The baseline waiver is review data like decisions and risks, so it never counts as an obligation change. */
function withoutBaseline(check: TaskRecord["validationPlan"][number]): { id: string } & Record<string, unknown> {
  const { baseline, ...contract } = check as unknown as { id: string; cwd?: string; baseline?: unknown } & Record<
    string,
    unknown
  >;
  void baseline;
  if (contract.cwd === "." || contract.cwd === "") delete contract.cwd;
  return contract;
}

function obligationsChanged(previous: TaskRecord, next: TaskRecord): boolean {
  const criteria = (task: TaskRecord) =>
    task.acceptanceCriteria
      .map(({ id, text }) => ({ id, text }))
      .sort((left, right) => compareCodeUnits(left.id, right.id));
  const checks = (task: TaskRecord) =>
    task.validationPlan
      .map((check) => withoutBaseline(check))
      .sort((left, right) => compareCodeUnits(left.id, right.id));
  return (
    !semanticJsonEqual(criteria(previous), criteria(next)) ||
    !semanticJsonEqual(checks(previous), checks(next)) ||
    waiversChanged(previous, next)
  );
}

/** Waiving a criterion removes the need for its evidence, so it is a contract change like editing its text. */
function waiversChanged(previous: TaskRecord, next: TaskRecord): boolean {
  const waivers = (task: TaskRecord) =>
    task.acceptanceCriteria
      .filter((criterion) => criterion.status === "waived")
      .map(({ id, waiverReason }) => ({ id, waiverReason: waiverReason ?? null }))
      .sort((left, right) => compareCodeUnits(left.id, right.id));
  return !semanticJsonEqual(waivers(previous), waivers(next));
}

function isEditablePlanningDraft(task: TaskRecord): boolean {
  return (
    task.schemaVersion !== 1 &&
    !task.evidence.some(
      (evidence) => evidence.id === TASK_V2_MIGRATION_EVIDENCE_ID || evidence.id === TASK_V3_MIGRATION_EVIDENCE_ID,
    ) &&
    (task.status === "planning" || (task.status === "blocked" && task.blocker?.resumeStatus === "planning"))
  );
}

function preserveProvenObligations(previous: TaskRecordV3, next: TaskRecordV3): void {
  const nextCriteria = new Map(next.acceptanceCriteria.map((criterion) => [criterion.id, criterion]));
  for (const criterion of previous.acceptanceCriteria) {
    const candidate = nextCriteria.get(criterion.id);
    if (candidate === undefined) {
      throw new Error(
        `Workflow contractRevision cannot remove acceptance criterion ${criterion.id}; mark it waived instead.`,
      );
    }
    if (candidate.text !== criterion.text) {
      if (candidate.status !== "pending" || candidate.evidenceIds.length > 0) {
        throw new Error(
          `Workflow contractRevision mutating acceptance criterion ${criterion.id} text must reset its status to pending and clear evidenceIds.`,
        );
      }
      continue;
    }
    if (candidate.status !== criterion.status) {
      if (candidate.status === "waived") {
        if (!candidate.waiverReason || candidate.waiverReason.trim().length < 10) {
          throw new Error(
            `Workflow contractRevision waiving criterion ${criterion.id} requires a waiverReason of at least 10 characters.`,
          );
        }
        continue;
      }
      if (candidate.status === "pending" && criterion.status === "met") {
        if (candidate.evidenceIds.length > 0) {
          throw new Error(
            `Workflow contractRevision resetting criterion ${criterion.id} to pending must clear evidenceIds.`,
          );
        }
        continue;
      }
      throw new Error(`Workflow contractRevision cannot mark acceptance criterion ${criterion.id} as met.`);
    }
  }
  assertEvidencedChecksRetained(previous, next);
}

function assertEvidencedChecksRetained(previous: TaskRecordV3, next: TaskRecordV3): void {
  const nextChecks = new Map(next.validationPlan.map((check) => [check.id, check]));
  const priorCheckIds = new Set(previous.validationPlan.map((check) => check.id));
  const evidenceByCheck = new Map<string, Evidence[]>();
  for (const evidence of previous.evidence) {
    if (evidence.checkId === undefined) continue;
    const entries = evidenceByCheck.get(evidence.checkId) ?? [];
    entries.push(evidence);
    evidenceByCheck.set(evidence.checkId, entries);
  }
  for (const check of previous.validationPlan) {
    const checkEvidence = evidenceByCheck.get(check.id);
    if (checkEvidence === undefined) continue;
    const candidate = nextChecks.get(check.id);
    if (candidate !== undefined && semanticJsonEqual(candidate, check)) continue;
    const isPassing =
      checkEvidence
        .filter((evidence) => evidence.result !== "skipped")
        .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt))
        .at(-1)?.result === "pass";
    // Allow retiring passed checks during replan if replaced or all criteria waived
    const retiredWithoutDefinitionChange =
      check.required &&
      candidate !== undefined &&
      candidate.required === false &&
      semanticJsonEqual({ ...candidate, required: true }, check);
    const activeCriteria = check.criterionIds.filter((cid) => {
      const c = next.acceptanceCriteria.find((criterion) => criterion.id === cid);
      return c?.status !== "waived";
    });
    const hasReplacement =
      activeCriteria.length === 0 ||
      next.validationPlan.some(
        (replacement) =>
          (!priorCheckIds.has(replacement.id) ||
            (replacement.id !== check.id && !evidenceByCheck.get(replacement.id)?.some((e) => e.result === "pass"))) &&
          replacement.required &&
          activeCriteria.every((criterionId) => replacement.criterionIds.includes(criterionId)),
      );
    if (!retiredWithoutDefinitionChange || !hasReplacement) {
      const detail = isPassing
        ? "passed check " + check.id + " unchanged after passing evidence"
        : "failed check " + check.id + " unchanged";
      throw new Error(
        `Workflow contractRevision must retain ${detail} or retire it unchanged with a new required replacement ID. ` +
          `To change what it runs, use: harnix workflow --replace-check ${check.id} <new-id> --reason "<why>" with a different --command, --input or --cwd.`,
      );
    }
  }
}

function validateContractRevision(revision: ContractRevision): string {
  const reason = revision?.reason?.trim();
  if (reason === undefined || reason.length < 10 || reason.length > 1_000)
    throw new Error(
      "Workflow obligation supersede requires contractRevision.reason between 10 and 1000 characters at persisted replan.",
    );
  return reason;
}

/** True when `candidate` re-sends a revision that `previous` already committed (idempotent replay). */
export function isAppliedContractRevisionReplay(
  previous: TaskRecord,
  candidate: TaskRecord,
  revision: ContractRevision,
): previous is TaskRecordV3 {
  if (previous.schemaVersion !== 3 || candidate.schemaVersion !== 3 || revision === undefined) return false;
  const reason = validateContractRevision(revision);
  if (previous.evidence.length !== candidate.evidence.length + 1) return false;
  if (!semanticJsonEqual(previous.evidence.slice(0, -1), candidate.evidence)) return false;
  const audit = previous.evidence.at(-1)!;
  if (
    !/^task-contract-revision-\d{2,}$/u.test(audit.id) ||
    audit.checkId !== undefined ||
    audit.recordedAt !== candidate.updatedAt ||
    audit.result !== "skipped" ||
    audit.summary !== `Task contract revised at persisted replan: ${reason}` ||
    !semanticJsonEqual(audit.artifactPaths, [taskLogicalPath(candidate.id, "task.json")])
  )
    return false;
  return semanticTaskEqual({ ...previous, evidence: candidate.evidence }, candidate);
}

function appendContractRevisionEvidence(task: TaskRecordV3, reason: string): TaskRecordV3 {
  let sequence = 1;
  const ids = new Set(task.evidence.map((evidence) => evidence.id));
  while (ids.has(`task-contract-revision-${String(sequence).padStart(2, "0")}`)) sequence += 1;
  return validateTask({
    ...task,
    evidence: [
      ...task.evidence,
      {
        id: `task-contract-revision-${String(sequence).padStart(2, "0")}`,
        recordedAt: task.updatedAt,
        result: "skipped",
        summary: `Task contract revised at persisted replan: ${reason}`,
        artifactPaths: [taskLogicalPath(task.id, "task.json")],
      },
    ],
  }) as TaskRecordV3;
}
