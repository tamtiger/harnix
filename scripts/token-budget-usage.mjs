import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** The ceilings of every instruction surface; the one file `src/templates/harnix/token-budgets.ts` also reads. */
export async function loadTokenBudgets() {
  const path = fileURLToPath(new URL("../src/templates/harnix/token-budgets.json", import.meta.url));
  return JSON.parse(await readFile(path, "utf8"));
}

/**
 * Tokens of each SKILL.md and reference file under `src/skills`, and of the workflow.md template. It reads the raw
 * file text (frontmatter included) while `instruction-budget.test.ts` measures the rendered skill, so a figure here
 * is an approximation that may differ slightly from what the gate enforces.
 */
export async function measureInstructionFiles(root, estimateTokens) {
  const skillsDirectory = join(root, "src", "skills");
  const skills = {};
  const references = {};
  for (const entry of await readdir(skillsDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillFile = join(skillsDirectory, entry.name, "SKILL.md");
    if (!existsSync(skillFile)) continue;
    skills[entry.name] = estimateTokens(await readFile(skillFile, "utf8"));
    const referenceDirectory = join(skillsDirectory, entry.name, "references");
    if (!existsSync(referenceDirectory)) continue;
    for (const file of await readdir(referenceDirectory))
      if (file.endsWith(".md"))
        references[`${entry.name}/${file.slice(0, -3)}`] = estimateTokens(
          await readFile(join(referenceDirectory, file), "utf8"),
        );
  }
  const workflow = estimateTokens(await readFile(join(root, "src", "templates", "harnix", "workflow.md"), "utf8"));
  return { workflow, skills, references };
}

/**
 * The share of each ceiling that is used, so the file closest to its ceiling is visible: workflow.md, every skill and
 * the ten references nearest their ceiling; `referencesOverCeiling` names those above it (the exempt ones included).
 */
export function budgetUsage(budgets, sizes) {
  const entry = (tokens, budget) => ({ tokens, budget, percent: Math.round((tokens / budget) * 100) });
  const skills = Object.fromEntries(
    Object.entries(sizes.skills).map(([name, tokens]) => [name, entry(tokens, budgets.skills[name] ?? budgets.skill)]),
  );
  const references = Object.entries(sizes.references)
    .map(([id, tokens]) => ({
      id,
      ...entry(tokens, budgets.reference),
      exempt: budgets.referenceExemptions.includes(id),
    }))
    .sort((left, right) => right.percent - left.percent || (left.id < right.id ? -1 : 1));
  return {
    workflow: entry(sizes.workflow, budgets.workflow),
    skills,
    references: references.slice(0, 10),
    referencesOverCeiling: references.filter((item) => item.percent > 100).map((item) => item.id),
  };
}
