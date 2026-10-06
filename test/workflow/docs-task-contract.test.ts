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
  it("describes the input digest as bound to the check's own contract, with the former formula still recognised", async () => {
    const surfaces = {
      "workflow template": workflowTemplate,
      "AGENTS.md": await read("AGENTS.md"),
      "docs/HARNIX_PRD.md": await read("docs/HARNIX_PRD.md"),
      "docs/HARNIX_WORKFLOW.md": await read("docs/HARNIX_WORKFLOW.md"),
      "docs/IMPLEMENTATION_PLAN.md": await read("docs/IMPLEMENTATION_PLAN.md"),
      "evidence reference": await read("src/skills/harnix-verify/references/evidence.md"),
    };

    for (const [name, text] of Object.entries(surfaces)) {
      expect(text, name).not.toMatch(/folded into every digest|luôn được gộp ngầm vào digest/u);
    }
    for (const name of ["workflow template", "evidence reference"] as const)
      expect(surfaces[name], name).toMatch(/former formula/u);
    for (const name of ["docs/HARNIX_PRD.md", "docs/HARNIX_WORKFLOW.md", "docs/IMPLEMENTATION_PLAN.md"] as const)
      expect(surfaces[name], name).toMatch(/công thức cũ/u);
    expect(surfaces["AGENTS.md"]).toMatch(/check's own definition/u);
    expect(surfaces["docs/IMPLEMENTATION_PLAN.md"]).toMatch(
      /\{digest:4, taskId, checkId, taskContractHash, entries\}/u,
    );
  });

  it("documents --init --epic and followUpOf, and says an epic is never attached retroactively", async () => {
    const surfaces = {
      "workflow template": workflowTemplate,
      "AGENTS.md": await read("AGENTS.md"),
      "docs/HARNIX_PRD.md": await read("docs/HARNIX_PRD.md"),
      "docs/HARNIX_WORKFLOW.md": await read("docs/HARNIX_WORKFLOW.md"),
      "docs/IMPLEMENTATION_PLAN.md": await read("docs/IMPLEMENTATION_PLAN.md"),
      "epic reference": await read("src/skills/harnix-plan/references/epic.md"),
    };

    for (const [name, text] of Object.entries(surfaces)) {
      expect(text, name).toMatch(/followUpOf/u);
      expect(text, name).toMatch(/--epic/u);
    }
    expect(surfaces["epic reference"]).toMatch(/retroactive/iu);
    const initSchema = workflowEnvelopeSchema().transports["--init"] ?? "";
    expect(initSchema).toMatch(/--epic <epic-id>/u);
    expect(initSchema).toMatch(/followUpOf/u);
  });

  it("documents the ready content gate and --reviewed in every surface that describes the ready gate", async () => {
    const surfaces = {
      "workflow template": workflowTemplate,
      "AGENTS.md": await read("AGENTS.md"),
      "docs/HARNIX_PRD.md": await read("docs/HARNIX_PRD.md"),
      "docs/HARNIX_WORKFLOW.md": await read("docs/HARNIX_WORKFLOW.md"),
      "docs/IMPLEMENTATION_PLAN.md": await read("docs/IMPLEMENTATION_PLAN.md"),
      "harnix-plan skill": await read("src/skills/harnix-plan/SKILL.md"),
      "ready-review reference": await read("src/skills/harnix-plan/references/ready-review.md"),
    };

    for (const [name, text] of Object.entries(surfaces)) expect(text, name).toMatch(/--reviewed/u);
    expect(workflowTemplate).toMatch(/placeholder/iu);
    expect(workflowTemplate).toMatch(/focused required check/u);
    expect(surfaces["ready-review reference"]).toMatch(/reviewChecklist/u);
  });

  it("teaches a Windows-safe way to read workflow JSON in the cookbook", () => {
    expect(workflowTemplate).toMatch(/Out-String/u);
    expect(workflowTemplate).toMatch(/ConvertFrom-Json/u);
    expect(workflowTemplate).toMatch(/nested `?pwsh/u);
  });

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

  it("keeps the format and lint gate wired: scripts, Prettier config, empty exemption lists, AGENTS mention", async () => {
    const scripts = (JSON.parse(await read("package.json")) as { scripts: Record<string, string> }).scripts;
    const prettierConfig = JSON.parse(await read(".prettierrc.json")) as { printWidth: number };
    const eslintConfig = await read("eslint.config.mjs");

    expect(scripts.format).toContain("prettier --write");
    expect(scripts["format:check"]).toContain("prettier --check");
    expect(scripts.lint?.startsWith("pnpm format:check")).toBe(true);
    expect(prettierConfig.printWidth).toBe(120);
    for (const list of ["OVERSIZED_SOURCE_FILES", "COMPLEX_SOURCE_FILES", "RELEASE_SCRIPT_EXEMPTIONS"])
      expect(eslintConfig).toMatch(new RegExp(`const ${list} = \\[\\];`, "u"));
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

describe("baseline and verifying-edit documentation parity", () => {
  it("documents --set-baseline, the focused proof, the delta decision and the verifying resume", async () => {
    const surfaces = {
      "workflow template": workflowTemplate,
      "docs/HARNIX_WORKFLOW.md": await read("docs/HARNIX_WORKFLOW.md"),
      "docs/IMPLEMENTATION_PLAN.md": await read("docs/IMPLEMENTATION_PLAN.md"),
      "harnix-verify skill": await read("src/skills/harnix-verify/SKILL.md"),
    };
    for (const [name, text] of Object.entries(surfaces)) {
      expect(text, name).toContain("--set-baseline");
      expect(text, name).toMatch(/pre-existing/u);
    }
    for (const name of ["docs/HARNIX_WORKFLOW.md", "docs/IMPLEMENTATION_PLAN.md"] as const) {
      expect(surfaces[name], name).toMatch(/so sánh delta/u);
      expect(surfaces[name], name).toContain("verifying/verifying");
    }
    expect(surfaces["workflow template"]).toMatch(/does not compare a test delta/u);
    expect(surfaces["workflow template"]).toContain("verifying/verifying");
  });
});

describe("ID language convention documentation parity", () => {
  it("states that IDs are English with --slug while titles and goals stay Vietnamese", async () => {
    const english = {
      "workflow template": workflowTemplate,
      "harnix-plan skill": await read("src/skills/harnix-plan/SKILL.md"),
      "harnix-plan epic reference": await read("src/skills/harnix-plan/references/epic.md"),
    };
    const vietnamese = {
      "AGENTS.md": await read("AGENTS.md"),
      "docs/HARNIX_WORKFLOW.md": await read("docs/HARNIX_WORKFLOW.md"),
      "docs/IMPLEMENTATION_PLAN.md": await read("docs/IMPLEMENTATION_PLAN.md"),
    };
    for (const [name, text] of Object.entries(english)) expect(text, name).toMatch(/English/u);
    for (const [name, text] of Object.entries(vietnamese)) expect(text, name).toMatch(/ID[^\n]{0,80}tiếng Anh/u);
    for (const [name, text] of Object.entries({ ...english, ...vietnamese })) expect(text, name).toContain("--slug");
  });

  it("records the slug rule in the workflow-field-feedback epic through its goal and non-goals", async () => {
    const epic = JSON.parse(await read(".harnix/epics/20261006-141317-workflow-field-feedback.json")) as {
      nonGoals?: string[];
    };

    expect(epic.nonGoals?.join("\n")).toMatch(/slug tiếng Việt/u);
  });
});

describe("release versioning policy documentation parity", () => {
  it("states the patch, X.Y.0-dev.N and minor rules with the bump owner and timing", async () => {
    const surfaces = {
      "workflow template": workflowTemplate,
      "harnix-implement skill": await read("src/skills/harnix-implement/SKILL.md"),
      "AGENTS.md": await read("AGENTS.md"),
    };
    for (const [name, text] of Object.entries(surfaces)) {
      expect(text, name).toContain("X.Y.0-dev.N");
      expect(text, name).toMatch(/minor/u);
      expect(text, name).toMatch(/major/u);
    }
  });

  it("records the version plan of the workflow-field-feedback epic", async () => {
    const epic = JSON.parse(await read(".harnix/epics/20261006-141317-workflow-field-feedback.json")) as {
      goal: string;
    };

    expect(epic.goal).toMatch(/2\.1\.2/u);
    expect(epic.goal).toMatch(/2\.2\.0-dev\.N/u);
    expect(epic.goal).toContain("20261006-165805-cli-version-skew-warning");
  });
});

describe("self-host sync documentation parity", () => {
  it("points release preparation at pnpm selfhost:sync and explains the update report", async () => {
    const surfaces = {
      "AGENTS.md": await read("AGENTS.md"),
      "harnix-implement skill": await read("src/skills/harnix-implement/SKILL.md"),
      "workflow template": workflowTemplate,
    };
    for (const [name, text] of Object.entries(surfaces)) expect(text, name).toContain("pnpm selfhost:sync");
    expect(surfaces["AGENTS.md"]).toMatch(/preserved[^\n]{0,200}unchanged|unchanged[^\n]{0,200}preserved/u);
  });
});

describe("fast contract gates documentation parity", () => {
  it("suggests test:gates as a focused check and documents test:failures", async () => {
    for (const [name, text] of Object.entries({
      "workflow template": workflowTemplate,
      "harnix-plan skill": await read("src/skills/harnix-plan/SKILL.md"),
    }))
      expect(text, name).toContain("pnpm run test:gates");
    const agents = await read("AGENTS.md");
    expect(agents).toContain("test:gates");
    expect(agents).toContain("test:failures");
  });
});

describe("batch cookbook documentation parity", () => {
  it("states that --batch items resolve cross references regardless of order", () => {
    expect(workflowTemplate).toMatch(/--batch[^\n]*order does not matter/u);
  });
});

describe("--task targeting documentation parity", () => {
  it("documents --task for member edits instead of the pause and resume dance", async () => {
    const epic = await read("src/skills/harnix-plan/references/epic.md");
    expect(epic).toContain("--task <task-id>");
    expect(epic).not.toMatch(/run `harnix pause`, then `harnix resume/u);
    for (const [name, text] of Object.entries({
      "workflow template": workflowTemplate,
      "docs/HARNIX_WORKFLOW.md": await read("docs/HARNIX_WORKFLOW.md"),
      "docs/IMPLEMENTATION_PLAN.md": await read("docs/IMPLEMENTATION_PLAN.md"),
    }))
      expect(text, name).toContain("--task");
  });
});

