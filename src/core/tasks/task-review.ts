import { formatDisplay } from "../../utils/clock.js";
import type { TaskRecord } from "./task-schema.js";
import { selectLatestEvidence } from "./task-state.js";

function renderVerdict(task: TaskRecord): string {
  if (task.status === "cancelled")
    return `**Verdict:** CANCELLED — ${task.cancellation?.reason ?? "no reason recorded"}`;
  if (task.status === "blocked")
    return `**Verdict:** BLOCKED (${task.blocker?.kind ?? "unknown"}) — ${task.blocker?.summary ?? "no summary recorded"}`;
  if (task.status === "completed") return "**Verdict:** PASS — all acceptance criteria met or waived";
  const met = task.acceptanceCriteria.filter(
    (criterion) => criterion.status === "met" || criterion.status === "waived",
  ).length;
  return `**Verdict:** PENDING — ${met}/${task.acceptanceCriteria.length} acceptance criteria met`;
}

/** Legacy `Z` and offset timestamps both render in the configured zone; an unparsable value is shown as stored. */
function displayTime(value: string, timezone: string): string {
  try {
    return formatDisplay(value, timezone);
  } catch {
    return value;
  }
}

export interface ReviewArtifacts {
  prd: boolean;
  plan: boolean;
  design: boolean;
}

function renderHeader(task: TaskRecord, timezone: string): string[] {
  const lines: string[] = [
    `# ${task.title}`,
    "",
    `- **ID:** ${task.id}`,
    `- **Mode:** ${task.mode}`,
    `- **Status:** ${task.status}/${task.checkpoint}`,
    `- **Created:** ${displayTime(task.createdAt, timezone)}`,
    `- **Updated:** ${displayTime(task.updatedAt, timezone)}`,
    "",
    renderVerdict(task),
    "",
    "## Goal",
    "",
    task.goal,
  ];
  if (task.nonGoals.length > 0) {
    lines.push("", "## Non-goals", "", ...task.nonGoals.map((item) => `- ${item}`));
  }
  return lines;
}

function renderArtifacts(artifacts: ReviewArtifacts): string[] {
  if (!artifacts.prd && !artifacts.plan && !artifacts.design) return [];
  const lines = ["", "## Artifacts", ""];
  if (artifacts.prd) lines.push("- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.");
  if (artifacts.plan) lines.push("- [`plan.md`](./plan.md) — implementation checklist and slices.");
  if (artifacts.design) lines.push("- [`design.md`](./design.md) — architecture/interface decisions.");
  return lines;
}

function renderCriteriaAndChecks(task: TaskRecord, timezone: string): string[] {
  const lines: string[] = ["", "## Acceptance criteria", ""];
  if (task.acceptanceCriteria.length === 0) {
    lines.push("_None recorded yet._");
  } else {
    for (const criterion of task.acceptanceCriteria) {
      const waiver = criterion.status === "waived" && criterion.waiverReason ? ` — ${criterion.waiverReason}` : "";
      lines.push(`- \`${criterion.id}\` (${criterion.status}): ${criterion.text}${waiver}`);
    }
  }
  lines.push("", "## Required checks", "");
  const requiredChecks = task.validationPlan.filter((check) => check.required);
  if (requiredChecks.length === 0) {
    lines.push("_None recorded yet._");
  } else {
    for (const check of requiredChecks) {
      const latest = selectLatestEvidence(task.evidence, check.id);
      const state = latest
        ? `${latest.result} (${displayTime(latest.recordedAt, timezone)})`
        : "chưa chạy / not yet run";
      lines.push(`- \`${check.id}\` (${check.scope}): ${check.description} — ${state}`);
    }
  }
  return lines;
}

function renderReviewData(task: TaskRecord): string[] {
  const lines: string[] = [];
  const decisions = "decisions" in task ? task.decisions : undefined;
  if (decisions && decisions.length > 0) {
    lines.push("", "## Decisions", "");
    for (const decision of decisions)
      lines.push(`- **${decision.id}** — ${decision.text}`, `  - _Why:_ ${decision.rationale}`);
  }
  const residualRisks = "residualRisks" in task ? task.residualRisks : undefined;
  if (residualRisks && residualRisks.length > 0) {
    lines.push("", "## Residual risks", "");
    for (const risk of residualRisks) lines.push(`- **${risk.id}** (${risk.severity}) — ${risk.text}`);
  }
  if (task.blocker) {
    lines.push(
      "",
      "## Blocker",
      "",
      `- **Kind:** ${task.blocker.kind}`,
      `- **Summary:** ${task.blocker.summary}`,
      `- **Next action:** ${task.blocker.nextAction}`,
    );
  }
  if (task.cancellation) {
    lines.push("", "## Cancellation", "", `- **Reason:** ${task.cancellation.reason}`);
  }
  return lines;
}

function renderEvidence(task: TaskRecord, timezone: string): string[] {
  const lines: string[] = ["", "## Evidence", ""];
  if (task.evidence.length === 0) {
    lines.push("_None recorded yet._");
    return lines;
  }
  const renderedCheckIds = new Set<string>();
  for (const item of task.evidence) {
    if (item.checkId === undefined) {
      lines.push(`- ${item.result} (${displayTime(item.recordedAt, timezone)}): ${item.summary}`);
      continue;
    }
    if (renderedCheckIds.has(item.checkId)) continue;
    renderedCheckIds.add(item.checkId);
    const rerunCount = task.evidence.filter((candidate) => candidate.checkId === item.checkId).length - 1;
    const latest = selectLatestEvidence(task.evidence, item.checkId) ?? item;
    const rerunNote =
      rerunCount > 0
        ? ` _(${rerunCount} earlier rerun${rerunCount > 1 ? "s" : ""} not shown; see task.json for full history)_`
        : "";
    lines.push(
      `- \`${item.checkId}\` — ${latest.result} (${displayTime(latest.recordedAt, timezone)}): ${latest.summary}${rerunNote}`,
    );
  }
  return lines;
}

/** Derived, always-overwritten human page; it carries no obligation and is never a source of truth. */
export function renderTaskReview(task: TaskRecord, artifacts: ReviewArtifacts, timezone: string): string {
  const lines = [
    ...renderHeader(task, timezone),
    ...renderArtifacts(artifacts),
    ...renderCriteriaAndChecks(task, timezone),
    ...renderReviewData(task),
    ...renderEvidence(task, timezone),
  ];
  return `${lines.join("\n")}\n`;
}
