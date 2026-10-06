import { briefTask } from "src/commands/internal-workflow.js";
import type { WorkflowContext } from "src/commands/workflow-handlers.js";

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
  return context.flags.brief === true ? briefTask(task, evidenceId) : task;
}
