import { FLAG_OWNERS, listed, ownerHint } from "src/commands/workflow-flag-owners.js";
import { EXACTLY_ONE_ACTION_MESSAGE, WORKFLOW_ACTIONS } from "src/core/workflow/actions.js";
import { BRIEF_ACTIONS, actionFlagName, briefFlagNames } from "src/core/workflow/brief.js";

export interface WorkflowFlags {
  inspect?: boolean;
  preflight?: boolean;
  init?: boolean;
  batch?: boolean;
  save?: boolean;
  snapshot?: boolean;
  finish?: boolean;
  cancel?: boolean;
  learn?: boolean;
  evidence?: boolean;
  schema?: boolean;
  migrate?: boolean;
  runChecks?: boolean;
  setPaths?: boolean;
  met?: boolean;
  brief?: boolean;
  full?: boolean;
  dryRun?: boolean;
  required?: boolean;
  transition?: string;
  criterion?: string;
  runCheck?: string;
  setCheck?: string;
  setBaseline?: string;
  classification?: string;
  authorizedBy?: string;
  replaceCheck?: string | string[];
  resetBreaker?: string;
  epicOrder?: string | string[];
  addCriterion?: string;
  setCriterion?: string;
  addDecision?: string;
  addRisk?: string;
  removeDecision?: string;
  removeCriterion?: string;
  removeRisk?: string;
  mitigation?: string;
  setTitle?: string;
  setGoal?: string;
  tick?: string;
  file?: string;
  title?: string;
  task?: string;
  slug?: string;
  mode?: string;
  goal?: string;
  check?: string;
  result?: string;
  exitCode?: string;
  summary?: string;
  digest?: string;
  evidenceIds?: string;
  description?: string;
  command?: string;
  scope?: string;
  criteria?: string;
  reason?: string;
  note?: string;
  text?: string | string[];
  withCheck?: string[];
  rationale?: string;
  severity?: string;
  artifact?: string[];
  input?: string[];
  relevantPath?: string[];
  relevantSpec?: string[];
  cwd?: string;
  followUp?: string;
  reviewed?: boolean;
  checklist?: boolean;
  epic?: string;
  activate?: boolean;
  expectedTask?: string;
}

const SWITCH_ACTIONS = WORKFLOW_ACTIONS.filter((spec) => spec.kind === "switch").map((spec) => spec.name);
const VALUE_ACTIONS = WORKFLOW_ACTIONS.filter((spec) => spec.kind === "value").map((spec) => spec.name);

const BATCHABLE_ACTIONS = new Set(["criterion", "transition", "finish"]);

export function selectActions(flags: WorkflowFlags): string[] {
  const values = flags as Record<string, unknown>;
  const selected: string[] = SWITCH_ACTIONS.filter((name) => values[name] === true);
  for (const name of VALUE_ACTIONS) if (values[name] !== undefined) selected.push(name);

  if (selected.length === 0) {
    throw new Error(EXACTLY_ONE_ACTION_MESSAGE);
  }

  if (selected.length === 1) {
    return selected;
  }

  const nonBatchable = selected.filter((action) => !BATCHABLE_ACTIONS.has(action));
  if (nonBatchable.length > 0) {
    throw new Error(EXACTLY_ONE_ACTION_MESSAGE);
  }

  if (selected.includes("criterion") && flags.met !== true) {
    throw new Error("workflow --criterion requires --met.");
  }

  if (selected.includes("transition") && selected.includes("finish")) {
    if (flags.transition !== "verifying/finishing") {
      throw new Error(
        "workflow action batching does not allow combining --transition with --finish unless transitioning to verifying/finishing.",
      );
    }
  }

  if (flags.dryRun === true) {
    throw new Error("workflow action batching does not support --dry-run.");
  }

  return ["criterion", "transition", "finish"].filter((action) => selected.includes(action));
}

export function selectAction(flags: WorkflowFlags): string {
  const actions = selectActions(flags);
  return actions[0]!;
}

export function isEvidenceFlagsMode(action: string, flags: WorkflowFlags): boolean {
  if (action !== "evidence") return false;
  return (
    [flags.check, flags.result, flags.exitCode, flags.summary, flags.digest].some((value) => value !== undefined) ||
    listed(flags.artifact)
  );
}

const ID_FLAGS = [
  ["--add-criterion", "addCriterion", "--text <text>"],
  ["--set-criterion", "setCriterion", "--text <text>"],
  ["--add-decision", "addDecision", "--text <text> --rationale <why>"],
  ["--add-risk", "addRisk", "--text <text>"],
] as const;

/** `--add-decision --text …` makes commander take `--text` as the id; say what the id slot expects instead. */
function assertIdFlagValues(flags: WorkflowFlags): void {
  for (const [name, key, rest] of ID_FLAGS) {
    const value = flags[key];
    if (typeof value === "string" && (value.startsWith("-") || /\s/u.test(value)))
      throw new Error(`${name} takes an id (for example dec-1) before the other flags: ${name} <id> ${rest}.`);
  }
}

