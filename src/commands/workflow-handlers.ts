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
  resetBreakerWorkflow,
  runCheckWorkflow,
  runChecksWorkflow,
  saveWorkflow,
  setCheckWorkflow,
  setCriterionWorkflow,
  setGoalWorkflow,
  setPathsWorkflow,
  setTitleWorkflow,
  snapshotWorkflow,
  tickWorkflow,
  transitionWorkflow,
  workflowEnvelopeSchema,
} from "src/commands/internal-workflow.js";
import { parseJson, presentTask, readInput, readRequired, splitList } from "src/commands/workflow-handler-utils.js";
import { EDIT_HANDLERS } from "src/commands/workflow-edit-handlers.js";
import { LIFECYCLE_HANDLERS } from "src/commands/workflow-lifecycle-handlers.js";
import { packageVersion } from "src/version.js";
import { isEvidenceFlagsMode, type WorkflowFlags } from "src/commands/workflow-flags.js";
import type { CheckRunner } from "src/utils/check-runner.js";

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

export type Handler = (context: WorkflowContext) => Promise<unknown>;

export const WORKFLOW_HANDLERS: Record<string, Handler> = {
  ...LIFECYCLE_HANDLERS,
  ...EDIT_HANDLERS,
  inspect: ({ root }) => inspectWorkflow(root),
  preflight: async ({ root, flags }) => {
    const result = await preflightWorkflow(root, undefined, packageVersion, flags.expectedTask);
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
        reason: context.flags.reason,
        note: context.flags.note,
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
    return presentTask(context, task, flags.full === true ? undefined : task.evidence.at(-1)?.id);
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
  resetBreaker: async (context) => {
    const { flags, root } = context;
    const task = await resetBreakerWorkflow(root, flags.resetBreaker as string, {
      reason: flags.reason as string,
    });
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
  setCriterion: async (context) => {
    const { flags, root } = context;
    const task = await setCriterionWorkflow(
      root,
      { id: flags.setCriterion as string, text: flags.text as string },
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
      mitigation: flags.mitigation,
    });
    return presentTask(context, task);
  },
  setPaths: async (context) => {
    const { flags, root } = context;
    let paths = (flags.relevantPath?.length ?? 0) > 0 ? flags.relevantPath : undefined;
    let specs = (flags.relevantSpec?.length ?? 0) > 0 ? flags.relevantSpec : undefined;
    if (flags.file !== undefined) {
      const input = await readInput(context);
      const parsed = parseJson(input, "Workflow set-paths requires valid JSON.", true) as
        { paths?: string[]; specs?: string[] } | undefined;
      if (parsed?.paths !== undefined) paths = parsed.paths;
      if (parsed?.specs !== undefined) specs = parsed.specs;
    }
    const task = await setPathsWorkflow(root, {
      paths,
      specs,
    });
    return presentTask(context, task);
  },
  setTitle: async (context) => {
    const task = await setTitleWorkflow(context.root, context.flags.setTitle as string);
    return presentTask(context, task);
  },
  setGoal: async (context) => {
    const task = await setGoalWorkflow(context.root, context.flags.setGoal as string);
    return presentTask(context, task);
  },
  tick: (context) => tickWorkflow(context.root, context.flags.tick as string),
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
      ...(run.result === "fail" ? { outputTail: run.outputTail } : {}),
    };
  },
  runChecks: ({ root, options }) => {
    return runChecksWorkflow(root, { runner: options.checkRunner });
  },
  cancel: async (context) => {
    let envelope: unknown;
    if (context.flags.reason !== undefined) {
      envelope = {
        reason: context.flags.reason,
        authorizedBy: context.flags.authorizedBy ?? "user",
      };
    } else {
      const input = await readInput(context, true);
      envelope = parseJson(input, "Workflow cancellation requires valid bounded JSON.", true);
    }
    return cancelWorkflow(context.root, envelope);
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
    return context.flags.full === true
      ? report.task
      : {
          ...briefTask(report.task),
          learning: report.learning,
          ...(report.baselineAuthorized.length > 0 ? { baselineAuthorized: report.baselineAuthorized } : {}),
          ...(report.secretAdvisory === undefined ? {} : { secretAdvisory: report.secretAdvisory }),
        };
  },
};
