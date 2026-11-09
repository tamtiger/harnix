import { describe, expect, it } from "vitest";

import { claudeGlobalMemoryContent } from "src/configurators/claude.js";
import { codexGlobalAgentsContent } from "src/configurators/codex.js";
import { HARNIX_GLOBAL_ACTIVATION_DOCUMENT } from "src/templates/harnix/global-surface.js";
import { renderAgentsTemplate } from "src/templates/harnix/agents.js";
import { TOKEN_BUDGETS, approximateTokens, skillBudget } from "src/templates/harnix/token-budgets.js";
import { canonicalSkills, renderSkill } from "src/skills/catalog.js";
import { workflowTemplate } from "src/templates/harnix/workflow.js";

// Every ceiling comes from src/templates/harnix/token-budgets.json; none is written in this file.
const tokens = approximateTokens;
const ALWAYS_LOADED_BUDGET = TOKEN_BUDGETS.alwaysLoaded;
const DIRECT_PATH_BUDGET = TOKEN_BUDGETS.directPath;
const FULL_PATH_BUDGET = TOKEN_BUDGETS.fullPath;

function skill(name: string): string {
  const found = canonicalSkills.find((candidate) => candidate.name === name);
  if (found === undefined) throw new Error(`skill ${name} is missing`);
  return renderSkill(found);
}

const agentsBootstrap = renderAgentsTemplate({ languages: ["typescript"], technologies: [], packages: [] });
const surfaces: [string, string][] = [
  ["kiro/antigravity steering", HARNIX_GLOBAL_ACTIVATION_DOCUMENT],
  ["claude memory block", claudeGlobalMemoryContent],
  ["codex agents block", codexGlobalAgentsContent],
  ["project AGENTS.md bootstrap", agentsBootstrap],
];
const alwaysLoaded = Math.max(...surfaces.map(([, text]) => tokens(text)));

describe("instruction token budgets", () => {
  it.each(surfaces)("keeps the always-loaded %s within its budget", (_name, text) => {
    expect(tokens(text)).toBeLessThanOrEqual(ALWAYS_LOADED_BUDGET);
  });

  it.each(canonicalSkills.map((item) => item.name))("keeps %s within the per-skill budget", (name) => {
    expect(tokens(skill(name))).toBeLessThanOrEqual(skillBudget(name));
  });

  it("keeps workflow.md within its ceiling", () => {
    expect(tokens(workflowTemplate)).toBeLessThanOrEqual(TOKEN_BUDGETS.workflow);
  });

  const references = canonicalSkills.flatMap((item) =>
    Object.entries(item.references).map(([topic, text]) => ({ id: `${item.name}/${topic}`, tokens: tokens(text) })),
  );

  it.each(references.filter((item) => !TOKEN_BUDGETS.referenceExemptions.includes(item.id)))(
    "keeps the reference $id within the reference ceiling",
    ({ tokens: used }) => {
      expect(used).toBeLessThanOrEqual(TOKEN_BUDGETS.reference);
    },
  );

  it("lets the exemption list only shrink: each exempt reference exists and is still above the ceiling", () => {
    const known = new Map(references.map((item) => [item.id, item.tokens]));

    for (const id of TOKEN_BUDGETS.referenceExemptions) {
      expect(known.has(id), `${id} is not a reference`).toBe(true);
      expect(known.get(id) ?? 0, `${id} fits the ceiling, so drop it from referenceExemptions`).toBeGreaterThan(
        TOKEN_BUDGETS.reference,
      );
    }
  });

  it("keeps the direct path (always-loaded block plus harnix-implement) within budget", () => {
    expect(alwaysLoaded + tokens(skill("harnix-implement"))).toBeLessThanOrEqual(DIRECT_PATH_BUDGET);
  });

  it("keeps a Full task (always-loaded block, workflow.md and the plan, implement and verify skills) within budget", () => {
    const total =
      alwaysLoaded +
      tokens(workflowTemplate) +
      ["harnix-plan", "harnix-implement", "harnix-verify"].reduce((sum, name) => sum + tokens(skill(name)), 0);

    expect(total).toBeLessThanOrEqual(FULL_PATH_BUDGET);
  });
});
