import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { diagnoseProject } from "src/commands/doctor.js";
import { initializeProject } from "src/commands/init.js";
import { readManifest, writeManifest } from "src/core/managed/project-files.js";
import { sha256 } from "src/utils/hashing.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";
import { useTemporaryUserHomes } from "test/support/temporary-user-home.js";
import { globalDoctorOptions as globalOptions } from "test/support/integration-fixtures.js";

const temporaryRepository = useTemporaryRepositories("harnix-doctor-");
const temporaryUserHome = useTemporaryUserHomes("harnix-doctor-home-");

describe("diagnoseProject Doctor v2 legacy project surfaces", () => {
  it("should_inventory_legacy_project_surfaces_without_taking_new_ownership", async () => {
    const root = await temporaryRepository();
    const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    const path = ".kiro/skills/harnix-check/SKILL.md";
    const content = "legacy owned skill\n";
    await mkdir(join(root, ".kiro", "skills", "harnix-check"), { recursive: true });
    await writeFile(join(root, path), content, { encoding: "utf8" });
    const manifestPath = join(root, ".harnix", ".template-hashes.json");
    const manifest = await readManifest(manifestPath);
    await writeManifest(manifestPath, {
      ...manifest,
      entries: [
        ...manifest.entries,
        {
          path,
          sourceId: "legacy-check",
          scope: "kiro" as const,
          generatedHash: sha256(content),
          generatorVersion: "0.5.0",
        },
      ].sort((left, right) => left.path.localeCompare(right.path)),
    });

    const report = await diagnoseProject({ root, ...globalOptions(home) });

    expect(report.project.findings).toContainEqual(
      expect.objectContaining({ code: "legacy-project-surface", path, severity: "info" }),
    );
    await expect(readFile(join(root, path), "utf8")).resolves.toBe(content);
  });

  it("should_inventory_an_untracked_legacy_skill_when_a_sibling_skill_is_manifest_owned", async () => {
    const root = await temporaryRepository();
    const home = await temporaryUserHome();
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
      entries: [
        ...manifest.entries,
        {
          path: ownedPath,
          sourceId: "legacy-check",
          scope: "codex" as const,
          generatedHash: sha256(owned),
          generatorVersion: "0.5.0",
        },
      ].sort((left, right) => left.path.localeCompare(right.path)),
    });

    const report = await diagnoseProject({ root, ...globalOptions(home) });

    expect(report.project.findings).toContainEqual(
      expect.objectContaining({
        code: "legacy-project-surface-untracked",
        path: untrackedPath,
        severity: "warning",
        fixable: false,
      }),
    );
  });

  it("should_inventory_each_untracked_legacy_skill_across_historical_platform_skill_roots", async () => {
    const root = await temporaryRepository();
    const home = await temporaryUserHome();
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
      entries: [
        ...manifest.entries,
        {
          path: ownedPath,
          sourceId: "legacy-kiro-check",
          scope: "kiro" as const,
          generatedHash: sha256(owned),
          generatorVersion: "0.5.0",
        },
      ].sort((left, right) => left.path.localeCompare(right.path)),
    });

    const report = await diagnoseProject({ root, ...globalOptions(home) });

    expect(report.project.findings).toContainEqual(
      expect.objectContaining({
        code: "legacy-project-surface-untracked",
        path: untrackedPath,
        severity: "warning",
        fixable: false,
      }),
    );
  });

  it("should_inventory_an_untracked_historical_root_agents_block_but_ignore_the_current_init_bootstrap", async () => {
    const root = await temporaryRepository();
    const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    const current = await diagnoseProject({ root, ...globalOptions(home) });
    expect(current.project.findings).not.toContainEqual(
      expect.objectContaining({ code: "legacy-project-surface-untracked", path: "AGENTS.md" }),
    );

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

    expect(report.project.findings).toContainEqual(
      expect.objectContaining({
        code: "legacy-project-surface-untracked",
        path: "AGENTS.md",
        severity: "warning",
        fixable: false,
      }),
    );
  });

  it("should_classify_manifest_proven_legacy_hooks_as_possible_duplicate_injection", async () => {
    const root = await temporaryRepository();
    const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    const path = ".kiro/hooks/harnix-context.kiro.hook";
    const content = `${JSON.stringify(
      {
        then: { command: "harnix internal context --platform kiro" },
        when: { type: "promptSubmit" },
      },
      null,
      2,
    )}\n`;
    await mkdir(join(root, ".kiro", "hooks"), { recursive: true });
    await writeFile(join(root, path), content, { encoding: "utf8" });
    const manifestPath = join(root, ".harnix", ".template-hashes.json");
    const manifest = await readManifest(manifestPath);
    await writeManifest(manifestPath, {
      ...manifest,
      entries: [
        ...manifest.entries,
        {
          path,
          sourceId: "legacy-kiro-hook",
          scope: "kiro" as const,
          generatedHash: sha256(content),
          generatorVersion: "0.5.0",
        },
      ].sort((left, right) => left.path.localeCompare(right.path)),
    });

    const report = await diagnoseProject({ root, ...globalOptions(home) });

    expect(report.project.findings).toContainEqual(
      expect.objectContaining({ code: "legacy-project-surface", path, severity: "info" }),
    );
    expect(report.project.findings).toContainEqual(
      expect.objectContaining({ code: "legacy-project-duplicate-hook", path, severity: "warning", fixable: false }),
    );
  });

  it("should_detect_an_untracked_antigravity_workspace_hook_without_removing_it", async () => {
    const root = await temporaryRepository();
    const home = await temporaryUserHome();
    await initializeProject({ developer: "tam", root, yes: true });
    const path = ".agents/plugins/harnix/hooks.json";
    const content = `${JSON.stringify(
      {
        "harnix-context": {
          PreInvocation: [{ command: "harnix internal context --platform antigravity", type: "command" }],
        },
      },
      null,
      2,
    )}\n`;
    await mkdir(join(root, ".agents", "plugins", "harnix"), { recursive: true });
    await writeFile(join(root, path), content, { encoding: "utf8" });

    const report = await diagnoseProject({ root, ...globalOptions(home) });

    expect(report.project.findings).toContainEqual(
      expect.objectContaining({ code: "legacy-project-duplicate-hook", path, severity: "warning", fixable: false }),
    );
    await expect(readFile(join(root, path), "utf8")).resolves.toBe(content);
  });
});
