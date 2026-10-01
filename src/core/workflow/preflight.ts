import type { ContextDrift } from "src/core/context/context.js";
import { readProjectTimezone } from "src/core/config/config.js";
import { resolveActiveTask, type Evidence, type TaskRecord } from "src/core/tasks/task.js";
import { inspectRequiredChecks, type RequiredCheckState } from "src/core/verification/check-report.js";
import { formatInstant, idPrefix } from "src/utils/clock.js";
import { compareCodeUnits } from "src/utils/order.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { verificationRetryDisposition } from "./completion.js";
import { stageOwnerFor } from "./routing.js";
import type { LearningSummaryItem } from "src/core/journal/learning-summary.js";
import { taskContextDrift } from "./context.js";
import { projectLearningSummary } from "./support.js";

export interface WorkflowPreflightResultV1 {
  generator: "harnix";
  schemaVersion: 1;
  activeTask: Pick<TaskRecord, "id" | "mode" | "status" | "checkpoint"> | null;
  contextDrift: ContextDrift["state"];
  requiredChecks: Record<RequiredCheckState, string[]>;
  retryLimitReached: string[];
  nextStage: "await" | "debug" | "implement" | "plan" | "stop" | "verify";
  /** Authoritative time source for agents: current instant and ID prefix in the configured zone. */
  clock: { timezone: string; now: string; idPrefix: string };
  /** Redacted, bounded notes from earlier tasks (at most 5); the source for platforms without hooks. */
  learning: LearningSummaryItem[];
}

type RequiredChecks = WorkflowPreflightResultV1["requiredChecks"];

function emptyRequiredChecks(): RequiredChecks {
  return { passed: [], failed: [], stale: [], pending: [] };
}

function sortRequiredChecks(requiredChecks: RequiredChecks): void {
  for (const values of Object.values(requiredChecks)) values.sort(compareCodeUnits);
}

/** Learning notes help planning only, so every other stage skips them and the extra tokens. */
export async function preflightWorkflow(root: string, now = Date.now()): Promise<WorkflowPreflightResultV1> {
  const result = await routePreflight(root, now);
  return result.nextStage === "plan" ? { ...result, learning: await projectLearningSummary(root, now) } : result;
}

async function routePreflight(root: string, now: number): Promise<WorkflowPreflightResultV1> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  const task = await resolveActiveTask(harnixRoot);
  const timezone = await readProjectTimezone(harnixRoot);
  const base = {
    clock: { timezone, now: formatInstant(now, timezone), idPrefix: idPrefix(now, timezone) },
    learning: [] as LearningSummaryItem[],
    generator: "harnix" as const,
    schemaVersion: 1 as const,
    contextDrift: "not-recorded" as const,
    requiredChecks: emptyRequiredChecks(),
    retryLimitReached: [] as string[],
  };
  if (task === undefined) return { ...base, activeTask: null, nextStage: "plan" };
  const activeTask = { id: task.id, mode: task.mode, status: task.status, checkpoint: task.checkpoint };
  if (task.status === "completed" || task.status === "cancelled" || task.status === "blocked")
    return { ...base, activeTask, nextStage: stageOf(task) };
  const contextDrift = (await taskContextDrift(root, harnixRoot, task)).state;
  const retryLimitReached = task.validationPlan
    .filter((check) => check.required && verificationRetryDisposition(task, check.id, now) === "stop")
    .map((check) => check.id)
    .sort(compareCodeUnits);
  if (contextDrift === "stale" || retryLimitReached.length > 0) {
    return {
      ...base,
      activeTask,
      contextDrift,
      requiredChecks: requiredChecksFromEvidence(task, now),
      retryLimitReached,
      nextStage: contextDrift === "stale" ? "plan" : "stop",
    };
  }
  const inspections =
    task.status === "verifying"
      ? await inspectRequiredChecks(root, harnixRoot, task, now)
      : task.validationPlan
          .filter((check) => check.required)
          .map((check) => ({ id: check.id, state: "pending" as const }));
  const requiredChecks = emptyRequiredChecks();
  for (const inspection of inspections) requiredChecks[inspection.state].push(inspection.id);
  sortRequiredChecks(requiredChecks);
  return {
    ...base,
    activeTask,
    contextDrift,
    requiredChecks,
    retryLimitReached,
    nextStage: stageOf(task),
  };
}

function requiredChecksFromEvidence(task: TaskRecord, now: number): RequiredChecks {
  const requiredChecks = emptyRequiredChecks();
  for (const check of task.validationPlan.filter((candidate) => candidate.required)) {
    let latest: Evidence | undefined;
    for (const evidence of task.evidence) {
      if (evidence.checkId !== check.id) continue;
      if (latest === undefined || Date.parse(evidence.recordedAt) >= Date.parse(latest.recordedAt)) latest = evidence;
    }
    if (latest === undefined || latest.result === "skipped") requiredChecks.pending.push(check.id);
    else if (latest.result === "fail") requiredChecks.failed.push(check.id);
    else if (isStalePass(task, latest, now)) requiredChecks.stale.push(check.id);
    else {
      // A pass cannot be called current without reading its snapshot inputs.
      requiredChecks.pending.push(check.id);
    }
  }
  sortRequiredChecks(requiredChecks);
  return requiredChecks;
}

function isStalePass(task: TaskRecord, latest: Evidence, now: number): boolean {
  const timestamp = Date.parse(latest.recordedAt);
  return (
    !Number.isFinite(timestamp) || timestamp > now || (task.schemaVersion === 1 && now - timestamp > 60 * 60 * 1_000)
  );
}

/** The skill that owns the persisted state; `ready` waits until the latest request authorizes implementation. */
function stageOf(task: TaskRecord): WorkflowPreflightResultV1["nextStage"] {
  if (task.status === "ready" && task.checkpoint === "ready") return "await";
  const owner = stageOwnerFor(task);
  return owner === undefined ? "stop" : (owner.slice("harnix-".length) as "plan" | "implement" | "verify" | "debug");
}
