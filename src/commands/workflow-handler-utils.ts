import { briefTask } from "src/commands/internal-workflow.js";
import type { WorkflowContext } from "src/commands/workflow-handlers.js";
import { readBoundedInput } from "src/utils/bounded-input.js";
import { readFile } from "src/utils/fs-access.js";
import { resolveSafeFilePath } from "src/utils/paths.js";

const OPTIONAL_STDIN_IDLE_MS = 2_000;

/** Windows PowerShell 5.1 prefixes piped text with a BOM even for UTF-8 without BOM, which is not valid JSON. */
export const withoutBom = (input: string | undefined): string | undefined => {
  if (input === undefined) return undefined;
  return input.replace(/^\uFEFF/u, "").replace(/^\uFFFE/u, "");
};

/** The body of one command, read once: a retried handler gets the same text instead of an already drained stdin. */
const inputs = new WeakMap<object, Promise<string | undefined>>();

export function readInput(context: WorkflowContext, optional = false): Promise<string | undefined> {
  const cached = inputs.get(context.options);
  if (cached !== undefined) return cached;
  const read = readInputOnce(context, optional);
  inputs.set(context.options, read);
  return read;
}

async function readInputOnce(context: WorkflowContext, optional: boolean): Promise<string | undefined> {
  if (context.flags.file !== undefined) {
    const target = await resolveSafeFilePath(context.root, context.flags.file);
    return withoutBom(await readFile(target, "utf8"));
  }
  if (context.options.workflowInput) return withoutBom(await context.options.workflowInput());
  if (!optional) return withoutBom(await readBoundedInput(process.stdin));
  if (process.stdin.isTTY === true) return "";
  // An agent shell often leaves stdin as an open pipe that never closes, so an optional body must not wait for EOF.
  return withoutBom(await readBoundedInput(process.stdin, undefined, OPTIONAL_STDIN_IDLE_MS));
}

export function parseJson(input: string | undefined, message: string, optional = false): unknown {
  if (!input) {
    if (optional) return undefined;
    throw new Error(message);
  }
  try {
    return JSON.parse(input.trim()) as unknown;
  } catch {
    throw new Error(message);
  }
}

export async function readRequired(context: WorkflowContext, subject: string, invalid: string): Promise<unknown> {
  const input = await readInput(context);
  if (!input) throw new Error(`${subject} requires a bounded JSON envelope on stdin.`);
  return parseJson(input, invalid);
}

export /** Splits a glob list on commas outside braces, so `*.{ts,tsx}` and `My Dir/**` survive intact. */
const splitGlobList = (value: string): string[] => {
  const items: string[] = [];
  let depth = 0;
  let current = "";
  for (const character of value) {
    if (character === "{") depth += 1;
    if (character === "}") depth = Math.max(0, depth - 1);
    if (character === "," && depth === 0) {
      items.push(current);
      current = "";
    } else current += character;
  }
  items.push(current);
  return items.map((item) => item.trim()).filter((item) => item !== "");
};

export const splitList = (value: string): string[] =>
  value
    .split(/[\s,]+/u)
    .map((item) => item.trim())
    .filter((item) => item !== "");

export function presentTask(
  context: WorkflowContext,
  task: Parameters<typeof briefTask>[0],
  evidenceId?: string,
): unknown {
  return context.flags.full === true ? task : briefTask(task, evidenceId);
}
