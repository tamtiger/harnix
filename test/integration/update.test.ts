import { access, mkdtemp, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { initializeProject } from "../../src/commands/init.js";
import { updateProject } from "../../src/commands/update.js";

const directories: string[] = [];
async function fixture(): Promise<string> { const root = await mkdtemp(join(tmpdir(), "harnix-update-")); directories.push(root); await initializeProject({ developer: "tam", root, yes: true }); return root; }
afterEach(async () => { await Promise.all(directories.splice(0).map((path) => rm(path, { force: true, recursive: true }))); });

describe("updateProject", () => {
  it("preserves user edits and requires --restore for user-deleted managed files", async () => {
    const root = await fixture(); const workflow = join(root, ".harnix", "workflow.md");
    await unlink(workflow);
    const deleted = await updateProject({ root });
    expect(deleted.deleted).toContain(".harnix/workflow.md"); await expect(access(workflow)).rejects.toMatchObject({ code: "ENOENT" });
    await updateProject({ root, restoreDeleted: true }); await expect(readFile(workflow, "utf8")).resolves.toContain("Harnix workflow");
    await writeFile(join(root, ".harnix", "spec", "guides", "common-rules.md"), "my rules\n");
    await updateProject({ root }); await expect(readFile(join(root, ".harnix", "spec", "guides", "common-rules.md"), "utf8")).resolves.toBe("my rules\n");
  });
  it("does not touch tasks, journals, or unrelated files", async () => {
    const root = await fixture();
    await writeFile(join(root, ".harnix", "tasks", "keep.txt"), "task"); await writeFile(join(root, ".harnix", "workspace", "tam", "keep.jsonl"), "journal"); await writeFile(join(root, "keep.txt"), "user");
    await updateProject({ root });
    await expect(readFile(join(root, ".harnix", "tasks", "keep.txt"), "utf8")).resolves.toBe("task"); await expect(readFile(join(root, ".harnix", "workspace", "tam", "keep.jsonl"), "utf8")).resolves.toBe("journal"); await expect(readFile(join(root, "keep.txt"), "utf8")).resolves.toBe("user");
  });
});
