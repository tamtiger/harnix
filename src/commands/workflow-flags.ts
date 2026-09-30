export interface WorkflowFlags {
  inspect?: boolean;
  preflight?: boolean;
  save?: boolean;
  snapshot?: boolean;
  finish?: boolean;
  cancel?: boolean;
  learn?: boolean;
  evidence?: boolean;
  schema?: boolean;
  migrate?: boolean;
  setPaths?: boolean;
  met?: boolean;
  brief?: boolean;
  required?: boolean;
  transition?: string;
  criterion?: string;
  runCheck?: string;
  setCheck?: string;
  addCriterion?: string;
  addDecision?: string;
  addRisk?: string;
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
  text?: string;
  rationale?: string;
  severity?: string;
  artifact?: string[];
  input?: string[];
  relevantPath?: string[];
  relevantSpec?: string[];
}

const BOOLEAN_ACTIONS = [
  "inspect",
  "preflight",
  "save",
  "snapshot",
  "finish",
  "cancel",
  "learn",
  "evidence",
  "schema",
  "migrate",
  "setPaths",
] as const;
const VALUE_ACTIONS = [
  "transition",
  "criterion",
  "runCheck",
  "setCheck",
  "addCriterion",
  "addDecision",
  "addRisk",
] as const;
const BRIEF_ACTIONS = new Set([
  "save",
  "transition",
  "evidence",
  "criterion",
  "migrate",
  "finish",
  "runCheck",
  "setCheck",
  "addCriterion",
  "addDecision",
  "addRisk",
  "setPaths",
]);

interface FlagOwner {
  name: string;
  isSet: (flags: WorkflowFlags) => boolean;
  actions: readonly string[];
  hint: string;
}

const listed = (value: readonly string[] | undefined): boolean => (value?.length ?? 0) > 0;

/** Flags that only make sense with specific actions; anything else is rejected before any state is read. */
const FLAG_OWNERS: readonly FlagOwner[] = [
  { name: "--result", isSet: (f) => f.result !== undefined, actions: ["evidence"], hint: "workflow --evidence" },
  { name: "--exit-code", isSet: (f) => f.exitCode !== undefined, actions: ["evidence"], hint: "workflow --evidence" },
  { name: "--digest", isSet: (f) => f.digest !== undefined, actions: ["evidence"], hint: "workflow --evidence" },
  { name: "--artifact", isSet: (f) => listed(f.artifact), actions: ["evidence"], hint: "workflow --evidence" },
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
    actions: ["setCheck"],
    hint: "workflow --set-check",
  },
  { name: "--command", isSet: (f) => f.command !== undefined, actions: ["setCheck"], hint: "workflow --set-check" },
  { name: "--scope", isSet: (f) => f.scope !== undefined, actions: ["setCheck"], hint: "workflow --set-check" },
  {
    name: "--required/--no-required",
    isSet: (f) => f.required !== undefined,
    actions: ["setCheck"],
    hint: "workflow --set-check",
  },
  { name: "--criteria", isSet: (f) => f.criteria !== undefined, actions: ["setCheck"], hint: "workflow --set-check" },
  { name: "--input", isSet: (f) => listed(f.input), actions: ["setCheck"], hint: "workflow --set-check" },
  {
    name: "--reason",
    isSet: (f) => f.reason !== undefined,
    actions: ["setCheck", "addCriterion"],
    hint: "workflow --set-check or --add-criterion",
  },
  {
    name: "--text",
    isSet: (f) => f.text !== undefined,
    actions: ["addCriterion", "addDecision", "addRisk"],
    hint: "workflow --add-criterion, --add-decision or --add-risk",
  },
  {
    name: "--rationale",
    isSet: (f) => f.rationale !== undefined,
    actions: ["addDecision"],
    hint: "workflow --add-decision",
  },
  { name: "--severity", isSet: (f) => f.severity !== undefined, actions: ["addRisk"], hint: "workflow --add-risk" },
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
];

export function selectAction(flags: WorkflowFlags): string {
  const selected: string[] = BOOLEAN_ACTIONS.filter((name) => flags[name] === true);
  for (const name of VALUE_ACTIONS) if (flags[name] !== undefined) selected.push(name);
  const [only] = selected;
  if (selected.length !== 1 || only === undefined)
    throw new Error(
      "workflow requires exactly one of --inspect, --preflight, --save, --transition, --evidence, --criterion, --migrate, --run-check, --set-check, --add-criterion, --add-decision, --add-risk, --set-paths, --schema, --snapshot, --finish, --cancel, or --learn.",
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
    throw new Error(`--brief is not supported for workflow --${action}.`);
  if (action === "snapshot" && flags.check === undefined) throw new Error("workflow --snapshot requires --check <id>.");
  if (flags.check !== undefined && !["snapshot", "evidence", "addCriterion"].includes(action))
    throw new Error("--check requires workflow --snapshot, --evidence or --add-criterion.");
}

export function assertFlagGroups(action: string, flags: WorkflowFlags): void {
  for (const owner of FLAG_OWNERS)
    if (owner.isSet(flags) && !owner.actions.includes(action)) throw new Error(`${owner.name} requires ${owner.hint}.`);
  if (action === "criterion" && flags.met !== true) throw new Error("workflow --criterion requires --met.");
  if (action === "addCriterion" && flags.text === undefined)
    throw new Error("workflow --add-criterion requires --text.");
  assertNoteFlags(action, flags);
  if (action === "setPaths" && !listed(flags.relevantPath) && !listed(flags.relevantSpec))
    throw new Error("workflow --set-paths requires --relevant-path and/or --relevant-spec.");
  if (isEvidenceFlagsMode(action, flags) && (!flags.check || !flags.result || flags.summary === undefined))
    throw new Error("workflow --evidence with flags requires --check, --result and --summary.");
}

function assertNoteFlags(action: string, flags: WorkflowFlags): void {
  if (action === "addDecision" && (flags.text === undefined || flags.rationale === undefined))
    throw new Error("workflow --add-decision requires --text and --rationale.");
  if (action === "addRisk" && flags.text === undefined) throw new Error("workflow --add-risk requires --text.");
  if (flags.severity !== undefined && !["low", "medium", "high"].includes(flags.severity))
    throw new Error("--severity must be low, medium or high.");
}
