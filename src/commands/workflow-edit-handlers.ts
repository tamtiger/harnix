import { removeCriterionWorkflow, removeDecisionWorkflow } from "src/commands/internal-workflow.js";
import { presentTask } from "src/commands/workflow-handler-utils.js";
import type { Handler } from "src/commands/workflow-handlers.js";

/** Handlers that remove planning-time notes and criteria; split out to keep each handler file small. */
export const EDIT_HANDLERS: Record<string, Handler> = {
  removeDecision: async (context) =>
    presentTask(context, await removeDecisionWorkflow(context.root, context.flags.removeDecision as string)),
  removeCriterion: async (context) =>
    presentTask(context, await removeCriterionWorkflow(context.root, context.flags.removeCriterion as string)),
};
