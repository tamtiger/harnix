/**
 * The one list of `harnix workflow` actions. Flag validation, the "requires exactly one of" message, the actions that
 * accept `--brief` and the flag-owner hints are all derived from it, so a new action is added here (plus its option in
 * `workflow-command.ts`, its handler and its `--schema` description, which tests check against this list).
 * The order is the order of the "requires exactly one of" message.
 */
export interface WorkflowActionSpec {
  /** The camel-case action and `WorkflowFlags` key: `runCheck` is `--run-check`. */
  readonly name: string;
  /** A switch (`--inspect`) or a flag that takes a value (`--run-check <id>`). */
  readonly kind: "switch" | "value";
  /** Accepts `--brief` / `--full`. */
  readonly brief: boolean;
}

const action = (name: string, kind: WorkflowActionSpec["kind"], brief: boolean): WorkflowActionSpec => ({
  name,
  kind,
  brief,
});

export const WORKFLOW_ACTIONS: readonly WorkflowActionSpec[] = [
  action("inspect", "switch", false),
  action("preflight", "switch", true),
  action("init", "switch", true),
  action("batch", "switch", true),
  action("save", "switch", true),
  action("transition", "value", true),
  action("evidence", "switch", true),
  action("criterion", "value", true),
  action("migrate", "switch", true),
  action("runCheck", "value", true),
  action("runChecks", "switch", true),
  action("setCheck", "value", true),
  action("replaceCheck", "value", true),
  action("resetBreaker", "value", true),
  action("addCriterion", "value", true),
  action("addDecision", "value", true),
  action("addRisk", "value", true),
  action("removeDecision", "value", true),
  action("removeCriterion", "value", true),
  action("removeRisk", "value", true),
  action("setPaths", "switch", true),
  action("setTitle", "value", true),
  action("setGoal", "value", true),
  action("setCriterion", "value", true),
  action("setBaseline", "value", true),
  action("epicOrder", "value", false),
  action("schema", "switch", true),
  action("snapshot", "switch", false),
  action("finish", "switch", true),
  action("cancel", "switch", false),
  action("tick", "value", false),
  action("learn", "switch", false),
];

/** The command-line flag of a workflow action: `runCheck` is `--run-check`. */
export const actionFlagName = (name: string): string =>
  `--${name.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`)}`;

/** `a`, `a or b`, `a, b or c`: how a hint lists the flags of several actions. */
export function listFlags(names: readonly string[], conjunction = "or"): string {
  const flags = names.map(actionFlagName);
  if (flags.length <= 1) return flags.join("");
  return `${flags.slice(0, -1).join(", ")} ${conjunction} ${flags.at(-1)!}`;
}

/** The error for a workflow call that names no action, or several that cannot run together. */
export const EXACTLY_ONE_ACTION_MESSAGE = `workflow requires exactly one of ${WORKFLOW_ACTIONS.map((spec) =>
  actionFlagName(spec.name),
)
  .slice(0, -1)
  .join(", ")}, or ${actionFlagName(WORKFLOW_ACTIONS.at(-1)!.name)}.`;
