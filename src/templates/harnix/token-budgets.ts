import budgets from "./token-budgets.json" with { type: "json" };

/**
 * Every token ceiling of the instruction surfaces, in one place (`token-budgets.json`, also read by
 * `scripts/measure-tokens.mjs`). A ceiling blocks growth; it is not a target. Lower one when a refactor leaves room,
 * never raise it to make a change pass.
 */
export interface TokenBudgets {
  /** The always-loaded block of each platform surface. */
  readonly alwaysLoaded: number;
  /** Any SKILL.md without its own ceiling. */
  readonly skill: number;
  /** SKILL.md files with a lower ceiling because they are loaded most. */
  readonly skills: Readonly<Record<string, number>>;
  /** A technique skill (arch-review, security-lens and the like). */
  readonly techniqueSkill: number;
  /** One reference file. */
  readonly reference: number;
  /** The `.harnix/workflow.md` template. */
  readonly workflow: number;
  /** Always-loaded block plus harnix-implement. */
  readonly directPath: number;
  /** Always-loaded block, workflow.md and the plan, implement and verify skills. */
  readonly fullPath: number;
  /** `<skill>/<topic>` references still above the reference ceiling; the list may only shrink. */
  readonly referenceExemptions: readonly string[];
}

export const TOKEN_BUDGETS: TokenBudgets = budgets;

/** The same approximation as `context.tokenApproximation` in `.harnix/config.yaml`. */
export const CHARACTERS_PER_TOKEN = 4;

export const approximateTokens = (text: string): number => Math.ceil(text.length / CHARACTERS_PER_TOKEN);

/** The ceiling of one skill: its own, or the common one. */
export const skillBudget = (name: string): number => TOKEN_BUDGETS.skills[name] ?? TOKEN_BUDGETS.skill;
