import type { Command } from "commander";

import {
  addCriterionWorkflow,
  addDecisionWorkflow,
  addRiskWorkflow,
  appendEvidenceFlagsWorkflow,
  appendEvidenceWorkflow,
  briefTask,
  cancelWorkflow,
  finishWorkflowReport,
  inspectWorkflow,
  markCriteriaMetWorkflow,
  migrateToV3Workflow,
  preflightWorkflow,
  recordLearningWorkflow,
  runCheckWorkflow,
  saveWorkflow,
  setCheckWorkflow,
  setPathsWorkflow,
  snapshotWorkflow,
  transitionWorkflow,
  workflowEnvelopeSchema,
} from "src/commands/internal-workflow.js";
import {
  assertCommandShape,
  assertFlagGroups,
  isEvidenceFlagsMode,
  selectAction,
  type WorkflowFlags,
} from "src/commands/workflow-flags.js";
import type { CheckRunner } from "src/utils/check-runner.js";
import { readBoundedInput } from "src/utils/bounded-input.js";
import { resolveProjectRoot } from "src/utils/paths.js";

export interface WorkflowCommandOptions {
  workflowInput?: (() => Promise<string>) | undefined;
  checkRunner?: CheckRunner | undefined;
}

interface WorkflowContext {
  root: string;
  flags: WorkflowFlags;
  operands: string[];
  options: WorkflowCommandOptions;
}

const OPTIONAL_STDIN_IDLE_MS = 2_000;
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

/** Windows PowerShell 5.1 prefixes piped text with a BOM even for UTF-8 without BOM, which is not valid JSON. */
const withoutBom = (input: string | undefined): string | undefined =>
  input?.startsWith(BYTE_ORDER_MARK) ? input.slice(1) : input;

async function readInput(context: WorkflowContext, optional = false): Promise<string | undefined> {
  if (context.options.workflowInput) return withoutBom(await context.options.workflowInput());
  if (!optional) return withoutBom(await readBoundedInput(process.stdin));
  if (process.stdin.isTTY === true) return "";
  // An agent shell often leaves stdin as an open pipe that never closes, so an optional body must not wait for EOF.
  return withoutBom(await readBoundedInput(process.stdin, undefined, OPTIONAL_STDIN_IDLE_MS));
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
    .split(/[\s,]+/u)
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
  setCheck: async (context) => {
    const { flags, root } = context;
    const task = await setCheckWorkflow(
      root,
      {
        id: flags.setCheck as string,
        description: flags.description,
        command: flags.command,
        scope: flags.scope,
        required: flags.required,
        criteria: flags.criteria === undefined ? undefined : splitList(flags.criteria),
        inputs: (flags.input?.length ?? 0) > 0 ? flags.input : undefined,
      },
      { reason: flags.reason },
    );
    return presentTask(context, task);
  },
  addCriterion: async (context) => {
    const { flags, root } = context;
    const task = await addCriterionWorkflow(
      root,
      {
        id: flags.addCriterion as string,
        text: flags.text as string,
        checks: flags.check === undefined ? [] : splitList(flags.check),
      },
      { reason: flags.reason },
    );
    return presentTask(context, task);
  },
  addDecision: async (context) => {
    const { flags, root } = context;
    const task = await addDecisionWorkflow(root, {
      id: flags.addDecision as string,
      text: flags.text as string,
      rationale: flags.rationale as string,
    });
    return presentTask(context, task);
  },
  addRisk: async (context) => {
    const { flags, root } = context;
    const task = await addRiskWorkflow(root, {
      id: flags.addRisk as string,
      text: flags.text as string,
      severity: flags.severity,
    });
    return presentTask(context, task);
  },
  setPaths: async (context) => {
    const { flags, root } = context;
    const task = await setPathsWorkflow(root, {
      paths: (flags.relevantPath?.length ?? 0) > 0 ? flags.relevantPath : undefined,
      specs: (flags.relevantSpec?.length ?? 0) > 0 ? flags.relevantSpec : undefined,
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
  finish: async (context) => {
    const report = await finishWorkflowReport(context.root);
    return context.flags.brief === true ? { ...briefTask(report.task), learning: report.learning } : report.task;
  },
};

const collect = (value: string, previous: string[]): string[] => [...previous, value];

export function registerWorkflowCommand(program: Command, options: WorkflowCommandOptions): void {
  // The pnpm PowerShell shim forwards `$args` and drops the `--` separator, so everything after the first operand
  // (the command of `--run-check`) is passed through untouched instead of being parsed as harnix options.
  program.enablePositionalOptions();
  program
    .command("workflow", { hidden: true })
    .passThroughOptions()
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
    .option("--set-check <id>", "Add or update one validation check of the active task")
    .option("--add-criterion <id>", "Add one acceptance criterion (requires --text)")
    .option("--add-decision <id>", "Record one decision (requires --text and --rationale)")
    .option("--add-risk <id>", "Record one residual risk (requires --text)")
    .option("--set-paths", "Replace the relevant paths and/or specs of the active task")
    .option("--schema", "Describe the save envelope schema")
    .option(
      "--check <id>",
      "Check ID for --snapshot or --evidence; check IDs covering the criterion for --add-criterion",
    )
    .option("--result <result>", "Evidence result: pass, fail, or skipped")
    .option("--exit-code <n>", "Evidence exit code")
    .option("--summary <text>", "Evidence summary")
    .option("--artifact <path>", "Evidence artifact path (repeatable)", collect, [])
    .option("--digest <hex>", "Input digest captured before the check ran")
    .option("--description <text>", "Check description for --set-check")
    .option("--command <text>", "Check command for --set-check")
    .option("--scope <scope>", "Check scope for --set-check: focused or full")
    .option("--required", "Mark the --set-check check required")
    .option("--no-required", "Mark the --set-check check not required")
    .option("--criteria <ids>", "Comma-separated criterion IDs a --set-check check covers")
    .option("--input <glob>", "Repository input glob of a --set-check check (repeatable)", collect, [])
    .option("--reason <text>", "Why obligations change after planning (10-1000 characters)")
    .option("--text <text>", "Text for --add-criterion, --add-decision or --add-risk")
    .option("--rationale <text>", "Rationale for --add-decision")
    .option("--severity <level>", "Severity for --add-risk: low, medium or high")
    .option("--relevant-path <path>", "Relevant path for --set-paths (repeatable)", collect, [])
    .option("--relevant-spec <path>", "Relevant spec path for --set-paths (repeatable)", collect, [])
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
