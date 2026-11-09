import { describe, expect, it } from "vitest";

import { canonicalSkills } from "src/skills/catalog.js";
import { workflowTemplate } from "src/templates/harnix/workflow.js";

const gates = canonicalSkills.find((skill) => skill.name === "harnix-verify")?.references["gates"] ?? "";
const flat = (text: string): string => text.replace(/\s+/gu, " ");

/** Each gate of the sheet, with the detail the reference `gates` must still carry for it. */
const GATES: [string, string[]][] = [
  ["Ready", ["reviewChecklist", "`--reviewed`", "placeholders", "plan.md", "contract tests"]],
  ["Contract immutability", ["--reason", "stale", "--replace-check", "`replan`", "--cwd", "--remove-check"]],
  ["Red baseline", ["--set-baseline", "--authorized-by user", "pre-existing"]],
  ["Execute", ["in_progress/implementing", "--fold-dev", "dev.N"]],
  ["Verify", ["verifying/verifying", "inputDigest"]],
  ["Finish", ["verifying/finishing", "--cancel --reason", "finish-cancel"]],
];

describe("the Gates of workflow.md and the gates reference", () => {
  it.each(GATES)("%s: the sheet names the gate and the reference keeps its detail", (name, needles) => {
    expect(workflowTemplate).toContain(`**${name}:**`);
    for (const needle of needles) expect(flat(gates), `${name}: ${needle}`).toContain(needle);
  });

  it("points the sheet's detail pages at the reference list", () => {
    expect(workflowTemplate).toContain("gates");
  });
});
