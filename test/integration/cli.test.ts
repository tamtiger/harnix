import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer", () => ({ default: { prompt: vi.fn() } }));

import { createProgram } from "../../src/cli.js";
import inquirer from "inquirer";

const temporaryDirectories: string[] = [];
const originalCwd = process.cwd();
async function fixture(): Promise<string> { const root = await mkdtemp(join(tmpdir(), "harnix-cli-test-")); temporaryDirectories.push(root); return root; }
afterEach(async () => { process.chdir(originalCwd); await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true }))); });

describe.sequential("CLI", () => {
  it("supports automated init flags and multi-platform setup", async () => {
    const root = await fixture(); process.chdir(root);
    await createProgram().parseAsync(["node", "harnix", "init", "--yes", "--user", "tam", "--languages", "vue"], { from: "node" });
    await createProgram().parseAsync(["node", "harnix", "setup", "--kiro", "--codex"], { from: "node" });
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("- vue");
    await expect(readFile(join(root, ".codex", "hooks.json"), "utf8")).resolves.toContain("UserPromptSubmit");
  });
  it("uses interactive answers when --yes is omitted", async () => {
    const root = await fixture(); process.chdir(root);
    vi.mocked(inquirer.prompt).mockResolvedValueOnce({ developer: "interactive", languages: "go,vue" });
    await createProgram().parseAsync(["node", "harnix", "init"], { from: "node" });
    await expect(readFile(join(root, ".harnix", "config.yaml"), "utf8")).resolves.toContain("developer: interactive");
  });
});
