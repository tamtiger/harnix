import type { WorkflowFlags } from "src/commands/workflow-flags.js";
import { listFlags } from "src/core/workflow/actions.js";

/** Which workflow action each flag belongs to: a flag used with another action is rejected before any state is read. */
export interface FlagOwner {
  name: string;
  isSet: (flags: WorkflowFlags) => boolean;
  actions: readonly string[];
  /** Only for a flag that needs more than the list of its actions; otherwise the hint is generated from them. */
  hint?: string;
}

/** What a misplaced flag is told: `workflow --a, --b or --c`, from the actions that own it. */
export const ownerHint = (owner: FlagOwner): string => owner.hint ?? `workflow ${listFlags(owner.actions)}`;

export const listed = (value: readonly string[] | undefined): boolean => (value?.length ?? 0) > 0;

const baselineOwner = (name: string, pick: (flags: WorkflowFlags) => string | undefined): FlagOwner => ({
  name,
  isSet: (f) => pick(f) !== undefined,
  actions: ["setBaseline"],
});

const initOwner = (name: string, pick: (flags: WorkflowFlags) => string | undefined): FlagOwner => ({
  name,
  isSet: (f) => pick(f) !== undefined,
  actions: ["init"],
});

const EDIT_ACTIONS = [
  "inspect",
  "setCheck",
  "addCriterion",
  "setPaths",
  "addDecision",
  "addRisk",
  "setCriterion",
  "removeDecision",
  "removeCriterion",
  "removeRisk",
  "setTitle",
  "setGoal",
  "batch",
];
const taskOwner: FlagOwner = {
  name: "--task",
  isSet: (f) => f.task !== undefined,
  actions: [...EDIT_ACTIONS, "transition"],
  hint: "workflow --inspect, --transition with --dry-run, --set-check, --add-criterion, --set-criterion, --set-paths, --set-title, --set-goal, --add-decision, --add-risk, --remove-decision, --remove-criterion, --remove-risk or --batch (state changes, evidence and finish act only on the active task)",
};

/** Flags that only make sense with specific actions; anything else is rejected before any state is read. */
export const FLAG_OWNERS: readonly FlagOwner[] = [
  {
    name: "--expected-task",
    isSet: (f) => f.expectedTask !== undefined,
    actions: ["preflight"],
  },
  {
    name: "--file",
    isSet: (f) => f.file !== undefined,
    actions: ["save", "batch", "migrate", "evidence", "cancel", "learn", "init", "setPaths"],
  },
  {
    name: "--result",
    isSet: (f) => f.result !== undefined,
    actions: ["evidence", "setBaseline"],
  },
  baselineOwner("--classification", (f) => f.classification),
  {
    name: "--authorized-by",
    isSet: (f) => f.authorizedBy !== undefined,
    actions: ["setBaseline", "cancel"],
  },
  {
    name: "--summary",
    isSet: (f) => f.summary !== undefined,
    actions: ["evidence", "runCheck"],
  },
  { name: "--exit-code", isSet: (f) => f.exitCode !== undefined, actions: ["evidence"] },
  { name: "--artifact", isSet: (f) => listed(f.artifact), actions: ["evidence"] },
  { name: "--digest", isSet: (f) => f.digest !== undefined, actions: ["evidence"] },
  { name: "--met", isSet: (f) => f.met === true, actions: ["criterion"] },
  {
    name: "--evidence-ids",
    isSet: (f) => f.evidenceIds !== undefined,
    actions: ["criterion"],
  },
  {
    name: "--description",
    isSet: (f) => f.description !== undefined,
    actions: ["setCheck", "replaceCheck"],
  },
  {
    name: "--command",
    isSet: (f) => f.command !== undefined,
    actions: ["setCheck", "replaceCheck", "init"],
  },
  {
    name: "--scope",
    isSet: (f) => f.scope !== undefined,
    actions: ["setCheck", "replaceCheck", "setBaseline"],
  },
  {
    name: "--required/--no-required",
    isSet: (f) => f.required !== undefined,
    actions: ["setCheck"],
  },
  {
    name: "--criteria",
    isSet: (f) => f.criteria !== undefined,
    actions: ["setCheck", "replaceCheck"],
  },
  {
    name: "--input",
    isSet: (f) => listed(f.input),
    actions: ["setCheck", "replaceCheck", "init"],
  },
  {
    name: "--reason",
    isSet: (f) => f.reason !== undefined,
    actions: ["setCheck", "addCriterion", "setCriterion", "replaceCheck", "resetBreaker", "cancel", "transition"],
  },
  {
    name: "--note",
    isSet: (f) => f.note !== undefined,
    actions: ["transition"],
  },
  {
    name: "--text",
    isSet: (f) => f.text !== undefined,
    actions: ["addCriterion", "setCriterion", "addDecision", "addRisk", "init"],
  },
  {
    name: "--rationale",
    isSet: (f) => f.rationale !== undefined,
    actions: ["addDecision"],
  },
  { name: "--severity", isSet: (f) => f.severity !== undefined, actions: ["addRisk"] },
  { name: "--mitigation", isSet: (f) => f.mitigation !== undefined, actions: ["addRisk"] },
  taskOwner,
  initOwner("--title", (f) => f.title),
  initOwner("--slug", (f) => f.slug),
  initOwner("--mode", (f) => f.mode),
  initOwner("--goal", (f) => f.goal),
  {
    name: "--relevant-path",
    isSet: (f) => listed(f.relevantPath),
    actions: ["setPaths"],
  },
  {
    name: "--relevant-spec",
    isSet: (f) => listed(f.relevantSpec),
    actions: ["setPaths"],
  },
  {
    name: "--dry-run",
    isSet: (f) => f.dryRun === true,
    actions: ["transition"],
  },
  {
    name: "--cwd",
    isSet: (f) => f.cwd !== undefined,
    actions: ["setCheck", "replaceCheck", "runCheck", "init"],
  },
  initOwner("--epic", (f) => f.epic),
  { name: "--checklist", isSet: (f) => f.checklist === true, actions: ["transition"] },
  {
    name: "--reviewed",
    isSet: (f) => f.reviewed === true,
    actions: ["transition"],
  },
  initOwner("--follow-up", (f) => f.followUp),
  { name: "--no-activate", isSet: (f) => f.activate === false, actions: ["init"] },
  initOwner("--with-check", (f) => (listed(f.withCheck) ? "set" : undefined)),
];
