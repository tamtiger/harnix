import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { workflowEnvelopeSchema } from "../../src/commands/internal-workflow.js";

const root = process.cwd();
// The legacy directory constant and its migration necessarily spell the old name.
const LEGACY_HOLDERS = [join("src", "core", "epics", "epic.ts"), join("src", "core", "epics", "migrate.ts")];
const LEGACY_WORDS = /legacy|migrat|renamed|removed|breaking/iu;

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : /\.(ts|md)$/u.test(entry.name) ? [join(directory, entry.name)] : []));
  return nested.flat();
}

async function scannedFiles(): Promise<string[]> {
  const skills = (await readdir(join(root, "src", "skills"), { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => join("src", "skills", entry.name, "SKILL.md"));
  const sources = (await sourceFiles(join(root, "src"))).map((file) => file.slice(root.length + 1)).filter((file) => file.endsWith(".ts"));
  return [...sources, ...skills, "AGENTS.md", "README.md", join("docs", "HARNIX_PRD.md"), join("docs", "HARNIX_WORKFLOW.md"), join("docs", "IMPLEMENTATION_PLAN.md")]
    .filter((file) => !LEGACY_HOLDERS.includes(file));
}

describe("epic naming", () => {
  it("mentions the retired roadmap name only in legacy, migration, rename or breaking-change notes", async () => {
    const offenders: string[] = [];
    for (const file of await scannedFiles()) {
      const lines = (await readFile(join(root, file), "utf8")).split(/\r?\n/u);
      lines.forEach((line, index) => {
        if (/roadmap/iu.test(line) && !LEGACY_WORDS.test(line)) offenders.push(`${file}:${index + 1}`);
      });
    }

    expect(offenders).toEqual([]);
  });

  it("no longer references the roadmapMembers envelope field anywhere in current contract text", async () => {
    const offenders: string[] = [];
    for (const file of await scannedFiles()) {
      const lines = (await readFile(join(root, file), "utf8")).split(/\r?\n/u);
      lines.forEach((line, index) => {
        if (line.includes("roadmapMembers") && !LEGACY_WORDS.test(line)) offenders.push(`${file}:${index + 1}`);
      });
    }

    expect(offenders).toEqual([]);
  });

  it("describes epicMembers, not roadmapMembers, in the hidden save envelope schema", () => {
    const { envelope } = workflowEnvelopeSchema();

    expect(Object.keys(envelope)).toContain("epicMembers");
    expect(Object.keys(envelope)).not.toContain("roadmapMembers");
  });
});