export function assertCommandShape(action: string, flags: WorkflowFlags, operands: string[]): void {
  assertIdFlagValues(flags);
  if (action === "runCheck" && operands.length === 0)
    throw new Error("workflow --run-check requires an executable after --.");
  if (action !== "runCheck" && operands.length > 0)
    throw new Error(`workflow does not accept operands: ${operands.join(" ")}`);
  if (flags.brief === true && flags.full === true) throw new Error("--brief and --full are mutually exclusive.");
  if (flags.brief === true && !BRIEF_ACTIONS.has(action))
    throw new Error(
      `--brief is not supported for workflow ${actionFlagName(action)}; it works with ${briefFlagNames().join(", ")}.`,
    );
  if (flags.full === true && !BRIEF_ACTIONS.has(action))
    throw new Error(
      `--full is not supported for workflow ${actionFlagName(action)}; it works with ${briefFlagNames().join(", ")}.`,
    );
  if (action === "snapshot" && flags.check === undefined) throw new Error("workflow --snapshot requires --check <id>.");
  if ((action === "snapshot" || action === "evidence") && flags.check?.includes(","))
    throw new Error(`workflow ${actionFlagName(action)} takes one check id in --check, not a list: ${flags.check}.`);
  if (flags.check !== undefined && !["snapshot", "evidence", "addCriterion"].includes(action))
    throw new Error("--check requires workflow --snapshot, --evidence or --add-criterion.");
}

function assertActionRequirements(action: string, flags: WorkflowFlags): void {
  if (action === "criterion" && flags.met !== true) throw new Error("workflow --criterion requires --met.");
  if (action === "addCriterion" && flags.text === undefined)
    throw new Error("workflow --add-criterion requires --text.");
  if (action === "replaceCheck" && flags.reason === undefined)
    throw new Error("workflow --replace-check requires --reason.");
  if (action === "setPaths" && flags.file === undefined && !listed(flags.relevantPath) && !listed(flags.relevantSpec))
    throw new Error(
      "workflow --set-paths requires --relevant-path and/or --relevant-spec, or --file with a { paths, specs } payload.",
    );
  assertOnePayloadForm(action, flags);
  if (isEvidenceFlagsMode(action, flags) && (!flags.check || !flags.result || flags.summary === undefined))
    throw new Error("workflow --evidence with flags requires --check, --result and --summary.");
}

/** `--evidence` and `--cancel` take their payload from flags or from `--file`; a mix would drop one side silently. */
function assertOnePayloadForm(action: string, flags: WorkflowFlags): void {
  if (isEvidenceFlagsMode(action, flags) && flags.file !== undefined)
    throw new Error("workflow --evidence takes either --file <payload.json> or --check/--result/--summary, not both.");
  if (action !== "cancel") return;
  if (flags.reason !== undefined && flags.file !== undefined)
    throw new Error("workflow --cancel takes either --reason <text> or --file <payload.json>, not both.");
  if (flags.reason === undefined && flags.authorizedBy !== undefined)
    throw new Error(
      "workflow --cancel uses --authorized-by only together with --reason <text>; a --file payload carries its own authorizedBy.",
    );
}

export function assertFlagGroups(
  action: string,
  flags: WorkflowFlags,
  activeActions: readonly string[] = [action],
): void {
  if (action === "learn" && (flags.text !== undefined || flags.rationale !== undefined))
    throw new Error(
      "--learn reads a JSON { candidate: { id, statement, sourceTaskIds, evidenceIds } } from stdin and takes no --text or --rationale; " +
        "for a lesson without a stdin body use --add-decision or --add-risk on the active task (finish captures them).",
    );
  for (const owner of FLAG_OWNERS)
    if (owner.isSet(flags) && !owner.actions.some((a) => activeActions.includes(a)))
      throw new Error(`${owner.name} requires ${ownerHint(owner)}.`);
  if (action === "transition" && flags.task !== undefined && flags.dryRun !== true)
    throw new Error(
      "--task works with workflow --transition only together with --dry-run (a state change acts on the active task).",
    );
  assertTextFlags(action, flags);
  assertActionRequirements(action, flags);
  assertNoteFlags(action, flags);
}

function assertTextFlags(action: string, flags: WorkflowFlags): void {
  if (action !== "init" && Array.isArray(flags.text))
    throw new Error("--text may repeat only with workflow --init; pass it once.");
  if (action === "setCriterion" && flags.text === undefined)
    throw new Error("workflow --set-criterion requires --text.");
}

function assertNoteFlags(action: string, flags: WorkflowFlags): void {
  if (action === "epicOrder" && [flags.epicOrder].flat().length === 0)
    throw new Error("workflow --epic-order requires <epic-id> followed by the task ids in run order.");
  if (
    action === "setBaseline" &&
    [flags.result, flags.classification, flags.authorizedBy, flags.scope].includes(undefined)
  )
    throw new Error("workflow --set-baseline requires --result, --classification, --authorized-by and --scope.");
  if (action === "addDecision" && (flags.text === undefined || flags.rationale === undefined))
    throw new Error("workflow --add-decision requires --text and --rationale.");
  if (action === "addRisk" && flags.text === undefined) throw new Error("workflow --add-risk requires --text.");
  if (flags.severity !== undefined && !["low", "medium", "high"].includes(flags.severity))
    throw new Error("--severity must be low, medium or high.");
}
