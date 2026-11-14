import { spawnSync } from "node:child_process";
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

/** The ceiling of one skill: its own, the technique one for a technique skill, or the common one. */
function skillCeiling(budgets, name, kinds) {
  if (budgets.skills[name] !== undefined) return budgets.skills[name];
  return kinds[name] === "technique" && budgets.techniqueSkill !== undefined ? budgets.techniqueSkill : budgets.skill;
}

/**
 * The tokens of every skill description, which a host lists in each session whatever the task: the cost the file
 * measurements above never show. `skills` is the `skills` array of `harnix skill`.
 */
export function listingUsage(budgets, skills, characters = 4) {
  const tokens = Math.ceil(skills.reduce((sum, skill) => sum + skill.description.length, 0) / characters);
  return { tokens, budget: budgets.skillListing, percent: Math.round((tokens / budgets.skillListing) * 100) };
}

/**
 * The share of each ceiling that is used, so the file closest to its ceiling is visible: workflow.md, every skill and
 * the ten references nearest their ceiling; `referencesOverCeiling` names those above it (the exempt ones included).
 */
export function budgetUsage(budgets, sizes, kinds = {}) {
  const entry = (tokens, budget) => ({ tokens, budget, percent: Math.round((tokens / budget) * 100) });
  const skills = Object.fromEntries(
    Object.entries(sizes.skills).map(([name, tokens]) => [name, entry(tokens, skillCeiling(budgets, name, kinds))]),
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

/** The skills `harnix skill --all` lists (workflow, technique and project), read through the built CLI. */
export function readSkillCatalog(cli) {
  const listed = spawnSync(process.execPath, [cli, "skill", "--all"], { encoding: "utf8" });
  if (listed.status !== 0) throw new Error("harnix skill --all failed; cannot measure the skill listing.");
  return JSON.parse(listed.stdout).skills;
}

/** File usage with each skill's own kind, plus the listing of the skills a platform installs (never project skills). */
export function fullBudgetUsage(budgets, sizes, skills, characters) {
  const kinds = Object.fromEntries(skills.map((skill) => [skill.name, skill.kind]));
  return {
    ...budgetUsage(budgets, sizes, kinds),
    skillListing: listingUsage(
      budgets,
      skills.filter((skill) => skill.kind !== "project"),
      characters,
    ),
  };
}

/** Every ceiling's usage: the files, each skill against its own kind's ceiling, and the skill listing. */
export async function measureBudgetUsage(root, cli, estimateTokens, characters) {
  const budgets = await loadTokenBudgets();
  const sizes = await measureInstructionFiles(root, estimateTokens);
  return fullBudgetUsage(budgets, sizes, readSkillCatalog(cli), characters);
}
