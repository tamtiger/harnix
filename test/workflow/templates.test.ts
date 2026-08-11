import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { initializeProject } from "../../src/commands/init.js";
import { setupPlatforms } from "../../src/commands/setup.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories();

describe("workflow templates", () => {
  it("seeds canonical workflow and all skills for Kiro and Codex", async () => {
    const root = await temporaryRepository(); await initializeProject({ root, developer: "tam", yes: true });
    await setupPlatforms({ root, platforms: ["kiro", "codex"] });
    for (const base of [".kiro/skills", ".agents/skills"]) for (const name of ["harnix-brainstorm", "harnix-implement", "harnix-check", "harnix-finish-work", "harnix-continue", "harnix-research", "harnix-debug"]) expect(await readFile(join(root, base, name, "SKILL.md"), "utf8")).toContain(`name: ${name}`);
    expect(await readFile(join(root, ".harnix", "workflow.md"), "utf8")).toContain("planning → ready → in_progress");
  });
  it("preserves a user-modified managed workflow on rerun", async () => {
    const root = await temporaryRepository(); await initializeProject({ root, developer: "tam", yes: true }); await setupPlatforms({ root, platforms: ["kiro"] });
    await writeFile(join(root, ".harnix", "workflow.md"), "user workflow"); await setupPlatforms({ root, platforms: ["kiro"] }); expect(await readFile(join(root, ".harnix", "workflow.md"), "utf8")).toBe("user workflow");
  });
});
