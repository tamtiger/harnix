import { describe, expect, it } from "vitest";
import { TOKEN_BUDGETS, approximateTokens } from "src/templates/harnix/token-budgets.js";
import { workflowSkills, workflowTemplate } from "src/templates/harnix/workflow.js";

const tokens = approximateTokens;
const DETAIL_PAGES = [
  "workflow-routing",
  "task-state",
  "gates",
  "agent-transport",
  "cookbook-notes",
  "cookbook-commands",
];

describe("lean workflow cheat sheet", () => {
  it("stays within the workflow.md ceiling", () => {
    expect(tokens(workflowTemplate)).toBeLessThanOrEqual(TOKEN_BUDGETS.workflow);
  });

  it("keeps the four operational sections and one command block", () => {
    for (const heading of ["## Route", "## Task state", "## Gates", "## Agent transport", "## Command cookbook"])
      expect(workflowTemplate).toContain(heading);
    expect(workflowTemplate.match(/^```/gmu)).toHaveLength(2);
  });

  it("moves the long guidance into on-demand references of harnix-verify without losing it", () => {
    const verify = workflowSkills.find((skill) => skill.name === "harnix-verify");
    for (const page of DETAIL_PAGES) {
      expect(workflowTemplate, page).toContain(page);
      expect(verify?.references[page], page).toBeDefined();
    }
    // Each fact lives once: in the sheet itself or in one of its detail pages.
    const detail = [workflowTemplate, ...DETAIL_PAGES.map((page) => verify?.references[page] ?? "")].join("\n");
    for (const needle of [
      "harnix repo-map --query|--impact",
      "Obligations",
      "Red baseline",
      "`--save`: one bounded JSON envelope",
      "ConvertFrom-Json",
      "harnix workflow --reset-breaker",
      "harnix workflow --tick",
    ])
      expect(detail, needle).toContain(needle);
  });
});
