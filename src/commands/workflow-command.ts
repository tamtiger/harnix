import type { Command } from "commander";

import {
  appendEvidenceFlagsWorkflow,
  appendEvidenceWorkflow,
  briefTask,
  cancelWorkflow,
  finishWorkflow,
  inspectWorkflow,
  markCriteriaMetWorkflow,
  migrateToV3Workflow,
  preflightWorkflow,
  recordLearningWorkflow,
  runCheckWorkflow,
  saveWorkflow,
  snapshotWorkflow,
  transitionWorkflow,
  workflowEnvelopeSchema,
} from "src/commands/internal-workflow.js";
import type { CheckRunner } from "src/utils/check-runner.js";
import { readBoundedInput } from "src/utils/bounded-input.js";
import { resolveProjectRoot } from "src/utils/paths.js";

export interface WorkflowCommandOptions {
  workflowInput?: (() => Promise<string>) | undefined;
  checkRunner?: CheckRunner | undefined;
}

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
  met?: boolean;
  brief?: boolean;
  transition?: string;
  criterion?: string;
  runCheck?: string;
  check?: string;
  result?: string;
  exitCode?: string;
  summary?: string;
  digest?: string;
  evidenceIds?: string;
  artifact?: string[];
}

interface WorkflowContext {
  root: string;
  flags: WorkflowFlags;
  operands: string[];
  options: WorkflowCommandOptions;
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
] as const;
const BRIEF_ACTIONS = new Set(["save", "transition", "evidence", "criterion", "migrate", "finish", "runCheck"]);

function selectAction(flags: WorkflowFlags): string {
  const selected: string[] = BOOLEAN_ACTIONS.filter((name) => flags[name] === true);
  if (flags.transition !== undefined) selected.push("transition");
  if (flags.criterion !== undefined) selected.push("criterion");
  if (flags.runCheck !== undefined) selected.push("runCheck");
  const [only] = selected;
  if (selected.length !== 1 || only === undefined)
    throw new Error(
      "workflow requires exactly one of --inspect, --preflight, --save, --transition, --evidence, --criterion, --migrate, --run-check, --schema, --snapshot, --finish, --cancel, or --learn.",
    );
  return only;
}

function isEvidenceFlagsMode(action: string, flags: WorkflowFlags): boolean {
  return (
    (action === "evidence" &&
      [flags.check, flags.result, flags.exitCode, flags.summary, flags.digest].some((value) => value !== undefined)) ||
    (action === "evidence" && (flags.artifact?.length ?? 0) > 0)
  );
}

function assertCommandShape(action: string, flags: WorkflowFlags, operands: string[]): void {
  if (action === "runCheck" && operands.length === 0)
    throw new Error("workflow --run-check requires an executable after --.");
  if (action !== "runCheck" && operands.length > 0)
    throw new Error(`workflow does not accept operands: ${operands.join(" ")}`);
  if (flags.brief === true && !BRIEF_ACTIONS.has(action))
    throw new Error(`--brief is not supported for workflow --${action}.`);
  if (action === "snapshot" && flags.check === undefined) throw new Error("workflow --snapshot requires --check <id>.");
  if (flags.check !== undefined && action !== "snapshot" && action !== "evidence")
    throw new Error("--check requires workflow --snapshot or --evidence.");
}

function assertFlagGroups(action: string, flags: WorkflowFlags): void {
  const evidenceOnly: [string, unknown][] = [
    ["--result", flags.result],
    ["--exit-code", flags.exitCode],
    ["--digest", flags.digest],
    ["--artifact", (flags.artifact?.length ?? 0) > 0 ? flags.artifact : undefined],
  ];
  for (const [name, value] of evidenceOnly)
    if (value !== undefined && action !== "evidence") throw new Error(`${name} requires workflow --evidence.`);
  if (flags.summary !== undefined && action !== "evidence" && action !== "runCheck")
    throw new Error("--summary requires workflow --evidence or --run-check.");
  if (flags.met === true && action !== "criterion") throw new Error("--met requires workflow --criterion.");
  if (flags.evidenceIds !== undefined && action !== "criterion")
    throw new Error("--evidence-ids requires workflow --criterion.");
  if (action === "criterion" && flags.met !== true) throw new Error("workflow --criterion requires --met.");
  if (isEvidenceFlagsMode(action, flags) && (!flags.check || !flags.result || flags.summary === undefined))
    throw new Error("workflow --evidence with flags requires --check, --result and --summary.");
}

async function readInput(context: WorkflowContext, optional = false): Promise<string | undefined> {
  if (context.options.workflowInput) return context.options.workflowInput();
  if (optional && process.stdin.isTTY === true) return "";
  return readBoundedInput(process.stdin);
}

function parseJson(input: string | undefined, message: string, optional = false): unknown {
  if (!input) {
    if (optional) return undefined;
    throw new Error(message);
  }
  try {
    return JSON.parse(input) as unknown;
  } catch {
    throw new Error(message);
  }
}

async function readRequired(context: WorkflowContext, subject: string, invalid: string): Promise<unknown> {
  const input = await readInput(context);
  if (!input) throw new Error(`${subject} requires a bounded JSON envelope on stdin.`);
  return parseJson(input, invalid);
}

const splitList = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");

