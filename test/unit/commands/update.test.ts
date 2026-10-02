import { describe, expect, it } from "vitest";
import { baselineManagedTemplates, updateProject } from "src/commands/update.js";
import { initializeProject } from "src/commands/init.js";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-update-unit-");

describe("updateProject unit", () => {
  it("supports dryRun option without modifying files", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const path = join(root, ".harnix", "workflow.md");
    await writeFile(path, "locally modified\n");

    const result = await updateProject({ root, dryRun: true });
    expect(result).toBeDefined();
    expect(Array.isArray(result.preserved)).toBe(true);
    // File content should remain what we wrote
    expect(await readFile(path, "utf8")).toBe("locally modified\n");
  });

  it("updates project files when dryRun is false", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const result = await updateProject({ root, dryRun: false });
    expect(result).toBeDefined();
    expect(Array.isArray(result.created)).toBe(true);
  });

  it("supports restoreDeleted option", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    const result = await updateProject({ root, restoreDeleted: true, dryRun: true });
    expect(result).toBeDefined();
  });

  it("baselines managed templates into template hashes manifest", async () => {
    const root = await temporaryRepository();
    await initializeProject({ developer: "tam", root, yes: true });
    await expect(baselineManagedTemplates(root)).resolves.toBeUndefined();
  });
});
