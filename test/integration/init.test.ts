import { access, readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initializeProject } from "../../src/commands/init.js";
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
    await expect(access(join(root, ".harnix", "tasks"))).resolves.toBeUndefined();
    await expect(access(join(root, ".harnix", "workspace", "tam"))).resolves.toBeUndefined();
    const agentInstructions = await readFile(join(root, "AGENTS.md"), "utf8");
    expect(agentInstructions).toContain("CLI manages project lifecycle surfaces");
    expect(agentInstructions).toContain("harnix --help");
    expect(agentInstructions).toContain("harnix setup --codex");
    expect(agentInstructions).toContain("not coding-task stage transitions");
    expect(agentInstructions).toContain("Bypass, Lite, or Full");
    expect(agentInstructions).toContain("harnix-brainstorm");
    expect(agentInstructions).toContain("harnix-implement");
    expect(agentInstructions).toContain("harnix-check");
    expect(agentInstructions).toContain("harnix-finish-work");
    expect(agentInstructions).toContain("harnix-continue");
    expect(agentInstructions).toContain("planning -> ready -> in_progress -> verifying -> completed");
    expect(agentInstructions).toContain("harnix doctor --json");
    await expect(readFile(join(root, "keep.txt"), "utf8")).resolves.toBe("user content");
    await initializeProject({ developer: "tam", root, yes: true });
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toBe(config);
  });
  it("should_initialize_harnix_without_touching_existing_trellis_data", async () => {
    const root = await fixture(); await writeFile(join(root, ".trellis"), "legacy");
    const result = await initializeProject({ developer: "tam", root, yes: true });
    expect(result).toEqual({ created: true, legacyMarkers: [] });
    await expect(access(join(root, ".harnix"))).resolves.toBeUndefined();
    await expect(readFile(join(root, ".trellis"), "utf8")).resolves.toBe("legacy");
  });
  it("preserves existing config, supports dry-run, and initializes quickly", async () => {
    const root = await fixture(); await initializeProject({ developer: "tam", root, yes: true });
    const configPath = join(root, ".harnix", "config.yaml"); await writeFile(configPath, `${await readFile(configPath, "utf8")}futureCompatibleNote: keep\n`);
    await initializeProject({ developer: "other", root, yes: true }); await expect(readFile(configPath, "utf8")).resolves.toContain("futureCompatibleNote: keep");
    const dryRunRoot = await fixture(); await expect(initializeProject({ developer: "tam", dryRun: true, root: dryRunRoot, yes: true })).resolves.toEqual({ created: false, legacyMarkers: [] });
    await expect(access(join(dryRunRoot, ".harnix"))).rejects.toBeDefined();
    const performanceRoot = await fixture(); const startedAt = performance.now(); await initializeProject({ developer: "tam", root: performanceRoot, yes: true }); expect(performance.now() - startedAt).toBeLessThan(5000);
  });
  it("should_seed_relevant_rules_when_initializing_detected_project", async () => {
    const root = await fixture(); await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: { vue: "latest" } }));
    await initializeProject({ developer: "tam", root, yes: true });
    await expect(readFile(join(root, ".harnix", "spec", "guides", "common-rules.md"), "utf8")).resolves.toContain("common engineering rules");
    await expect(readFile(join(root, ".harnix", "spec", "guides", "vue.md"), "utf8")).resolves.toContain("Vue rules");
  });
  it("should_preserve_existing_agent_instructions_when_initializing", async () => {
    const root = await fixture(); await writeFile(join(root, "AGENTS.md"), "# User instructions\n");

    await initializeProject({ developer: "tam", root, yes: true });

    await expect(readFile(join(root, "AGENTS.md"), "utf8")).resolves.toBe("# User instructions\n");
  });
});
