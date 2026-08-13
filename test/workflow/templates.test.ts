import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { initializeProject } from "../../src/commands/init.js";
import { renderAgentsTemplate } from "../../src/templates/harnix/agents.js";
import { ensureManagedWorkflow } from "../../src/templates/harnix/managed-workflow.js";
import { workflowSkills, workflowTemplate } from "../../src/templates/harnix/workflow.js";
import { packageVersion } from "../../src/version.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow templates", () => {
  it("keeps the init bootstrap project-local while directing opt-in setup to user-global integrations", async () => {
    const root = await temporaryRepository();

    await initializeProject({ root, developer: "tam", yes: true });

    await expect(readFile(join(root, "AGENTS.md"), "utf8")).resolves.toBe(renderAgentsTemplate({ languages: [], technologies: [], packages: [] }));
    await expect(readFile(join(root, ".harnix", "workflow.md"), "utf8")).resolves.toBe(workflowTemplate);
    const agentInstructions = await readFile(join(root, "AGENTS.md"), "utf8");
    expect(agentInstructions).toContain("explicit user-global integration");
    expect(agentInstructions).toContain(`- Version: ${packageVersion}.`);
    expect(agentInstructions).toContain("## Harnix\n\n- Version:");
    expect(agentInstructions).toContain("## Project profile");
    expect(agentInstructions).toContain("- Languages: not specified.");
    expect(agentInstructions).toContain("- Package paths: not specified.");
    expect(agentInstructions).toContain("initialization-time discovery seed");
    expect(agentInstructions).toContain("do not bulk-load the repository");
    expect(agentInstructions).toContain("project-local coding-agent harness");
    expect(agentInstructions).toContain("Do not run setup or harnix init automatically");
    expect(agentInstructions).not.toContain("increment the package patch version");
    expect(agentInstructions).not.toContain("update `CHANGELOG.md`");
    expect(agentInstructions).toContain("Before any commit, show the proposed changes and commit message, then wait for explicit user approval");
    expect(agentInstructions).toContain("nearest initialized project ancestor or workspace root");
    expect(agentInstructions).toContain("harnix repo-map --query <text>");
    expect(agentInstructions).toContain("cache-only navigation hints");
    expect(agentInstructions).toContain("harnix doctor --fix");
    expect(agentInstructions).toContain("must not invoke repository-map queries or refreshes");
    expect(agentInstructions).not.toContain("<!-- harnix:begin -->");
    expect(agentInstructions).not.toContain("<!-- harnix:end -->");
    expect(agentInstructions).not.toContain("Detected repository");
    expect(agentInstructions).not.toContain("Project-local skills are generated");
    expect(agentInstructions).not.toMatch(/\.(?:kiro|gemini|codex)\//u);
    expect(agentInstructions).not.toContain("commandWindows");
    await expect(access(join(root, ".kiro"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root, ".gemini"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root, ".codex"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root, ".agents"))).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("preserves a user-modified managed workflow without invoking platform setup", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });

    expect(workflowTemplate).toContain("nearest initialized project ancestor or workspace root");
    expect(workflowTemplate).toContain("explicit user-global operation");
    expect(workflowTemplate).toContain("do not create files or automatically run `harnix init`");
    expect(workflowTemplate).toContain("Bypass");
    expect(workflowTemplate).toContain("Ready gate");
    expect(workflowTemplate).toContain("RED → GREEN → REFACTOR");
    expect(workflowTemplate).toContain("## Persist and restore state");
    expect(workflowTemplate).toContain("Before product edits, persist");
    expect(workflowTemplate).toContain(".harnix/tasks/.active");
    expect(workflowTemplate).toContain("discovery seeds, not complete repository truth");
    expect(workflowTemplate).toContain("Plan-only requests stop at `ready`");
    expect(workflowTemplate).toContain("harnix repo-map --query <text>");
    expect(workflowTemplate).toContain("must not invoke repository-map queries or refreshes");
    expect(workflowTemplate).not.toContain("Increase the package patch version");
    expect(workflowTemplate).not.toContain("update `CHANGELOG.md`");
    expect(workflowTemplate).toContain("Before any commit, show the proposed changes and commit message, then wait for explicit user approval");
    for (const skill of workflowSkills) {
      expect(skill.body).toContain("## Incoming state");
      expect(skill.body).toContain("## Persist");
      expect(skill.body).toContain("## Exit");
    }
    await writeFile(join(root, ".harnix", "workflow.md"), "user workflow");
    await ensureManagedWorkflow(root);

    await expect(readFile(join(root, ".harnix", "workflow.md"), "utf8")).resolves.toBe("user workflow");
  });
});
