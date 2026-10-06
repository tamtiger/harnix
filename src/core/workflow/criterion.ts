import {
  resolveActiveTask,
  selectLatestEvidence,
  type AcceptanceCriterion,
  type TaskRecord,
  type TaskRecordV3,
} from "src/core/tasks/task.js";
import { laterTimestamp } from "src/core/tasks/workflow-helpers.js";
import { computeInputDigest, digestMatches } from "src/core/verification/input-digest.js";
import { compareCodeUnits } from "src/utils/order.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { saveWorkflow } from "./save.js";
import { authorizedRedBaseline } from "./suite-gate.js";
import { currentInstant } from "./support.js";

export interface MarkCriteriaInput {
  criterionIds: readonly string[];
  evidenceIds?: readonly string[] | undefined;
}

function explicitEvidence(task: TaskRecordV3, criterionId: string, evidenceIds: readonly string[]): string[] {
  for (const id of evidenceIds) {
    const evidence = task.evidence.find((candidate) => candidate.id === id);
    if (evidence === undefined) throw new Error(`Workflow criterion ${criterionId}: evidence ${id} does not exist.`);
    const check = task.validationPlan.find((candidate) => candidate.id === evidence.checkId);
    if (evidence.result !== "pass" || check === undefined || !check.criterionIds.includes(criterionId))
      throw new Error(
        `Workflow criterion ${criterionId}: evidence ${id} must be a passing item of a check that covers it.`,
      );
  }
  return [...evidenceIds];
}

async function freshEvidence(root: string, task: TaskRecordV3, criterionId: string): Promise<string[]> {
  const covering = task.validationPlan.filter((check) => check.required && check.criterionIds.includes(criterionId));
  const ids: string[] = [];
  const notFresh: string[] = [];
  for (const check of covering) {
    if (authorizedRedBaseline(task, check)) continue;
    const latest = selectLatestEvidence(task.evidence, check.id);
    const current = latest?.result === "pass" ? await computeInputDigest(root, task, check.id) : undefined;
    if (latest?.result === "pass" && current !== undefined && digestMatches(current, latest.inputDigest))
      ids.push(latest.id);
    else notFresh.push(check.id);
  }
  if (ids.length === 0 || notFresh.length > 0) {
    const named = notFresh.length > 0 ? notFresh : covering.map((check) => check.id);
    throw new Error(
      `Workflow criterion ${criterionId} has no fresh passing evidence from required check(s): ${named.join(", ") || "none declared"}.`,
    );
  }
  return ids;
}

/** Marks criteria `met` from evidence already recorded; the ordinary save guards still validate the result. */
export async function markCriteriaMetWorkflow(
  root: string,
  input: MarkCriteriaInput,
  injectedNow?: string,
): Promise<TaskRecord> {
  const now = await currentInstant(root, injectedNow);
  const task = await resolveActiveTask(await resolveSafeHarnixPath(root));
  if (!task) throw new Error("Workflow criterion update requires an active task.");
  if (task.schemaVersion !== 3) throw new Error("Workflow --criterion requires a TaskRecord schema v3 task.");
  const marked = new Map<string, string[]>();
  for (const id of new Set(input.criterionIds)) {
    const criterion = task.acceptanceCriteria.find((candidate) => candidate.id === id);
    if (criterion === undefined) throw new Error(`Workflow criterion ${id} is not declared.`);
    if (criterion.status === "waived") throw new Error(`Workflow criterion ${id} is waived and cannot be marked met.`);
    const evidence =
      input.evidenceIds === undefined
        ? await freshEvidence(root, task, id)
        : explicitEvidence(task, id, input.evidenceIds);
    marked.set(id, [...new Set(evidence)].sort(compareCodeUnits));
  }
  const acceptanceCriteria = task.acceptanceCriteria.map((criterion): AcceptanceCriterion =>
    marked.has(criterion.id) ? { ...criterion, status: "met", evidenceIds: marked.get(criterion.id) ?? [] } : criterion,
  );
  return saveWorkflow(root, { task: { ...task, acceptanceCriteria, updatedAt: laterTimestamp(task.updatedAt, now) } });
}
