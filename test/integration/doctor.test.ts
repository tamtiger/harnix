import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { diagnoseProject } from "../../src/commands/doctor.js";
import { initializeProject } from "../../src/commands/init.js";
import { setupPlatforms } from "../../src/commands/setup.js";
import { GlobalManagedTransactionError } from "../../src/utils/global-managed-files.js";
import { readManifest, writeManifest } from "../../src/utils/managed-files.js";
import { sha256 } from "../../src/utils/hashing.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";
import { useTemporaryUserHomes } from "../support/temporary-user-home.js";

const temporaryRepository = useTemporaryRepositories("harnix-doctor-");
const temporaryUserHome = useTemporaryUserHomes("harnix-doctor-home-");

function globalOptions(home: string) {
  return {
    commandLookup: async () => true,
    environment: { CODEX_HOME: join(home, "codex") },
    homeResolver: async () => home,
  };
}

describe("diagnoseProject Doctor v2", () => {
  it("reports config v1 as fixable and migrates it only with explicit fix", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    const configPath = join(root, ".harnix", "config.yaml");
    const v1 = [
      "generator: harnix", "schemaVersion: 1", "developer: tam", "languages: [typescript-nestjs]",
      "packages: [{ path: ., languages: [typescript-nestjs] }]", "platforms: []",
      "context: { maxCharacters: 24000, tokenApproximation: 4 }", "runtime: { research: conditional, fullContext: false }", "unknown: keep", "",
    ].join("\n");
    await writeFile(configPath, v1);

    const before = await diagnoseProject({ root, ...globalOptions(home) });
    expect(before.project.findings).toContainEqual(expect.objectContaining({ code: "config-outdated", fixable: true }));
    await expect(readFile(configPath, "utf8")).resolves.toBe(v1);

    const fixed = await diagnoseProject({ root, fix: true, ...globalOptions(home) });
    expect(fixed.project.findings).not.toContainEqual(expect.objectContaining({ code: "config-outdated" }));
    const migrated = await readFile(configPath, "utf8");
    expect(migrated).toContain("schemaVersion: 2"); expect(migrated).toContain("- typescript"); expect(migrated).toContain("- nestjs"); expect(migrated).toContain("unknown: keep");
  });

  it("reports package profile IDs absent from the project union", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    const configPath = join(root, ".harnix", "config.yaml");
    const config = await readFile(configPath, "utf8");
    await writeFile(configPath, config.replace("packages: []", "packages:\n  - path: .\n    languages: [go]\n    technologies: [vue]"));
    const report = await diagnoseProject({ root, ...globalOptions(home) });
    expect(report.project.findings).toContainEqual(expect.objectContaining({ code: "profile-conflict", severity: "warning" }));
  });

  it("should_report_project_not_initialized_but_still_inspect_global_integrations", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();

    const report = await diagnoseProject({ root, ...globalOptions(home) });

    expect(report).toMatchObject({ generator: "harnix", schemaVersion: 2, ok: true, project: { status: "not-initialized" } });
    expect(report.globalIntegrations.map((integration) => ({ platform: integration.platform, status: integration.status }))).toEqual([
      { platform: "kiro", status: "not-installed" },
      { platform: "antigravity", status: "not-installed" },
      { platform: "codex", status: "not-installed" },
    ]);
  });

  it("should_report_global_codex_as_pending_trust_without_exposing_the_user_home", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    await setupPlatforms({ ...globalOptions(home), platforms: ["codex"] });

    const report = await diagnoseProject({ root, ...globalOptions(home) });
    const codex = report.globalIntegrations.find((integration) => integration.platform === "codex");

    expect(report.project.status).toBe("ready");
    expect(report.ok).toBe(false);
    expect(codex).toMatchObject({ status: "installed-pending-trust" });
    expect(codex?.findings).toContainEqual(expect.objectContaining({ code: "codex-trust-pending", severity: "warning" }));
    expect(JSON.stringify(report)).not.toContain(home);
  });

  it("should_surface_only_explicit_global_capability_evidence_in_the_v2_report", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    await setupPlatforms({ ...globalOptions(home), platforms: ["kiro", "antigravity", "codex"] });

    const report = await diagnoseProject({
      ...globalOptions(home),
      capabilityLookup: async (platform) => ({
        kiro: "unsupported-version" as const,
        antigravity: "shadowed" as const,
        codex: "active" as const,
      })[platform],
      codexTrustLookup: async () => "trusted",
      root,
    });

    expect(report.globalIntegrations.map((integration) => ({ platform: integration.platform, status: integration.status }))).toEqual([
      { platform: "kiro", status: "unsupported-version" },
      { platform: "antigravity", status: "shadowed" },
      { platform: "codex", status: "active" },
    ]);
  });

  it("should_not_mutate_global_integrations_when_project_only_fix_is_requested", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    await setupPlatforms({ ...globalOptions(home), platforms: ["kiro"] });
    const globalManifest = join(home, ".kiro", "harnix", "managed.json");
    const before = await readFile(globalManifest, "utf8");
    await rm(join(root, ".harnix", "workflow.md"));

    const report = await diagnoseProject({ root, fix: true, ...globalOptions(home) });

    expect(report.project.findings).toContainEqual(expect.objectContaining({ code: "managed-missing", path: ".harnix/workflow.md" }));
    await expect(readFile(globalManifest, "utf8")).resolves.toBe(before);
    await expect(access(join(root, ".harnix", "workflow.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should_repair_only_safe_missing_global_entries_when_fix_global_is_explicit", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    await setupPlatforms({ ...globalOptions(home), platforms: ["kiro"] });
    const steering = join(home, ".kiro", "steering", "harnix.md");
    await rm(steering);

    const report = await diagnoseProject({ root, fix: true, global: true, ...globalOptions(home) });

    expect(report.summary.fixed).toBeGreaterThan(0);
    await expect(readFile(steering, "utf8")).resolves.toContain("Harnix activation guard");
  });

  it("should_report_preserved_concurrent_global_edits_when_global_fix_rolls_back_partially", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    await setupPlatforms({ ...globalOptions(home), platforms: ["kiro"] });
    const partialPath = "~/.kiro/steering/harnix.md";

    const report = await diagnoseProject({
      root,
      fix: true,
      global: true,
      ...globalOptions(home),
      globalUpdate: async () => {
        throw new GlobalManagedTransactionError(
          "Global managed reconciliation failed; attempted writes were rolled back conservatively.",
          { partial: [partialPath], restored: [] },
          new Error("concurrent editor"),
        );
      },
    });

    const kiro = report.globalIntegrations.find((integration) => integration.platform === "kiro");
    expect(kiro).toMatchObject({ status: "drifted" });
    expect(kiro?.findings).toContainEqual(expect.objectContaining({ code: "global-partial-rollback", path: partialPath, severity: "warning", fixable: false }));
    expect(JSON.stringify(report)).not.toContain(home);
  });

  it("should_inventory_legacy_project_surfaces_without_taking_new_ownership", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    const path = ".kiro/skills/harnix-check/SKILL.md";
    const content = "legacy owned skill\n";
    await mkdir(join(root, ".kiro", "skills", "harnix-check"), { recursive: true });
    await writeFile(join(root, path), content, { encoding: "utf8" });
    const manifestPath = join(root, ".harnix", ".template-hashes.json");
    const manifest = await readManifest(manifestPath);
    await writeManifest(manifestPath, {
      ...manifest,
      entries: [...manifest.entries, { path, sourceId: "legacy-check", scope: "kiro" as const, generatedHash: sha256(content), generatorVersion: "0.5.0" }].sort((left, right) => left.path.localeCompare(right.path)),
    });

    const report = await diagnoseProject({ root, ...globalOptions(home) });

    expect(report.project.findings).toContainEqual(expect.objectContaining({ code: "legacy-project-surface", path, severity: "info" }));
    await expect(readFile(join(root, path), "utf8")).resolves.toBe(content);
  });

  it("should_inventory_an_untracked_legacy_skill_when_a_sibling_skill_is_manifest_owned", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    const ownedPath = ".agents/skills/harnix-check/SKILL.md";
    const untrackedPath = ".agents/skills/harnix-implement/SKILL.md";
    const owned = "owned legacy Harnix skill\n";
    const untracked = "untracked legacy Harnix skill\n";
    await mkdir(join(root, ".agents", "skills", "harnix-check"), { recursive: true });
    await mkdir(join(root, ".agents", "skills", "harnix-implement"), { recursive: true });
    await writeFile(join(root, ownedPath), owned, { encoding: "utf8" });
    await writeFile(join(root, untrackedPath), untracked, { encoding: "utf8" });
    const manifestPath = join(root, ".harnix", ".template-hashes.json");
    const manifest = await readManifest(manifestPath);
    await writeManifest(manifestPath, {
      ...manifest,
      entries: [...manifest.entries, { path: ownedPath, sourceId: "legacy-check", scope: "codex" as const, generatedHash: sha256(owned), generatorVersion: "0.5.0" }].sort((left, right) => left.path.localeCompare(right.path)),
    });

    const report = await diagnoseProject({ root, ...globalOptions(home) });

    expect(report.project.findings).toContainEqual(expect.objectContaining({ code: "legacy-project-surface-untracked", path: untrackedPath, severity: "warning", fixable: false }));
  });

  it("should_inventory_each_untracked_legacy_skill_across_historical_platform_skill_roots", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    const ownedPath = ".kiro/skills/harnix-check/SKILL.md";
    const untrackedPath = ".kiro/skills/harnix-research/SKILL.md";
    const owned = "owned legacy Harnix skill\n";
    const untracked = "untracked legacy Harnix skill\n";
    await mkdir(join(root, ".kiro", "skills", "harnix-check"), { recursive: true });
    await mkdir(join(root, ".kiro", "skills", "harnix-research"), { recursive: true });
    await writeFile(join(root, ownedPath), owned, { encoding: "utf8" });
    await writeFile(join(root, untrackedPath), untracked, { encoding: "utf8" });
    const manifestPath = join(root, ".harnix", ".template-hashes.json");
    const manifest = await readManifest(manifestPath);
    await writeManifest(manifestPath, {
      ...manifest,
      entries: [...manifest.entries, { path: ownedPath, sourceId: "legacy-kiro-check", scope: "kiro" as const, generatedHash: sha256(owned), generatorVersion: "0.5.0" }].sort((left, right) => left.path.localeCompare(right.path)),
    });

    const report = await diagnoseProject({ root, ...globalOptions(home) });

    expect(report.project.findings).toContainEqual(expect.objectContaining({ code: "legacy-project-surface-untracked", path: untrackedPath, severity: "warning", fixable: false }));
  });

  it("should_inventory_an_untracked_historical_root_agents_block_but_ignore_the_current_init_bootstrap", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    const current = await diagnoseProject({ root, ...globalOptions(home) });
    expect(current.project.findings).not.toContainEqual(expect.objectContaining({ code: "legacy-project-surface-untracked", path: "AGENTS.md" }));

    const agentsPath = join(root, "AGENTS.md");
    const historical = `# User instructions\n\n<!-- harnix:begin -->\nProject-local skills are generated by harnix setup --kiro, harnix setup --antigravity, or harnix setup --codex.\n<!-- harnix:end -->\n`;
    await writeFile(agentsPath, historical, { encoding: "utf8" });
    const manifestPath = join(root, ".harnix", ".template-hashes.json");
    const manifest = await readManifest(manifestPath);
    await writeManifest(manifestPath, {
      ...manifest,
      entries: manifest.entries.filter((entry) => entry.path !== "AGENTS.md"),
    });

    const report = await diagnoseProject({ root, ...globalOptions(home) });

    expect(report.project.findings).toContainEqual(expect.objectContaining({ code: "legacy-project-surface-untracked", path: "AGENTS.md", severity: "warning", fixable: false }));
  });

  it("should_classify_manifest_proven_legacy_hooks_as_possible_duplicate_injection", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    const path = ".kiro/hooks/harnix-context.kiro.hook";
    const content = `${JSON.stringify({
      then: { command: "harnix internal context --platform kiro" },
      when: { type: "promptSubmit" },
    }, null, 2)}\n`;
    await mkdir(join(root, ".kiro", "hooks"), { recursive: true });
    await writeFile(join(root, path), content, { encoding: "utf8" });
    const manifestPath = join(root, ".harnix", ".template-hashes.json");
    const manifest = await readManifest(manifestPath);
    await writeManifest(manifestPath, {
      ...manifest,
      entries: [...manifest.entries, { path, sourceId: "legacy-kiro-hook", scope: "kiro" as const, generatedHash: sha256(content), generatorVersion: "0.5.0" }].sort((left, right) => left.path.localeCompare(right.path)),
    });

    const report = await diagnoseProject({ root, ...globalOptions(home) });

    expect(report.project.findings).toContainEqual(expect.objectContaining({ code: "legacy-project-surface", path, severity: "info" }));
    expect(report.project.findings).toContainEqual(expect.objectContaining({ code: "legacy-project-duplicate-hook", path, severity: "warning", fixable: false }));
  });

  it("should_detect_an_untracked_antigravity_workspace_hook_without_removing_it", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    const path = ".agents/plugins/harnix/hooks.json";
    const content = `${JSON.stringify({
      "harnix-context": {
        PreInvocation: [{ command: "harnix internal context --platform antigravity", type: "command" }],
      },
    }, null, 2)}\n`;
    await mkdir(join(root, ".agents", "plugins", "harnix"), { recursive: true });
    await writeFile(join(root, path), content, { encoding: "utf8" });

    const report = await diagnoseProject({ root, ...globalOptions(home) });

    expect(report.project.findings).toContainEqual(expect.objectContaining({ code: "legacy-project-duplicate-hook", path, severity: "warning", fixable: false }));
    await expect(readFile(join(root, path), "utf8")).resolves.toBe(content);
  });

  it("should_redact_detected_secrets_from_project_findings", async () => {
    const root = await temporaryRepository(); const home = await temporaryUserHome();
    const secret = "harnix-super-secret-value";
    await initializeProject({ developer: "tam", root, yes: true });
    await writeFile(join(root, "AGENTS.md"), `api_key=${secret}\n`);

    const report = await diagnoseProject({ root, ...globalOptions(home) });

    expect(report.project.findings).toContainEqual(expect.objectContaining({ code: "secret-exposure", message: expect.stringContaining("[REDACTED]"), path: "AGENTS.md", severity: "error" }));
    expect(JSON.stringify(report)).not.toContain(secret);
  });
});
