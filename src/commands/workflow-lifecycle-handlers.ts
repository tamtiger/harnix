import { initTaskWorkflow, setBaselineWorkflow, setEpicOrderWorkflow } from "src/commands/internal-workflow.js";
import {
  parseJson,
  presentTask,
  readBoundedFile,
  splitGlobList,
  splitList,
} from "src/commands/workflow-handler-utils.js";
import type { Handler } from "src/commands/workflow-handlers.js";
import type { TaskMode } from "src/core/tasks/task.js";
import { parseCheckSpec } from "src/core/workflow/init-spec.js";
import { resolveTaskDirectory } from "src/core/tasks/task-location.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { relative, sep } from "node:path";

async function optionalFile(context: HandlerContext, file: string | undefined): Promise<string | undefined> {
  return file === undefined ? undefined : readBoundedFile(context.root, file);
}

async function loadInitFilePayload(root: string, file: string | undefined): Promise<Record<string, unknown>> {
  if (file === undefined) return {};
  return parseJson(await readBoundedFile(root, file), "The --file payload is not valid JSON.") as Record<
    string,
    unknown
  >;
}

/** A `--file` payload field that must be an array of strings; anything else is refused with the expected shape. */
function stringList(value: unknown, field: string, example: string): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value;
  throw new Error(
    `The --file payload field "${field}" must be an array of strings.\nGợi ý: ví dụ { "${field}": [${example}] }.`,
  );
}

function resolveCriteria(filePayload: Record<string, unknown>, flags: HandlerContext["flags"]): string[] | undefined {
  if (filePayload.criteria !== undefined) return stringList(filePayload.criteria, "criteria", '"<tiêu chí>"');
  if (flags.text !== undefined) return [flags.text].flat();
  return undefined;
}

function resolveChecks(filePayload: Record<string, unknown>, flags: HandlerContext["flags"]) {
  if (filePayload.checks !== undefined)
    return stringList(filePayload.checks, "checks", '"id=chk-1;command=pnpm test;criteria=ac-1;input=src/**"').map(
      parseCheckSpec,
    );
  return flags.withCheck?.map(parseCheckSpec);
}

function resolveInput(filePayload: Record<string, unknown>, flags: HandlerContext["flags"]) {
  if (filePayload.input !== undefined) {
    const rawList = Array.isArray(filePayload.input) ? filePayload.input : [filePayload.input];
    return rawList.flatMap(splitGlobList);
  }
  return flags.input?.flatMap(splitGlobList);
}

type HandlerContext = Parameters<Handler>[0];

/** Handlers that create a task, record a baseline or order an epic; split out to keep each handler file small. */
export const LIFECYCLE_HANDLERS: Record<string, Handler> = {
  init: async (context) => {
    const filePayload = await loadInitFilePayload(context.root, context.flags.file);
    const task = await initTaskWorkflow(context.root, {
      title: (filePayload.title ?? context.flags.title) as string,
      slug: (filePayload.slug ?? context.flags.slug) as string | undefined,
      mode: (filePayload.mode ?? context.flags.mode) as TaskMode,
      goal: (filePayload.goal ?? context.flags.goal) as string | undefined,
      criteria: resolveCriteria(filePayload, context.flags),
      checks: resolveChecks(filePayload, context.flags),
      command: (filePayload.command ?? context.flags.command) as string | undefined,
      input: resolveInput(filePayload, context.flags),
      followUp: (filePayload.followUp ?? context.flags.followUp) as string | undefined,
      epic: (filePayload.epic ?? context.flags.epic) as string | undefined,
      cwd: (filePayload.cwd ?? context.flags.cwd) as string | undefined,
      activate: context.flags.activate,
      lint: context.flags.withLint,
      prd: await optionalFile(context, context.flags.prdFile),
      plan: await optionalFile(context, context.flags.planFile),
    });
    if (context.flags.followUp !== undefined && task.epicId === undefined)
      process.stderr.write(
        `notice: follow-up of ${task.followUpOf ?? context.flags.followUp} has no epic, so ${task.id} belongs to none; pass --epic <epic-id> to attach it.\n`,
      );
    const taskDir = relative(
      context.root,
      await resolveTaskDirectory(await resolveSafeHarnixPath(context.root), task.id),
    );
    return { ...(presentTask(context, task) as object), taskDir: taskDir.split(sep).join("/") };
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
