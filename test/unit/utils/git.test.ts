import { execFile } from "node:child_process";
import { access, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

import { readGitContext, runGit, safeGitArgs, safeGitEnvironment } from "src/utils/git.js";
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

  it("treats a tree that differs only in line endings as clean but a real edit as dirty", async () => {
    const root = await temporaryRepository();
    await execFileAsync("git", ["init", "-b", "main"], { cwd: root });
    await execFileAsync("git", ["config", "user.name", "Tester"], { cwd: root });
    await execFileAsync("git", ["config", "user.email", "test@example.com"], { cwd: root });
    await execFileAsync("git", ["config", "core.autocrlf", "false"], { cwd: root });
    await writeFile(join(root, "file.txt"), "one\ntwo\n");
    await execFileAsync("git", ["add", "-A"], { cwd: root });
    await execFileAsync("git", ["commit", "-m", "initial"], { cwd: root });

    await writeFile(join(root, "file.txt"), "one\r\ntwo\r\n");
    expect((await execFileAsync("git", ["status", "--porcelain"], { cwd: root })).stdout).toContain("file.txt");
    expect((await readGitContext(root))?.clean).toBe(true);

    await writeFile(join(root, "file.txt"), "one\r\nthree\r\n");
    expect((await readGitContext(root))?.clean).toBe(false);
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

  it("turns off repository programs for every read-only call and drops inherited git variables", () => {
    expect(safeGitArgs(["status"])).toEqual([
      "-c",
      "core.fsmonitor=false",
      "-c",
      "core.untrackedCache=false",
      "status",
    ]);
    const env = safeGitEnvironment({
      GIT_DIR: "/x",
      GIT_WORK_TREE: "/y",
      GIT_INDEX_FILE: "/z",
      GIT_EXTERNAL_DIFF: "evil",
      KEEP: "1",
    });
    expect(env).toEqual({ GIT_OPTIONAL_LOCKS: "0", GIT_PAGER: "cat", KEEP: "1" });
  });

  it("does not run a core.fsmonitor program planted in the repository config", { timeout: 30_000 }, async () => {
    const root = await temporaryRepository();
    await execFileAsync("git", ["init", "-b", "main"], { cwd: root });
    await writeFile(join(root, "monitor.js"), "require('node:fs').writeFileSync('marker.txt', 'ran');\n");
    await execFileAsync("git", ["config", "core.fsmonitor", "node monitor.js"], { cwd: root });

    await runGit(root, ["status", "--porcelain"]);
    await expect(access(join(root, "marker.txt"))).rejects.toMatchObject({ code: "ENOENT" });

    // Control: the same repository does run the program for a plain git status, so the check above is meaningful.
    await execFileAsync("git", ["status", "--porcelain"], { cwd: root });
    const controlRan = await access(join(root, "marker.txt")).then(
      () => true,
      () => false,
    );
    if (!controlRan) console.warn("git here ignores core.fsmonitor; the guard could not be demonstrated");
  });
});

describe("one way to run git", () => {
  it("leaves src/utils/git.ts the only source file that starts git itself", async () => {
    const { readdir, readFile } = await import("node:fs/promises");
    const files = (await readdir("src", { recursive: true })).filter((name) => name.endsWith(".ts"));
    const direct: string[] = [];
    for (const name of files) {
      const text = await readFile(join("src", name), "utf8");
      if (/(?:execFile|execFileAsync|spawn)\(\s*["']git["']/u.test(text)) direct.push(name.replaceAll("\\", "/"));
    }

    expect(direct).toEqual(["utils/git.ts"]);
  });
});
