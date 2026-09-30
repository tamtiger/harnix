import { describe, expect, it } from "vitest";

import { claudeGlobalMemoryContent } from "src/configurators/claude.js";
import { codexGlobalAgentsContent } from "src/configurators/codex.js";
import { HARNIX_GLOBAL_ACTIVATION_DOCUMENT } from "src/templates/harnix/global-surface.js";
import { renderAgentsTemplate } from "src/templates/harnix/agents.js";
import { renderSkill, workflowSkills, workflowTemplate } from "src/templates/harnix/workflow.js";

/** Same approximation as `context.tokenApproximation` in `.harnix/config.yaml`. */
const CHARACTERS_PER_TOKEN = 4;
const tokens = (text: string): number => Math.ceil(text.length / CHARACTERS_PER_TOKEN);

const ALWAYS_LOADED_BUDGET = 1_500;
const SKILL_BUDGET = 2_000;
const DIRECT_PATH_BUDGET = 4_000;
const FULL_PATH_BUDGET = 15_000;

function skill(name: string): string {
  const found = workflowSkills.find((candidate) => candidate.name === name);
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

  it.each(workflowSkills.map((item) => item.name))("keeps %s within the per-skill budget", (name) => {
    expect(tokens(skill(name))).toBeLessThanOrEqual(SKILL_BUDGET);
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
