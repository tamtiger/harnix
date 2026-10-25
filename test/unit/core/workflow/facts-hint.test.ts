import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { checkFactsStale } from "src/core/workflow/facts-hint.js";
import { preflightWorkflow } from "src/core/workflow/preflight.js";
import { initializeUtcProject } from "test/support/workflow-fixtures.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const execFileAsync = promisify(execFile);
const temporaryRepository = useTemporaryRepositories();

describe("project facts staleness", () => {
  it("is undetermined without a commit or a recorded one", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    expect(await checkFactsStale(root, undefined)).toBeUndefined();
    expect(await checkFactsStale(root, "abc1234")).toBeUndefined();
  });

  it("adds factsHint to preflight only when the recorded commit differs from HEAD", async () => {
    const root = await temporaryRepository();
    await initializeUtcProject(root);
    const factsPath = join(root, ".harnix", "spec", "project-facts.md");
    await mkdir(dirname(factsPath), { recursive: true });
    await writeFile(factsPath, "# Facts\n<!-- git-commit: 0000000 -->\n");
    await execFileAsync("git", ["init", "-b", "main"], { cwd: root });
    await execFileAsync("git", ["config", "user.name", "Test User"], { cwd: root });
    await execFileAsync("git", ["config", "user.email", "test@example.com"], { cwd: root });
    await execFileAsync("git", ["add", "-A"], { cwd: root });
    await execFileAsync("git", ["commit", "-m", "init"], { cwd: root });

    const stale = await preflightWorkflow(root, Date.now());
    expect(stale.projectFactsStale).toBe(true);
    expect(stale.factsHint).toContain("harnix update");
    expect(stale.factsHint).toContain("does not alter task state");

    await writeFile(factsPath, `# Facts\n<!-- git-commit: ${stale.git?.commit ?? ""} -->\n`);
    const fresh = await preflightWorkflow(root, Date.now());
    expect(fresh.projectFactsStale).toBe(false);
    expect(fresh.factsHint).toBeUndefined();
  });
});
