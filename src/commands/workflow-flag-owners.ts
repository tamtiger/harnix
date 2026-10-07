import type { WorkflowFlags } from "src/commands/workflow-flags.js";

/** Which workflow action each flag belongs to: a flag used with another action is rejected before any state is read. */
export interface FlagOwner {
  name: string;
  isSet: (flags: WorkflowFlags) => boolean;
  actions: readonly string[];
  hint: string;
}

export const listed = (value: readonly string[] | undefined): boolean => (value?.length ?? 0) > 0;

const baselineOwner = (name: string, pick: (flags: WorkflowFlags) => string | undefined): FlagOwner => ({
  name,
  isSet: (f) => pick(f) !== undefined,
  actions: ["setBaseline"],
  hint: "workflow --set-baseline",
});

const initOwner = (name: string, pick: (flags: WorkflowFlags) => string | undefined): FlagOwner => ({
  name,
  isSet: (f) => pick(f) !== undefined,
  actions: ["init"],
  hint: "workflow --init",
});

const EDIT_ACTIONS = ["inspect", "setCheck", "addCriterion", "setPaths", "addDecision", "addRisk", "batch"];
const taskOwner: FlagOwner = {
  name: "--task",
  isSet: (f) => f.task !== undefined,
  actions: EDIT_ACTIONS,
  hint: "workflow --inspect, --set-check, --add-criterion, --set-paths, --add-decision, --add-risk or --batch (state changes, evidence and finish act only on the active task)",
};

/** Flags that only make sense with specific actions; anything else is rejected before any state is read. */
export const FLAG_OWNERS: readonly FlagOwner[] = [
  {
    name: "--result",
    isSet: (f) => f.result !== undefined,
    actions: ["evidence", "setBaseline"],
    hint: "workflow --evidence or --set-baseline",
  },
  baselineOwner("--classification", (f) => f.classification),
  baselineOwner("--authorized-by", (f) => f.authorizedBy),
  {
    name: "--summary",
    isSet: (f) => f.summary !== undefined,
    actions: ["evidence", "runCheck"],
    hint: "workflow --evidence or --run-check",
  },
  { name: "--met", isSet: (f) => f.met === true, actions: ["criterion"], hint: "workflow --criterion" },
  {
    name: "--evidence-ids",
    isSet: (f) => f.evidenceIds !== undefined,
    actions: ["criterion"],
    hint: "workflow --criterion",
  },
  {
    name: "--description",
    isSet: (f) => f.description !== undefined,
    actions: ["setCheck", "replaceCheck"],
    hint: "workflow --set-check or --replace-check",
  },
  {
    name: "--command",
    isSet: (f) => f.command !== undefined,
    actions: ["setCheck", "replaceCheck", "init"],
    hint: "workflow --set-check, --replace-check or --init",
  },
  {
    name: "--scope",
    isSet: (f) => f.scope !== undefined,
    actions: ["setCheck", "replaceCheck", "setBaseline"],
    hint: "workflow --set-check, --replace-check or --set-baseline",
  },
  {
    name: "--required/--no-required",
    isSet: (f) => f.required !== undefined,
    actions: ["setCheck"],
    hint: "workflow --set-check",
  },
  {
    name: "--criteria",
    isSet: (f) => f.criteria !== undefined,
    actions: ["setCheck", "replaceCheck"],
    hint: "workflow --set-check or --replace-check",
  },
  {
    name: "--input",
    isSet: (f) => listed(f.input),
    actions: ["setCheck", "replaceCheck", "init"],
    hint: "workflow --set-check, --replace-check or --init",
  },
  {
    name: "--reason",
    isSet: (f) => f.reason !== undefined,
    actions: ["setCheck", "addCriterion", "setCriterion", "replaceCheck"],
    hint: "workflow --set-check, --add-criterion, --set-criterion or --replace-check",
  },
  {
    name: "--text",
    isSet: (f) => f.text !== undefined,
    actions: ["addCriterion", "setCriterion", "addDecision", "addRisk", "init"],
    hint: "workflow --add-criterion, --set-criterion, --add-decision, --add-risk or --init",
  },
  {
    name: "--rationale",
    isSet: (f) => f.rationale !== undefined,
    actions: ["addDecision"],
    hint: "workflow --add-decision",
  },
  { name: "--severity", isSet: (f) => f.severity !== undefined, actions: ["addRisk"], hint: "workflow --add-risk" },
  taskOwner,
  initOwner("--title", (f) => f.title),
  initOwner("--slug", (f) => f.slug),
  initOwner("--mode", (f) => f.mode),
  initOwner("--goal", (f) => f.goal),
  {
    name: "--relevant-path",
    isSet: (f) => listed(f.relevantPath),
    actions: ["setPaths"],
    hint: "workflow --set-paths",
  },
  {
    name: "--relevant-spec",
    isSet: (f) => listed(f.relevantSpec),
    actions: ["setPaths"],
    hint: "workflow --set-paths",
  },
  {
    name: "--dry-run",
    isSet: (f) => f.dryRun === true,
    actions: ["transition"],
    hint: "workflow --transition",
  },
  {
    name: "--cwd",
    isSet: (f) => f.cwd !== undefined,
    actions: ["setCheck", "replaceCheck", "runCheck"],
    hint: "workflow --set-check, --replace-check or --run-check",
  },
  initOwner("--epic", (f) => f.epic),
  {
    name: "--reviewed",
    isSet: (f) => f.reviewed === true,
    actions: ["transition"],
    hint: "workflow --transition",
  },
  initOwner("--follow-up", (f) => f.followUp),
  initOwner("--with-check", (f) => (listed(f.withCheck) ? "set" : undefined)),
];
