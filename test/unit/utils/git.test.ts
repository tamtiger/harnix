import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

import { readGitContext, runGit } from "src/utils/git.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const execFileAsync = promisify(execFile);
const temporaryRepository = useTemporaryRepositories("harnix-git-");

describe("utils/git", () => {
  it("reads git context (branch, clean, commit) in an active repository", async () => {
    const root = await temporaryRepository();
    await execFileAsync("git", ["init", "-b", "feat/test-branch"], { cwd: root });
    await execFileAsync("git", ["config", "user.name", "Tester"], { cwd: root });
    await execFileAsync("git", ["config", "user.email", "test@example.com"], { cwd: root });
    await writeFile(join(root, "file.txt"), "hello");
    await execFileAsync("git", ["add", "-A"], { cwd: root });
    await execFileAsync("git", ["commit", "-m", "initial"], { cwd: root });

    const cleanContext = await readGitContext(root);
    expect(cleanContext).toBeDefined();
    expect(cleanContext?.branch).toBe("feat/test-branch");
    expect(cleanContext?.clean).toBe(true);
    expect(cleanContext?.commit).toMatch(/^[0-9a-f]{7,}/u);

    // Make working tree dirty
    await writeFile(join(root, "untracked.txt"), "untracked");
    const dirtyContext = await readGitContext(root);
    expect(dirtyContext?.clean).toBe(false);
  });

  it("returns detached HEAD branch formatting", async () => {
    const root = await temporaryRepository();
    await execFileAsync("git", ["init", "-b", "main"], { cwd: root });
    await execFileAsync("git", ["config", "user.name", "Tester"], { cwd: root });
    await execFileAsync("git", ["config", "user.email", "test@example.com"], { cwd: root });
    await writeFile(join(root, "file.txt"), "hello");
    await execFileAsync("git", ["add", "-A"], { cwd: root });
    await execFileAsync("git", ["commit", "-m", "initial"], { cwd: root });

    // Detach HEAD
    await execFileAsync("git", ["checkout", "--detach"], { cwd: root });
    const context = await readGitContext(root);
    expect(context?.branch).toMatch(/^HEAD \([0-9a-f]{7,}\)$/u);
  });

  it("safely returns undefined when not in a git repository", async () => {
    const root = await temporaryRepository();
    const context = await readGitContext(root);
    expect(context).toBeUndefined();
  });
  it("runs a read-only git command without a shell and rejects on failure", async () => {
    const root = await temporaryRepository();
    expect(await runGit(root, ["--version"])).toContain("git version");
    await expect(runGit(root, ["no-such-subcommand"])).rejects.toThrow();
  });
});
