import { initTaskWorkflow, setBaselineWorkflow, setEpicOrderWorkflow } from "src/commands/internal-workflow.js";
import { presentTask, splitGlobList, splitList } from "src/commands/workflow-handler-utils.js";
import type { Handler } from "src/commands/workflow-handlers.js";
import type { TaskMode } from "src/core/tasks/task.js";

/** Handlers that create a task, record a baseline or order an epic; split out to keep each handler file small. */
export const LIFECYCLE_HANDLERS: Record<string, Handler> = {
  init: async (context) => {
    const task = await initTaskWorkflow(context.root, {
      title: context.flags.title as string,
      slug: context.flags.slug,
      mode: context.flags.mode as TaskMode,
      goal: context.flags.goal,
      criterion: context.flags.text,
      command: context.flags.command,
      input: context.flags.input?.flatMap(splitGlobList),
      followUp: context.flags.followUp,
      epic: context.flags.epic,
    });
    if (context.flags.followUp !== undefined && task.epicId === undefined)
      process.stderr.write(
        `notice: follow-up of ${task.followUpOf ?? context.flags.followUp} has no epic, so ${task.id} belongs to none; pass --epic <epic-id> to attach it.\n`,
      );
    return presentTask(context, task);
  },
  epicOrder: async ({ root, flags }) => {
    const [epicId, ...taskIds] = [flags.epicOrder].flat().flatMap((item) => splitList(item as string));
    return setEpicOrderWorkflow(root, epicId as string, taskIds);
  },
  setBaseline: async (context) => {
    const { flags, root } = context;
    const task = await setBaselineWorkflow(root, {
      checkId: flags.setBaseline as string,
      result: flags.result as string,
      classification: flags.classification as string,
      authorizedBy: flags.authorizedBy as string,
      scope: flags.scope as string,
    });
    return presentTask(context, task);
  },
};
