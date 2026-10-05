import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { cancellableStatuses, legalCheckpoints, transitions } from "src/core/tasks/task-schema.js";

const root = resolve(".");
const STATUSES = ["planning", "ready", "in_progress", "verifying", "blocked", "completed", "cancelled"];

async function stateMachineSection(): Promise<string> {
  const text = await readFile(join(root, "docs", "HARNIX_WORKFLOW.md"), "utf8");
  const start = text.indexOf("## 4. Canonical state machine");
  const end = text.indexOf("\n## 5.", start);
  if (start < 0 || end < 0) throw new Error("The canonical state machine section is missing.");
  return text.slice(start, end);
}

function diagramEdges(section: string): string[] {
  const diagram = /```mermaid\r?\n([\s\S]*?)```/u.exec(section)?.[1] ?? "";
  return [...diagram.matchAll(/^\s*(\w+)\s*-->\s*(\w+)/gmu)]
    .map((match) => `${match[1]}->${match[2]}`)
    .filter((edge) => edge.split("->").every((node) => STATUSES.includes(node)))
    .sort();
}

describe("docs/HARNIX_WORKFLOW.md section 4", () => {
  it("draws exactly the status transitions the code allows, plus cancellation, and nothing else", async () => {
    const allowed = [
      ...Object.entries(transitions).flatMap(([from, targets]) => targets.map((to) => `${from}->${to}`)),
      ...[...cancellableStatuses].map((from) => `${from}->cancelled`),
    ].sort();

    expect(diagramEdges(await stateMachineSection())).toEqual(allowed);
  });

  it("does not draw checkpoints (replan, debugging, finishing) as if they were statuses", async () => {
    const section = await stateMachineSection();
    const diagram = /```mermaid\r?\n([\s\S]*?)```/u.exec(section)?.[1] ?? "";

    expect(diagram).not.toMatch(/\b(Replan|Debugging|Finishing|Implementing|Verifying|Planning|Ready)\b/u);
  });

  it("lists the legal checkpoints of every status and states how a task leaves replan", async () => {
    const section = await stateMachineSection();

    for (const [status, checkpoints] of Object.entries(legalCheckpoints)) {
      const row = new RegExp(`\\|\\s*\`${status}\`\\s*\\|([^\\n]*)`, "u").exec(section)?.[1] ?? "";
      for (const checkpoint of checkpoints) expect(row, `${status} lists ${checkpoint}`).toContain(`\`${checkpoint}\``);
    }
    expect(section).toMatch(/replan[^\n]*ready\/ready/u);
  });
});
