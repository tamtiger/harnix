import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { diagnoseProject } from "../../src/commands/doctor.js";
import { initializeProject } from "../../src/commands/init.js";
import { searchMemory } from "../../src/commands/mem.js";
import { setupPlatforms } from "../../src/commands/setup.js";
import { uninstallProject } from "../../src/commands/uninstall.js";
import { upgradeHarnix } from "../../src/commands/upgrade.js";
import { migrateLegacyProject } from "../../src/migration/migrate.js";

const directories: string[] = [];
async function fixture(): Promise<string> { const root = await mkdtemp(join(tmpdir(), "harnix-phase4-")); directories.push(root); return root; }
afterEach(async () => { await Promise.all(directories.splice(0).map((path) => rm(path, { force: true, recursive: true }))); });

describe("phase 4 lifecycle commands", () => {
  it("keeps upgrade offline until an explicit injected apply runner is used", async () => {
    let ran = false;
    await expect(upgradeHarnix({ installedVersion: "0.1.0", availableVersion: async () => "0.2.0", runner: async () => { ran = true; } })).resolves.toMatchObject({ available: "0.2.0", applied: false }); expect(ran).toBe(false);
    await upgradeHarnix({ installedVersion: "0.1.0", apply: true, runner: async (executable, args) => { ran = executable === "npm" && args[0] === "install"; } }); expect(ran).toBe(true);
  });
  it("searches unicode journal entries and skips malformed data", async () => {
    const root = await fixture(); await initializeProject({ developer: "tam", root, yes: true }); const journal = join(root, ".harnix", "workspace", "tam", "journal"); await mkdir(journal, { recursive: true });
    await writeFile(join(journal, "2026-08-07.jsonl"), "not json\n" + JSON.stringify({ generator: "harnix", schemaVersion: 1, id: "2", recordedAt: "2026-08-07T00:00:00Z", developer: "tam", kind: "learning", summary: "Unicode tiếng Việt", evidenceIds: [], learning: { id: "l", statement: "x", sourceTaskIds: [], evidenceIds: [], occurrences: 0, confidence: 0.4, status: "candidate" } }) + "\n");
    await expect(searchMemory({ root, query: "TIẾNG" })).resolves.toMatchObject({ malformed: 1, entries: [{ summary: "Unicode tiếng Việt" }] });
  });
  it("uninstalls only unchanged managed platform files and requires purge confirmation", async () => {
    const root = await fixture(); await initializeProject({ developer: "tam", root, yes: true }); await setupPlatforms({ root, platforms: ["kiro"] });
    const skill = join(root, ".kiro", "skills", "harnix-implement", "SKILL.md"); await writeFile(skill, "user skill\n"); const result = await uninstallProject({ root });
    expect(result.preserved).toContain(".kiro/skills/harnix-implement/SKILL.md"); await expect(readFile(skill, "utf8")).resolves.toBe("user skill\n"); await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("developer: tam");
    await expect(uninstallProject({ root, purge: true })).resolves.toMatchObject({ confirmationRequired: true, purgeTargets: [".harnix"] });
  });
  it("previews then stages migration without changing legacy sources", async () => {
    const root = await fixture(); await mkdir(join(root, ".trellis")); await writeFile(join(root, ".trellis", "keep"), "legacy");
    await expect(migrateLegacyProject({ root })).resolves.toMatchObject({ legacy: [".trellis"], activated: false });
    await expect(migrateLegacyProject({ root, apply: true })).resolves.toMatchObject({ activated: true, cleaned: [] }); await expect(readFile(join(root, ".trellis", "keep"), "utf8")).resolves.toBe("legacy");
  });
  it("reports deterministic doctor findings and fixes only safe untracked files", async () => {
    const root = await fixture(); await initializeProject({ developer: "tam", root, yes: true }); await rm(join(root, ".harnix", "spec"), { force: true, recursive: true });
    const report = await diagnoseProject({ root, fix: true }); expect(report.findings.map((item) => item.code)).toContain("managed-untracked"); await expect(readFile(join(root, ".harnix", "spec", "guides", "common-rules.md"), "utf8")).resolves.toContain("common engineering rules");
  });
});
