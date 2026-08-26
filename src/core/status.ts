import type { ContextDrift } from "./context/context.js";
import type { Evidence, TaskMode, TaskRecord, TaskStatus, WorkflowCheckpoint } from "./tasks/task.js";
import { computeVerificationInputSnapshot, loadVerificationInputSidecar, type StoredVerificationInputSnapshot } from "./verification/input-freshness.js";

export type RequiredCheckState = "passed" | "failed" | "stale" | "pending";

export type StatusNextActionCode =
  | "resolve-blocker"
  | "replan-context"
  | "complete-planning"
  | "begin-implementation"
  | "continue-implementation"
  | "run-verification"
  | "finish-task"
  | "finalize-task"
  | "no-active-task";

export interface StatusNextAction {
  code: StatusNextActionCode;
  message: string;
}

export interface StatusAttention {
  code: "context-stale" | "required-check-failed" | "required-check-stale";
  count: number;
}

export interface StatusProgress {
  acceptance: { met: number; waived: number; pending: number; total: number };
  requiredChecks: { passed: number; failed: number; stale: number; pending: number; total: number };
}

export interface StatusActiveTask {
  id: string;
  mode: TaskMode;
  status: TaskStatus;
  checkpoint: WorkflowCheckpoint;
  progress: StatusProgress;
  context: {
    state: ContextDrift["state"];
    changeCount: number;
    selectionChangeCount: number;
  };
}

export interface HarnixStatusResultV1 {
  generator: "harnix";
  schemaVersion: 1;
  activeTask: StatusActiveTask | null;
  nextAction: StatusNextAction;
  attention: StatusAttention[];
}

const nextActionMessages: Record<StatusNextActionCode, string> = {
  "resolve-blocker": "Resolve the active task blocker.",
  "replan-context": "Replan and reselect stale task context.",
  "complete-planning": "Complete planning and pass the ready gate.",
  "begin-implementation": "Begin the approved implementation.",
  "continue-implementation": "Continue the active implementation.",
  "run-verification": "Run or repair the required verification checks.",
  "finish-task": "Finish and archive the verified task.",
  "finalize-task": "Retry terminal task finalization.",
  "no-active-task": "No active task; classify the next request.",
};

export function createNoActiveStatus(): HarnixStatusResultV1 {
  return result(null, "no-active-task", []);
}

export function createActiveStatus(
  task: TaskRecord,
  contextDrift: ContextDrift,
  requiredCheckStates: readonly RequiredCheckState[],
): HarnixStatusResultV1 {
  const acceptance = countAcceptance(task);
  const requiredChecks = countChecks(requiredCheckStates);
  const activeTask: StatusActiveTask = {
    id: task.id,
    mode: task.mode,
    status: task.status,
    checkpoint: task.checkpoint,
    progress: { acceptance, requiredChecks },
    context: {
      state: contextDrift.state,
      changeCount: contextDrift.changes.length,
      selectionChangeCount: contextDrift.selectionChanges.length,
    },
  };
  const attention: StatusAttention[] = [];
  const contextChangeCount = contextDrift.changes.length + contextDrift.selectionChanges.length;
  if (contextDrift.state === "stale") attention.push({ code: "context-stale", count: contextChangeCount });
  if (requiredChecks.failed > 0) attention.push({ code: "required-check-failed", count: requiredChecks.failed });
  if (requiredChecks.stale > 0) attention.push({ code: "required-check-stale", count: requiredChecks.stale });
  return result(activeTask, nextAction(task, contextDrift, requiredChecks), attention);
}

export async function inspectRequiredCheckEvidence(
  projectRoot: string,
  harnixRoot: string,
  task: TaskRecord,
  now = Date.now(),
  maxEvidenceAgeMs = 60 * 60 * 1_000,
): Promise<RequiredCheckState[]> {
  let storedByEvidence = new Map<string, StoredVerificationInputSnapshot>();
  if (task.schemaVersion === 2) {
    try {
      const sidecar = await loadVerificationInputSidecar(harnixRoot, task.id);
      storedByEvidence = new Map(sidecar?.snapshots.map((snapshot) => [snapshot.evidenceId, snapshot]) ?? []);
    } catch {
      storedByEvidence = new Map();
    }
  }
  return Promise.all(task.validationPlan.filter((check) => check.required).map(async (check) => {
    const evidence = latestEvidence(task.evidence, check.id);
    const base = classifyEvidence(evidence, now, maxEvidenceAgeMs);
    if (base !== "passed" || task.schemaVersion === 1 || evidence === undefined) return base;
    const stored = storedByEvidence.get(evidence.id);
    if (stored === undefined || stored.checkId !== check.id || stored.inputDigest !== evidence.inputDigest) return "stale";
    try {
      const current = await computeVerificationInputSnapshot(projectRoot, task, check.id);
      return current.inputDigest === stored.inputDigest ? "passed" : "stale";
    } catch {
      return "stale";
    }
  }));
}

function result(activeTask: StatusActiveTask | null, code: StatusNextActionCode, attention: StatusAttention[]): HarnixStatusResultV1 {
  return {
    generator: "harnix",
    schemaVersion: 1,
    activeTask,
    nextAction: { code, message: nextActionMessages[code] },
    attention,
  };
}

function countAcceptance(task: TaskRecord): StatusProgress["acceptance"] {
  const progress = { met: 0, waived: 0, pending: 0, total: task.acceptanceCriteria.length };
  for (const criterion of task.acceptanceCriteria) progress[criterion.status] += 1;
  return progress;
}

function countChecks(states: readonly RequiredCheckState[]): StatusProgress["requiredChecks"] {
  const progress = { passed: 0, failed: 0, stale: 0, pending: 0, total: states.length };
  for (const state of states) progress[state] += 1;
  return progress;
}

function classifyEvidence(evidence: Evidence | undefined, now: number, maxAgeMs: number): RequiredCheckState {
  if (evidence === undefined || evidence.result === "skipped") return "pending";
  if (evidence.result === "fail") return "failed";
  const timestamp = Date.parse(evidence.recordedAt);
  if (!Number.isFinite(timestamp) || timestamp > now || now - timestamp > maxAgeMs) return "stale";
  return "passed";
}

function latestEvidence(evidence: readonly Evidence[], checkId: string): Evidence | undefined {
  let latest: Evidence | undefined;
  for (const candidate of evidence) {
    if (candidate.checkId !== checkId) continue;
    if (latest === undefined || Date.parse(candidate.recordedAt) >= Date.parse(latest.recordedAt)) latest = candidate;
  }
  return latest;
}

function nextAction(task: TaskRecord, contextDrift: ContextDrift, checks: StatusProgress["requiredChecks"]): StatusNextActionCode {
  if (task.status === "blocked") return "resolve-blocker";
  if (contextDrift.state === "stale") return "replan-context";
  if (task.status === "planning") return "complete-planning";
  if (task.status === "ready") return "begin-implementation";
  if (task.status === "in_progress") return "continue-implementation";
  if (task.status === "verifying") {
    if (checks.failed + checks.stale + checks.pending > 0) return "run-verification";
    return "finish-task";
  }
  return "finalize-task";
}