function presentTask(context: WorkflowContext, task: Parameters<typeof briefTask>[0], evidenceId?: string): unknown {
  return context.flags.brief === true ? briefTask(task, evidenceId) : task;
}

type Handler = (context: WorkflowContext) => Promise<unknown>;

const HANDLERS: Record<string, Handler> = {
  inspect: ({ root }) => inspectWorkflow(root),
  preflight: ({ root }) => preflightWorkflow(root),
  schema: () => Promise.resolve(workflowEnvelopeSchema()),
  snapshot: ({ root, flags }) => snapshotWorkflow(root, flags.check as string),
  save: async (context) => {
    const envelope = await readRequired(context, "Workflow save", "Workflow save requires valid JSON.");
    return presentTask(context, await saveWorkflow(context.root, envelope));
  },
  transition: async (context) => {
    const [status, checkpoint, ...rest] = (context.flags.transition as string).split("/");
    if (!status || !checkpoint || rest.length > 0)
      throw new Error("workflow --transition requires <status>/<checkpoint>.");
    return presentTask(context, await transitionWorkflow(context.root, status, checkpoint));
  },
  evidence: async (context) => {
    const { flags, root } = context;
    if (isEvidenceFlagsMode("evidence", flags)) {
      const appended = await appendEvidenceFlagsWorkflow(root, {
        check: flags.check as string,
        result: flags.result as string,
        summary: flags.summary as string,
        exitCode: flags.exitCode,
        artifacts: flags.artifact,
        digest: flags.digest,
      });
      return presentTask(context, appended.task, appended.evidenceId);
    }
    const envelope = await readRequired(context, "Workflow evidence", "Workflow evidence requires valid JSON.");
    const task = await appendEvidenceWorkflow(root, envelope);
    return presentTask(context, task, flags.brief === true ? task.evidence.at(-1)?.id : undefined);
  },
  criterion: async (context) => {
    const { flags, root } = context;
    const task = await markCriteriaMetWorkflow(root, {
      criterionIds: splitList(flags.criterion as string),
      evidenceIds: flags.evidenceIds === undefined ? undefined : splitList(flags.evidenceIds),
    });
    return presentTask(context, task);
  },
  migrate: async (context) => {
    const input = await readInput(context, true);
    const envelope = parseJson(input, "Workflow migration requires valid bounded JSON.", true);
    return presentTask(context, await migrateToV3Workflow(context.root, envelope));
  },
  runCheck: async ({ root, flags, operands, options }) => {
    const run = await runCheckWorkflow(root, flags.runCheck as string, operands, {
      runner: options.checkRunner,
      summary: flags.summary,
    });
    return {
      ...briefTask(run.task, run.evidenceId),
      result: run.result,
      exitCode: run.exitCode,
      outputTail: run.outputTail,
    };
  },
  cancel: async (context) => {
    const input = await readInput(context, true);
    return cancelWorkflow(context.root, parseJson(input, "Workflow cancellation requires valid bounded JSON.", true));
  },
  learn: async (context) => {
    const input = await readInput(context);
    return recordLearningWorkflow(
      context.root,
      parseJson(input, "Workflow learning capture requires valid bounded JSON.", true),
    );
  },
  finish: async (context) => presentTask(context, await finishWorkflow(context.root)),
};

const collectArtifact = (value: string, previous: string[]): string[] => [...previous, value];

export function registerWorkflowCommand(program: Command, options: WorkflowCommandOptions): void {
  program
    .command("workflow", { hidden: true })
    .argument("[operands...]")
    .option("--inspect", "Inspect active workflow state")
    .option("--preflight", "Inspect bounded workflow routing metadata")
    .option("--save", "Persist workflow state from stdin")
    .option("--snapshot", "Snapshot one required check")
    .option("--finish", "Finish the active workflow task")
    .option("--cancel", "Cancel the active workflow task")
    .option("--learn", "Record one eligible project-local learning candidate")
    .option("--transition <status/checkpoint>", "Move the active task to one legal status/checkpoint")
    .option("--evidence", "Append exactly one evidence item from stdin or from flags")
    .option("--criterion <ids>", "Comma-separated criterion IDs to mark met (requires --met)")
    .option("--met", "Mark the --criterion IDs met from fresh passing evidence")
    .option("--evidence-ids <ids>", "Explicit passing evidence IDs for --criterion")
    .option("--migrate", "Migrate the active legacy task to schema v3")
    .option("--run-check <id>", "Run the command after -- against a check and record the outcome")
    .option("--schema", "Describe the save envelope schema")
    .option("--check <id>", "Check ID for --snapshot or --evidence")
    .option("--result <result>", "Evidence result: pass, fail, or skipped")
    .option("--exit-code <n>", "Evidence exit code")
    .option("--summary <text>", "Evidence summary")
    .option("--artifact <path>", "Evidence artifact path (repeatable)", collectArtifact, [])
    .option("--digest <hex>", "Input digest captured before the check ran")
    .option("--brief", "Print only id, status, checkpoint and updatedAt")
    .action(async (operands: string[], flags: WorkflowFlags) => {
      const action = selectAction(flags);
      assertCommandShape(action, flags, operands);
      assertFlagGroups(action, flags);
      const root = await resolveProjectRoot(process.cwd());
      const result = await (HANDLERS[action] as Handler)({ root, flags, operands, options });
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
}
