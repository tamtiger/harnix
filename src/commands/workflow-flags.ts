import { FLAG_OWNERS, listed } from "src/commands/workflow-flag-owners.js";
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
  epicOrder?: string | string[];
  addCriterion?: string;
  setCriterion?: string;
  addDecision?: string;
  addRisk?: string;
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
  epic?: string;
}

const BOOLEAN_ACTIONS = [
  "inspect",
  "preflight",
  "init",
  "batch",
  "save",
  "snapshot",
  "finish",
  "cancel",
  "learn",
  "evidence",
  "schema",
  "migrate",
  "runChecks",
  "setPaths",
] as const;
const VALUE_ACTIONS = [
  "transition",
  "criterion",
  "runCheck",
  "setCheck",
  "setBaseline",
  "replaceCheck",
  "epicOrder",
  "addCriterion",
  "setCriterion",
  "addDecision",
  "addRisk",
] as const;

export function selectAction(flags: WorkflowFlags): string {
  const selected: string[] = BOOLEAN_ACTIONS.filter((name) => flags[name] === true);
  for (const name of VALUE_ACTIONS) if (flags[name] !== undefined) selected.push(name);
  const [only] = selected;
  if (selected.length !== 1 || only === undefined)
    throw new Error(
      "workflow requires exactly one of --inspect, --preflight, --init, --batch, --save, --transition, --evidence, --criterion, --migrate, --run-check, --run-checks, --set-check, --replace-check, --add-criterion, --add-decision, --add-risk, --set-paths, --set-criterion, --set-baseline, --epic-order, --schema, --snapshot, --finish, --cancel, or --learn.",
    );
  return only;
}

export function isEvidenceFlagsMode(action: string, flags: WorkflowFlags): boolean {
  if (action !== "evidence") return false;
  return (
    [flags.check, flags.result, flags.exitCode, flags.summary, flags.digest].some((value) => value !== undefined) ||
    listed(flags.artifact)
  );
}

export function assertCommandShape(action: string, flags: WorkflowFlags, operands: string[]): void {
  if (action === "runCheck" && operands.length === 0)
    throw new Error("workflow --run-check requires an executable after --.");
  if (action !== "runCheck" && operands.length > 0)
    throw new Error(`workflow does not accept operands: ${operands.join(" ")}`);
  if (flags.brief === true && !BRIEF_ACTIONS.has(action))
    throw new Error(
      `--brief is not supported for workflow ${actionFlagName(action)}; it works with ${briefFlagNames().join(", ")}.`,
    );
  if (action === "snapshot" && flags.check === undefined) throw new Error("workflow --snapshot requires --check <id>.");
  if (flags.check !== undefined && !["snapshot", "evidence", "addCriterion"].includes(action))
    throw new Error("--check requires workflow --snapshot, --evidence or --add-criterion.");
}

export function assertFlagGroups(action: string, flags: WorkflowFlags): void {
  if (action === "learn" && (flags.text !== undefined || flags.rationale !== undefined))
    throw new Error(
      "--learn reads a JSON { candidate: { id, statement, sourceTaskIds, evidenceIds } } from stdin and takes no --text or --rationale; " +
        "for a lesson without a stdin body use --add-decision or --add-risk on the active task (finish captures them).",
    );
  for (const owner of FLAG_OWNERS)
    if (owner.isSet(flags) && !owner.actions.includes(action)) throw new Error(`${owner.name} requires ${owner.hint}.`);
  assertTextFlags(action, flags);
  if (action === "criterion" && flags.met !== true) throw new Error("workflow --criterion requires --met.");
  if (action === "addCriterion" && flags.text === undefined)
    throw new Error("workflow --add-criterion requires --text.");
  if (action === "replaceCheck" && flags.reason === undefined)
    throw new Error("workflow --replace-check requires --reason.");
  assertNoteFlags(action, flags);
  if (action === "setPaths" && !listed(flags.relevantPath) && !listed(flags.relevantSpec))
    throw new Error("workflow --set-paths requires --relevant-path and/or --relevant-spec.");
  if (isEvidenceFlagsMode(action, flags) && (!flags.check || !flags.result || flags.summary === undefined))
    throw new Error("workflow --evidence with flags requires --check, --result and --summary.");
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
