import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { initializeProject } from "../../src/commands/init.js";
import { agentsTemplate, harnixAgentsBlock } from "../../src/templates/harnix/agents.js";
import { ensureManagedWorkflow } from "../../src/templates/harnix/managed-workflow.js";
import { workflowTemplate } from "../../src/templates/harnix/workflow.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow templates", () => {
  it("keeps the init bootstrap project-local while directing opt-in setup to user-global integrations", async () => {
    const root = await temporaryRepository();

    await initializeProject({ root, developer: "tam", yes: true });

    await expect(readFile(join(root, "AGENTS.md"), "utf8")).resolves.toBe(agentsTemplate);
    await expect(readFile(join(root, ".harnix", "workflow.md"), "utf8")).resolves.toBe(workflowTemplate);
    expect(harnixAgentsBlock).toContain("explicit user-global integration");
    expect(harnixAgentsBlock).toContain("Do not run setup or harnix init automatically");
    expect(harnixAgentsBlock).toContain(".harnix/config.yaml");
    expect(harnixAgentsBlock).not.toContain("Project-local skills are generated");
    expect(harnixAgentsBlock).not.toMatch(/\.(?:kiro|gemini|codex)\//u);
    expect(harnixAgentsBlock).not.toContain("commandWindows");
    await expect(access(join(root, ".kiro"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root, ".gemini"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root, ".codex"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(join(root, ".agents"))).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("preserves a user-modified managed workflow without invoking platform setup", async () => {
    const root = await temporaryRepository();
    await initializeProject({ root, developer: "tam", yes: true });

    expect(workflowTemplate).toContain("only to a project whose current workspace has `.harnix/config.yaml`");
    expect(workflowTemplate).toContain("explicit user-global operation");
    expect(workflowTemplate).toContain("do not create files or automatically run `harnix init`");
    await writeFile(join(root, ".harnix", "workflow.md"), "user workflow");
    await ensureManagedWorkflow(root);

    await expect(readFile(join(root, ".harnix", "workflow.md"), "utf8")).resolves.toBe("user workflow");
  });
});
