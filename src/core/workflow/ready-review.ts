/** Short form of `harnix skill harnix-plan --reference ready-review`, so any tool sees it from the CLI itself. */
export const READY_REVIEW_CHECKLIST: readonly string[] = [
  "Decisions: no unresolved material decision is disguised as an implementation step.",
  "Criteria: every criterion describes behavior or evidence that can be checked.",
  "Coverage: every requirement maps to a slice and a focused check; the suite check runs the project test command.",
  "Contracts: field names, enums, inputs, outputs, errors, precedence and ownership are exact.",
  "Placeholders: no TBD, TODO, deferred choice or unnamed type that could change the implementation.",
  "Consistency: PRD, plan, task record and repository instructions do not contradict each other.",
  "Context freshness: stale context drift is reselected before ready.",
  "Scope: small enough to implement and verify without mixing independent products.",
  "Worktree: unrelated and user-owned changes are identified and preserved.",
  "Tracking: the task name is a readable English slug and the checklist maps one to one to the ordered slices.",
  "Artifacts: a Full task has non-empty prd.md and plan.md with unchecked checklist items.",
  "Commit discipline: show the changes and message and wait for approval before any commit.",
];

function section(title: string, items: readonly string[]): string[] {
  return items.length === 0 ? [] : ["", `${title}:`, ...items.map((item) => `- ${item}`)];
}

/** Refusal of a Full task's ready transition made without `--reviewed`: the checklist plus what the gate already found. */
export function reviewRequiredMessage(issues: readonly string[], advisories: readonly string[]): string {
  return [
    "Full task ready requires --reviewed after the ready-review (run the checklist, fix every gap, then repeat the transition with --reviewed).",
    ...section("Ready-review checklist", READY_REVIEW_CHECKLIST),
    ...section("Issues found", issues),
    ...section("Advisories", advisories),
  ].join("\n");
}
