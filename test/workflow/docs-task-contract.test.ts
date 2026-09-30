import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { workflowEnvelopeSchema } from "src/commands/internal-workflow.js";
import { workflowTemplate } from "src/templates/harnix/workflow.js";
import { renderHarnixRules } from "src/templates/harnix/activation.js";

const root = resolve(".");
const v3Marker = /schema v3|schemaVersion:? 3|TaskRecordV3/iu;
// Retired v2 mechanisms may only be named on a line that also says they are legacy, retired or removed.
const retiredMechanisms = /--audit-ready|verification-inputs\.json|execution-notes/u;
const legacyMarker = /legacy|retired|removed/iu;

async function read(path: string): Promise<string> {
  return readFile(join(root, path), "utf8");
}

async function skillSources(): Promise<Array<{ name: string; text: string }>> {
  const names = (await readdir(join(root, "src", "skills"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  return Promise.all(
    names.map(async (name) => ({
      name: `src/skills/${name}/SKILL.md`,
      text: await read(`src/skills/${name}/SKILL.md`),
    })),
  );
}

describe("task contract documentation parity", () => {
  it("describes the task record as schema v3 in the workflow doc, implementation plan, PRD, AGENTS.md and template", async () => {
    const documents = {
      "docs/HARNIX_WORKFLOW.md": await read("docs/HARNIX_WORKFLOW.md"),
      "docs/IMPLEMENTATION_PLAN.md": await read("docs/IMPLEMENTATION_PLAN.md"),
      "docs/HARNIX_PRD.md": await read("docs/HARNIX_PRD.md"),
      "AGENTS.md": await read("AGENTS.md"),
      "workflow template": workflowTemplate,
    };

    for (const [name, text] of Object.entries(documents)) expect(text, name).toMatch(v3Marker);
  });

  it("makes the skills that touch the task record speak schema v3", async () => {
    const skills = await skillSources();
    const touching = skills.filter(({ name }) => /harnix-(plan|implement|verify)/u.test(name));

    expect(touching).toHaveLength(3);
    for (const { name, text } of touching) expect(text, name).toMatch(v3Marker);
  });

  it("names retired v2 mechanisms only as legacy, retired or removed", async () => {
    const sources = [
      { name: "AGENTS.md", text: await read("AGENTS.md") },
      { name: "README.md", text: await read("README.md") },
      { name: "workflow template", text: workflowTemplate },
      ...(await skillSources()),
    ];

    for (const { name, text } of sources) {
      for (const [index, line] of text.split("\n").entries()) {
        if (retiredMechanisms.test(line)) expect(line, `${name}:${index + 1}`).toMatch(legacyMarker);
      }
    }
  });

  it("points agents at the preflight clock block for timestamps and IDs", async () => {
    const documents = [
      { name: "AGENTS.md", text: await read("AGENTS.md") },
      { name: "workflow template", text: workflowTemplate },
      { name: "always-loaded rules", text: renderHarnixRules() },
      { name: "src/skills/harnix-plan/SKILL.md", text: await read("src/skills/harnix-plan/SKILL.md") },
    ];

    for (const { name, text } of documents) {
      expect(text, name).toMatch(/`clock`|clock\.now/u);
      expect(text, name).toMatch(/preflight/iu);
    }
  });

  it("never instructs a shell date command for timestamps", async () => {
    const sources = [
      { name: "AGENTS.md", text: await read("AGENTS.md") },
      { name: "workflow template", text: workflowTemplate },
      ...(await skillSources()),
    ];
    const shellDate = /date -u|run `date`|`date`|\$\(date/u;
    const allowed = /\bnot\b|never|instead|legacy/iu;

    for (const { name, text } of sources) {
      for (const [index, line] of text.split("\n").entries()) {
        if (shellDate.test(line)) expect(line, `${name}:${index + 1}`).toMatch(allowed);
      }
    }
  });

  it("documents contractRevision as a replan save in the hidden --schema output", () => {
    const schema = workflowEnvelopeSchema();

    expect(schema.envelope.contractRevision).toMatch(/replan/u);
    expect(schema.transports["--save"]).toBeDefined();
  });

  it("keeps the format and lint gate wired: scripts, Prettier config, exemption owners, AGENTS mention", async () => {
    const scripts = (JSON.parse(await read("package.json")) as { scripts: Record<string, string> }).scripts;
    const prettierConfig = JSON.parse(await read(".prettierrc.json")) as { printWidth: number };
    const eslintConfig = await read("eslint.config.mjs");

    expect(scripts.format).toContain("prettier --write");
    expect(scripts["format:check"]).toContain("prettier --check");
    expect(scripts.lint?.startsWith("pnpm format:check")).toBe(true);
    expect(prettierConfig.printWidth).toBe(120);
    for (const owner of ["restructure-code", "standardize-tests", "release-v2"]) expect(eslintConfig).toContain(owner);
    expect(await read("AGENTS.md")).toContain("format:check");
  });

  it("documents the restructured layout, its architecture test and decision D12", async () => {
    for (const file of ["AGENTS.md", "docs/IMPLEMENTATION_PLAN.md"]) {
      const text = await read(file);
      expect(text, file).toContain("src/core/workflow/");
      expect(text, file).toContain("architecture.test.ts");
    }
    expect(await read("docs/OVERHAUL_DECISIONS.md")).toContain("| D12 |");
  });

  it("documents the test layout, aliases, coverage floor and decision D13", async () => {
    const agents = await read("AGENTS.md");
    const testReadme = await read("test/README.md");
    const packageJson = JSON.parse(await read("package.json")) as { scripts: Record<string, string> };

    expect(agents).toContain("coverage");
    expect(agents).toContain("test/README.md");
    expect(testReadme).toContain("`src/...`");
    expect(testReadme).toContain("`test/...`");
    expect(testReadme).toContain("coverage");
    expect(await read("docs/OVERHAUL_DECISIONS.md")).toContain("| D13 |");
    expect(packageJson.scripts.test).toContain("--coverage");
    expect(await read("vitest.config.ts")).toContain("thresholds");
  });

  it("documents automatic learning capture, the preflight learning field and decision D14", async () => {
    for (const file of ["docs/HARNIX_WORKFLOW.md", "src/templates/harnix/workflow.md", "docs/IMPLEMENTATION_PLAN.md"]) {
      const text = await read(file);
      expect(text, file).toMatch(/learning/u);
      expect(text, file).toMatch(/preflight/iu);
    }
    for (const file of ["src/skills/harnix-verify/SKILL.md", "src/skills/harnix-plan/SKILL.md"]) {
      expect(await read(file), file).toContain("learning");
    }
    expect(await read("docs/HARNIX_WORKFLOW.md")).toContain("capture tự động");
    expect(await read("docs/HARNIX_PRD.md")).toContain("Capture tự động");
    expect(await read("src/templates/harnix/workflow.md")).toContain("into project learning");
    expect(await read("src/skills/harnix-plan/SKILL.md")).toContain("`learning`");
    const finishWork = await read("src/skills/harnix-verify/SKILL.md");
    expect(finishWork).toContain("captures learning");
    expect(finishWork).not.toMatch(/Send bounded JSON[^\n]*to `harnix workflow --learn`/u);
    expect(await read("docs/OVERHAUL_DECISIONS.md")).toContain("| D14 |");
  });
});
