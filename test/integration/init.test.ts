import { access, readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "../../src/commands/init.js";
import { HARNIX_TARGET_AUTHORITY_INSTRUCTIONS } from "../../src/templates/harnix/activation.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const fixture = useTemporaryRepositories("harnix-init-");

describe("initializeProject", () => {
  it("creates only the approved Harnix tree and is idempotent", async () => {
    const root = await fixture();
    await writeFile(join(root, "package.json"), '{"dependencies":{"vue":"1"}}');
    await writeFile(join(root, "keep.txt"), "user content");
    await initializeProject({ developer: "tam", root, yes: true });
    const config = await readFile(join(root, ".harnix", "config.yaml"), "utf8");
    expect(config).toContain("developer: tam"); expect(config).toContain("- vue");
    await expect(access(join(root, ".harnix", "spec", "guides"))).resolves.toBeUndefined();
    await expect(access(join(root, ".harnix", "tasks"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root, ".harnix", "workspace", "tam"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root, ".harnix", ".developer"))).rejects.toMatchObject({ code: "ENOENT" });
    const repoMapPath = join(root, ".harnix", "cache", "repo-map-v1.json");
    await expect(access(repoMapPath)).resolves.toBeUndefined();
    const agentInstructions = await readFile(join(root, "AGENTS.md"), "utf8");
    expect(agentInstructions).toContain("CLI manages this project's .harnix lifecycle");
    expect(agentInstructions).toContain("harnix --help");
    expect(agentInstructions).toContain("harnix setup --codex");
    expect(agentInstructions).toContain("explicit user-global integration");
    expect(agentInstructions).toContain("Do not run setup or harnix init automatically");
    for (const instruction of HARNIX_TARGET_AUTHORITY_INSTRUCTIONS) {
      expect(agentInstructions).toContain(instruction);
    }
    const lastTargetGuardIndex = agentInstructions.indexOf(HARNIX_TARGET_AUTHORITY_INSTRUCTIONS.at(-1)!);
    expect(lastTargetGuardIndex).toBeLessThan(agentInstructions.indexOf("## Project profile"));
    expect(lastTargetGuardIndex).toBeLessThan(agentInstructions.indexOf("Read .harnix/workflow.md"));
    expect(agentInstructions).toContain("Use this profile only when this AGENTS root is the selected Harnix root resolved by the target-authority guard");
    expect(agentInstructions).not.toContain("this AGENTS root is the selected target");
    expect(agentInstructions).toContain("Read .harnix/workflow.md and .harnix/config.yaml from the selected Harnix root");
    expect(agentInstructions).toContain("## Project profile");
    expect(agentInstructions).toContain("- Languages: not specified.");
    expect(agentInstructions).toContain("- Technologies: Vue.");
    expect(agentInstructions).toContain("- Package paths: `.`.");
    expect(agentInstructions).not.toContain("Detected repository");
    expect(agentInstructions).not.toContain("Project-local skills are generated");
    expect(agentInstructions).toContain("not coding-task stage transitions");
    expect(agentInstructions).toContain("Bypass, Lite, or Full");
    expect(agentInstructions).toContain("harnix-brainstorm");
    expect(agentInstructions).toContain("harnix-implement");
    expect(agentInstructions).toContain("harnix-check");
    expect(agentInstructions).toContain("harnix-finish-work");
    expect(agentInstructions).toContain("harnix-continue");
    expect(agentInstructions).toContain("planning -> ready -> in_progress -> verifying -> completed");
    expect(agentInstructions).toContain("harnix doctor");
    await expect(readFile(join(root, "keep.txt"), "utf8")).resolves.toBe("user content");
    await writeFile(join(root, "added-after-init.ts"), "export const stale = true;\n");
    await initializeProject({ developer: "tam", root, yes: true });
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toBe(config);
    await expect(readFile(repoMapPath, "utf8")).resolves.not.toContain("added-after-init.ts");
  });
  it("should_initialize_harnix_without_touching_existing_trellis_data", async () => {
    const root = await fixture(); await writeFile(join(root, ".trellis"), "legacy");
    const result = await initializeProject({ developer: "tam", root, yes: true });
    expect(result).toEqual({
      scope: "project",
      status: "initialized",
      developer: "tam",
      languages: [],
      technologies: [],
      detection: { matches: [] },
      created: [
        ".harnix/.template-hashes.json",
        ".harnix/cache/repo-map-v1.json",
        ".harnix/config.yaml",
        ".harnix/spec/guides/common/engineering.md",
        ".harnix/workflow.md",
        "AGENTS.md",
      ],
      updated: [],
      unchanged: [],
      preserved: [],
      warnings: [],
    });
    await expect(access(join(root, ".harnix"))).resolves.toBeUndefined();
    await expect(readFile(join(root, ".trellis"), "utf8")).resolves.toBe("legacy");
  });
  it("preserves existing config, supports dry-run, and initializes quickly", async () => {
    const root = await fixture(); await initializeProject({ developer: "tam", root, yes: true });
    const configPath = join(root, ".harnix", "config.yaml"); await writeFile(configPath, `${await readFile(configPath, "utf8")}futureCompatibleNote: keep\n`);
    await initializeProject({ developer: "other", root, yes: true }); await expect(readFile(configPath, "utf8")).resolves.toContain("futureCompatibleNote: keep");
    const dryRunRoot = await fixture(); await expect(initializeProject({ developer: "tam", dryRun: true, root: dryRunRoot, yes: true })).resolves.toMatchObject({
      scope: "project",
      status: "planned",
      developer: "tam",
      created: expect.arrayContaining([".harnix/config.yaml", ".harnix/cache/repo-map-v1.json", ".harnix/workflow.md", "AGENTS.md"]),
      unchanged: [],
      preserved: [],
    });
    await expect(access(join(dryRunRoot, ".harnix"))).rejects.toBeDefined();
    const performanceRoot = await fixture(); const startedAt = performance.now(); await initializeProject({ developer: "tam", root: performanceRoot, yes: true }); expect(performance.now() - startedAt).toBeLessThan(5000);
  });
  it("should_seed_relevant_rules_when_initializing_detected_project", async () => {
    const root = await fixture(); await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: { vue: "latest" } }));
    await initializeProject({ developer: "tam", root, yes: true });
    const common = await readFile(join(root, ".harnix", "spec", "guides", "common", "engineering.md"), "utf8");
    expect(common).toContain("broader gates");
    expect(common).toContain("repository instructions");
    await expect(readFile(join(root, ".harnix", "spec", "guides", "technologies", "framework", "vue", "engineering.md"), "utf8")).resolves.toContain("Vue engineering");
  });
  it("should_detect_php_composer_projects_and_seed_php_guidance", async () => {
    const root = await fixture();
    await writeFile(join(root, "composer.json"), JSON.stringify({ require: { php: ">=5.4" } }));

    await initializeProject({ developer: "tam", root, yes: true });

    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("- php");
    await expect(readFile(join(root, ".harnix", "spec", "guides", "languages", "php", "engineering.md"), "utf8")).resolves.toContain("PHP engineering");
    await expect(readFile(join(root, "AGENTS.md"), "utf8")).resolves.toContain("- Languages: PHP.");
  });
  it("should_seed_actionable_dotnet_abp_guidance_instead_of_a_placeholder", async () => {
    const root = await fixture(); await writeFile(join(root, "sample.csproj"), '<Project><PackageReference Include="Volo.Abp.Core" /></Project>');

    await initializeProject({ developer: "tam", root, yes: true });

    const guide = `${await readFile(join(root, ".harnix", "spec", "guides", "technologies", "framework", "abp", "engineering.md"), "utf8")}\n${await readFile(join(root, ".harnix", "spec", "guides", "technologies", "runtime", "dotnet", "engineering.md"), "utf8")}`;
    expect(guide).toContain("ABP authorization policies");
    expect(guide).toContain("no-tracking");
    expect(guide).toContain("tenant isolation");
  });
  it("should_preserve_existing_agent_instructions_when_initializing", async () => {
    const root = await fixture(); await writeFile(join(root, "AGENTS.md"), "# User instructions\n");

    await initializeProject({ developer: "tam", root, yes: true });

    await expect(readFile(join(root, "AGENTS.md"), "utf8")).resolves.toBe("# User instructions\n");
  });
});
