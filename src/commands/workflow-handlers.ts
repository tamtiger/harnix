import type { TaskRecord } from "src/core/tasks/task.js";
import {
  addCriterionWorkflow,
  addDecisionWorkflow,
  addRiskWorkflow,
  appendEvidenceFlagsWorkflow,
  appendEvidenceWorkflow,
  batchWorkflow,
  briefPreflight,
  briefTask,
  cancelWorkflow,
  finishWorkflowReport,
  inspectWorkflow,
  markCriteriaMetWorkflow,
  migrateToV3Workflow,
  preflightWorkflow,
  recordLearningWorkflow,
  replaceCheckWorkflow,
  runCheckWorkflow,
  saveWorkflow,
  setCheckWorkflow,
  setPathsWorkflow,
  snapshotWorkflow,
  transitionWorkflow,
  workflowEnvelopeSchema,
} from "src/commands/internal-workflow.js";
import { presentTask, splitList } from "src/commands/workflow-handler-utils.js";
import { LIFECYCLE_HANDLERS } from "src/commands/workflow-lifecycle-handlers.js";
import { packageVersion } from "src/version.js";
import { isEvidenceFlagsMode, type WorkflowFlags } from "src/commands/workflow-flags.js";
import type { CheckRunner } from "src/utils/check-runner.js";
import { readBoundedInput } from "src/utils/bounded-input.js";

export interface WorkflowCommandOptions {
  workflowInput?: (() => Promise<string>) | undefined;
  checkRunner?: CheckRunner | undefined;
}

export interface WorkflowContext {
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

export type Handler = (context: WorkflowContext) => Promise<unknown>;

export const WORKFLOW_HANDLERS: Record<string, Handler> = {
  ...LIFECYCLE_HANDLERS,
  inspect: ({ root }) => inspectWorkflow(root),
  preflight: async ({ root, flags }) => {
    const result = await preflightWorkflow(root, undefined, packageVersion);
    return flags.brief === true ? briefPreflight(result) : result;
  },
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
    const result = await transitionWorkflow(
      context.root,
      status,
      checkpoint,
      undefined,
      context.flags.dryRun === true,
      {
        reviewed: context.flags.reviewed === true,
      },
    );
    if (context.flags.dryRun === true) return result;
    return presentTask(context, result as TaskRecord);
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
        cwd: flags.cwd,
        scope: flags.scope,
        required: flags.required,
        criteria: flags.criteria === undefined ? undefined : splitList(flags.criteria),
        inputs: flags.input && flags.input.length > 0 ? flags.input.flatMap((item) => splitList(item)) : undefined,
      },
      { reason: flags.reason },
    );
    return presentTask(context, task);
  },
  replaceCheck: async (context) => {
    const { flags, root } = context;
    const raw = Array.isArray(flags.replaceCheck) ? flags.replaceCheck.join(" ") : String(flags.replaceCheck);
    const ids = splitList(raw);
    if (ids.length !== 2) {
      throw new Error("workflow --replace-check requires exactly two check IDs: <old-check-id> <new-check-id>.");
    }
    const [oldId, newId] = ids as [string, string];
    const task = await replaceCheckWorkflow(
      root,
      {
        oldId,
        newId,
        description: flags.description,
        command: flags.command,
        cwd: flags.cwd,
        scope: flags.scope,
        criteria: flags.criteria === undefined ? undefined : splitList(flags.criteria),
        inputs: flags.input && flags.input.length > 0 ? flags.input.flatMap((item) => splitList(item)) : undefined,
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
  batch: async (context) => {
    const envelope = await readRequired(context, "Workflow batch", "Workflow batch requires valid JSON.");
    const task = await batchWorkflow(context.root, envelope);
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
      cwd: flags.cwd,
    });
    return {
      ...briefTask(run.task, run.evidenceId),
      result: run.result,
      exitCode: run.exitCode,
      ...(flags.brief === true ? {} : { outputTail: run.outputTail }),
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
    return context.flags.brief === true
      ? {
          ...briefTask(report.task),
          learning: report.learning,
          ...(report.baselineAuthorized.length > 0 ? { baselineAuthorized: report.baselineAuthorized } : {}),
        }
      : report.task;
  },
};