describe("epic order documentation parity", () => {
  it("documents the order field, --epic-order and the next task rule", async () => {
    for (const [name, text] of Object.entries({
      "workflow template": workflowTemplate,
      "harnix-plan epic reference": await read("src/skills/harnix-plan/references/epic.md"),
      "docs/HARNIX_WORKFLOW.md": await read("docs/HARNIX_WORKFLOW.md"),
      "docs/IMPLEMENTATION_PLAN.md": await read("docs/IMPLEMENTATION_PLAN.md"),
      "docs/HARNIX_PRD.md": await read("docs/HARNIX_PRD.md"),
    }))
      expect(text, name).toContain("--epic-order");
  });
});

describe("version skew and release documentation parity", () => {
  it("tells agents what to do when the harnix on PATH is older than the project", async () => {
    for (const [name, text] of Object.entries({
      "workflow template": workflowTemplate,
      "AGENTS.md": await read("AGENTS.md"),
      "docs/HARNIX_WORKFLOW.md": await read("docs/HARNIX_WORKFLOW.md"),
    }))
      expect(text, name).toMatch(/versionSkew|cli-version-skew/u);
  });

  it("folds the dev entries of a stable release into one changelog entry", async () => {
    const version = (JSON.parse(await read("package.json")) as { version: string }).version;
    if (version.includes("-")) return; // a pre-release keeps its own dev entries until the epic closes
    const [major, minor] = version.split(".");
    const changelog = await read("CHANGELOG.md");

    const heading = (text: string) => new RegExp(`^## \\[${text}`, "gmu");
    expect(changelog.match(heading(`${version.replaceAll(".", "\\.")}\\]`))).toHaveLength(1);
    expect(changelog).not.toMatch(heading(`${major}\\.${minor}\\.0-dev\\.`));
  });
});
