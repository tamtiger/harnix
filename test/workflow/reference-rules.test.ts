import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const VERIFY = "src/skills/harnix-verify/references";
const PLAN = "src/skills/harnix-plan/references";
const SKILLS = "src/skills";

interface Rule {
  readonly rule: string;
  readonly file: string;
  readonly phrases: readonly string[];
}

/**
 * Rules that shortening the references once dropped. Each must stay in a file the agent reads, so a later trim fails
 * here instead of silently narrowing the guidance.
 */
const RULES: readonly Rule[] = [
  {
    rule: "--task covers every edit command and --inspect",
    file: `${PLAN}/epic.md`,
    phrases: ["--set-criterion", "--inspect"],
  },
  {
    rule: "--exit-code is required for a pass or fail",
    file: `${VERIFY}/evidence.md`,
    phrases: ["`--exit-code` is required for every `pass` or `fail`"],
  },
  {
    rule: "breaker exits (evidence)",
    file: `${VERIFY}/evidence.md`,
    phrases: ["--reset-breaker", "--replace-check", "10-1000"],
  },
  {
    rule: "breaker exits (replan)",
    file: `${PLAN}/replan.md`,
    phrases: ["new input digest", "--reset-breaker", "10-1000", "--replace-check"],
  },
  { rule: "breaker exits (cookbook)", file: `${VERIFY}/cookbook-commands.md`, phrases: ["--reset-breaker", "10-1000"] },
  {
    rule: "breaker exits (PRD)",
    file: "docs/HARNIX_PRD.md",
    phrases: ["--reset-breaker <check-id> --reason", "10-1000"],
  },
  {
    rule: "only a valid pass or --reset-breaker resets the breaker",
    file: `${VERIFY}/evidence.md`,
    phrases: ["only a current valid pass or a user-authorized `--reset-breaker` resets"],
  },
  {
    rule: "no future-dated evidence, no other --cwd",
    file: `${VERIFY}/evidence.md`,
    phrases: ["future-dated", "`--cwd` that differs"],
  },
  {
    rule: "--run-checks points at cookbook-commands",
    file: `${VERIFY}/agent-transport.md`,
    phrases: ["cookbook-commands"],
  },
  { rule: "digest binds task id and check id", file: `${VERIFY}/gates.md`, phrases: ["task id and check id"] },
  {
    rule: "--run-check and --evidence tick the checklist",
    file: `${VERIFY}/gates.md`,
    phrases: ["`--run-check` or `--evidence`"],
  },
  {
    rule: "heredoc EOF and PowerShell ANSI explain --file",
    file: `${VERIFY}/cookbook-notes.md`,
    phrases: ["heredoc", "unexpected EOF", "ANSI"],
  },
  {
    rule: "resume refuses a pointer collision",
    file: `${VERIFY}/workflow-routing.md`,
    phrases: ["refuses to replace another active task"],
  },
  {
    rule: "learning is reviewed before promotion",
    file: `${VERIFY}/task-state.md`,
    phrases: ["review with `harnix learning`"],
  },
  { rule: "epic: expected branch", file: `${PLAN}/epic.md`, phrases: ["expected base or feature branch"] },
  { rule: "epic: follow-up notice", file: `${PLAN}/epic.md`, phrases: ["`notice:`", "has none"] },
  {
    rule: "plan critique: lenses, verified candidates, skipped",
    file: `${PLAN}/plan-critique.md`,
    phrases: [
      "Coverage",
      "Evidence",
      "Executability",
      "Risk",
      "Reconciliation",
      "Critical",
      "Not assessed",
      "Consistent",
      "skipped",
    ],
  },
  {
    rule: "critique and replan converge",
    file: `${PLAN}/plan-critique.md`,
    phrases: ["simplif", "residual risk", "oscillate", "earlier member changed"],
  },
  {
    rule: "ready review: atomic criteria, labelled assumptions, what the user may not know",
    file: `${PLAN}/ready-review.md`,
    phrases: ["atomic", "validated", "assumed", "unknown", "Điều bạn có thể chưa biết"],
  },
  {
    rule: "plan points at the critique",
    file: `${SKILLS}/harnix-plan/SKILL.md`,
    phrases: ["--reference plan-critique"],
  },
  {
    rule: "implement: four tiers for what implementation uncovers",
    file: `${SKILLS}/harnix-implement/references/discoveries.md`,
    phrases: ["Local judgment", "implementation-only", "Guidance", "--follow-up", "replan"],
  },
  {
    rule: "implement points at the discovery tiers",
    file: `${SKILLS}/harnix-implement/SKILL.md`,
    phrases: ["--reference discoveries"],
  },
  {
    rule: "research: refutation pass and supplied-knowledge gate",
    file: `${SKILLS}/harnix-research/SKILL.md`,
    phrases: ["Refute", "supports", "weakens", "refutes", "unresolved", "supplied context"],
  },
  {
    rule: "finding triage: disproof questions, verdicts, one destination",
    file: `${SKILLS}/harnix-review/references/finding-triage.md`,
    phrases: ["CONFIRMED", "DISPROVED", "DOWNGRADED", "Not assessed", "one destination", "no subagent"],
  },
  {
    rule: "review and security lens point at the triage",
    file: `${SKILLS}/harnix-review/SKILL.md`,
    phrases: ["--reference finding-triage"],
  },
  {
    rule: "security lens uses the same triage",
    file: `${SKILLS}/harnix-security-lens/SKILL.md`,
    phrases: ["harnix-review --reference finding-triage"],
  },
];

describe("reference rules kept after shortening", () => {
  for (const { rule, file, phrases } of RULES) {
    it(rule, () => {
      const text = readFileSync(join(process.cwd(), file), "utf8");
      const missing = phrases.filter((phrase) => !text.includes(phrase));

      expect(missing, `${file} lost: ${missing.join(" | ")}`).toEqual([]);
    });
  }
});
