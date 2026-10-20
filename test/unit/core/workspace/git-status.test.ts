import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  assertReadOnlyGit,
  parseGitStatusV2,
  readWorkspaceGitStatus,
  type GitRunner,
} from "src/core/workspace/git-status.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

const temporaryRepository = useTemporaryRepositories("harnix-git-status-");

async function workspaceWith(...names: string[]): Promise<string> {
  const root = await temporaryRepository();
  for (const name of names) await mkdir(join(root, name, ".git"), { recursive: true });
  return root;
}

const header = (lines: string[]): string => lines.map((line) => `${line}\0`).join("");

describe("parseGitStatusV2", () => {
  it("reads branch, upstream, ahead/behind and counts every change entry", () => {
    const output =
      header(["# branch.oid abc", "# branch.head main", "# branch.upstream origin/main", "# branch.ab +2 -1"]) +
      header(["1 .M N... 100644 100644 100644 a b src/a.ts", "? new.ts", "u UU N... 1 1 1 1 h h h conflict.ts"]);

    expect(parseGitStatusV2(output)).toEqual({
      ahead: 2,
      behind: 1,
      branch: "main",
      detached: false,
      dirty: 3,
      upstream: "origin/main",
    });
  });

  it("does not count the original path field that follows a rename", () => {
    const output =
      header(["# branch.head main"]) +
      "2 R. N... 100644 100644 100644 a b R100 new.ts\0old.ts\0" +
      header(["? other.ts"]);

    expect(parseGitStatusV2(output).dirty).toBe(2);
  });

  it("handles a detached HEAD and a branch without upstream", () => {
    expect(parseGitStatusV2(header(["# branch.head (detached)"]))).toMatchObject({
      ahead: null,
      branch: null,
      detached: true,
      upstream: null,
    });
    expect(parseGitStatusV2(header(["# branch.oid (initial)", "# branch.head main"]))).toMatchObject({
      branch: "main",
      detached: false,
    });
  });
});

describe("assertReadOnlyGit", () => {
  it("allows only status and rev-parse behind --no-optional-locks", () => {
    expect(() => assertReadOnlyGit(["--no-optional-locks", "status", "--porcelain=v2"])).not.toThrow();
    expect(() => assertReadOnlyGit(["--no-optional-locks", "rev-parse", "HEAD"])).not.toThrow();
    for (const bad of ["fetch", "pull", "checkout", "commit", "push", "rev-list", "merge", "branch"])
      expect(() => assertReadOnlyGit(["--no-optional-locks", bad])).toThrow();
    expect(() => assertReadOnlyGit(["status"])).toThrow();
    expect(() => assertReadOnlyGit([])).toThrow();
  });
});

describe("readWorkspaceGitStatus", () => {
  it("returns members sorted by name and isolates one failing member", async () => {
    const root = await workspaceWith("zeta", "alpha", "broken");
    const calls: Array<{ cwd: string; args: readonly string[] }> = [];
    const run: GitRunner = (cwd, args) => {
      calls.push({ args, cwd });
      if (cwd.endsWith("broken")) return Promise.reject(new Error(`timeout in ${cwd}`));
      return Promise.resolve(header(["# branch.head main", "# branch.ab +0 -3"]));
    };

    const result = await readWorkspaceGitStatus(root, run);

    expect(result.members.map((member) => member.name)).toEqual(["alpha", "broken", "zeta"]);
    expect(result.members[0]).toMatchObject({ behind: 3, branch: "main", status: "ok" });
    expect(result.members[1]).toMatchObject({ error: "git status failed or timed out", status: "error" });
    expect(JSON.stringify(result)).not.toContain(root);
    expect(calls.every(({ args }) => args[0] === "--no-optional-locks" && args[1] === "status")).toBe(true);
  });

  it("limits concurrency and explains an empty workspace", async () => {
    const root = await workspaceWith("a", "b", "c", "d", "e", "f");
    let running = 0;
    let peak = 0;
    const run: GitRunner = async () => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;
      return header(["# branch.head main"]);
    };

    expect((await readWorkspaceGitStatus(root, run)).members).toHaveLength(6);
    expect(peak).toBeLessThanOrEqual(4);
    const empty = await readWorkspaceGitStatus(await temporaryRepository(), run);
    expect(empty).toMatchObject({ members: [], message: expect.stringContaining("No Git repositories") });
  });
});
