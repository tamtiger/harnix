import { describe, expect, it } from "vitest";

import {
  assertReadOnlyCodeImpactGit,
  CODE_IMPACT_LIMIT,
  parseNumstat,
  parsePorcelainV2,
  readCodeImpact,
  type CodeImpactGitRunner,
} from "src/core/tasks/code-impact.js";

const nul = (...parts: string[]): string => parts.map((part) => `${part}\0`).join("");

function runner(status: string, numstat: string, prefix = ""): CodeImpactGitRunner {
  return (_cwd, args) =>
    Promise.resolve(args.includes("rev-parse") ? prefix : args.includes("status") ? status : numstat);
}

describe("parsePorcelainV2", () => {
  it("maps ordinary, untracked, deleted, renamed and conflicted entries", () => {
    const status =
      nul(
        "1 .M N... 100644 100644 100644 a b src/a.ts",
        "1 D. N... 100644 000000 000000 a 0 src/gone.ts",
        "1 A. N... 000000 100644 100644 0 b src/with space.ts",
        "? new.ts",
        "u UU N... 1 1 1 1 h h h conflict.ts",
      ) + nul("2 R. N... 100644 100644 100644 a b R100 renamed.ts", "old.ts");

    expect([...parsePorcelainV2(status)]).toEqual([
      ["src/a.ts", "modified"],
      ["src/gone.ts", "deleted"],
      ["src/with space.ts", "added"],
      ["new.ts", "added"],
      ["conflict.ts", "modified"],
      ["renamed.ts", "modified"],
    ]);
  });
});

describe("parseNumstat", () => {
  it("reads counts, binary files and the new path of a rename", () => {
    const numstat = nul("3\t1\tsrc/a.ts", "-\t-\timage.png") + "5\t0\t\0old.ts\0new.ts\0";

    expect([...parseNumstat(numstat)]).toEqual([
      ["src/a.ts", { additions: 3, deletions: 1 }],
      ["image.png", {}],
      ["new.ts", { additions: 5, deletions: 0 }],
    ]);
  });
});

describe("readCodeImpact", () => {
  it("combines status and numstat, skips .harnix and sorts by path", async () => {
    const status = nul("1 .M N... 100644 100644 100644 a b src/b.ts", "? src/a.ts", "? .harnix/tasks/x/task.json");
    const result = await readCodeImpact("/project", runner(status, nul("2\t1\tsrc/b.ts")));

    expect(result).toEqual({
      items: [
        { path: "src/a.ts", status: "added" },
        { additions: 2, deletions: 1, path: "src/b.ts", status: "modified" },
      ],
      truncated: 0,
    });
  });

  it("cuts the list at the limit and reports how many were not shown", async () => {
    const files = Array.from(
      { length: CODE_IMPACT_LIMIT + 7 },
      (_, index) => `? f${String(index).padStart(3, "0")}.ts`,
    );

    const result = await readCodeImpact("/project", runner(nul(...files), ""));

    expect(result?.items).toHaveLength(CODE_IMPACT_LIMIT);
    expect(result?.truncated).toBe(7);
  });

  it("returns undefined when nothing changed and only runs read-only commands with the safe flags", async () => {
    const calls: Array<readonly string[]> = [];
    const spy: CodeImpactGitRunner = (_cwd, args) => {
      calls.push(args);
      return Promise.resolve("");
    };
    expect(await readCodeImpact("/project", spy)).toBeUndefined();
    expect(calls.every((args) => args[0] === "--no-optional-locks")).toBe(true);
    expect(calls.map((args) => args.find((arg) => !arg.startsWith("-"))).sort()).toEqual([
      "diff",
      "rev-parse",
      "status",
    ]);
    expect(calls.find((args) => args.includes("diff"))).toEqual(
      expect.arrayContaining(["--no-ext-diff", "--no-textconv"]),
    );
    expect(calls.find((args) => args.includes("status"))).toContain("--untracked-files=all");
  });

  it("returns null when git cannot answer so the caller keeps what it had", async () => {
    expect(
      await readCodeImpact("/project", () => Promise.reject(new Error("not a git repository /secret"))),
    ).toBeNull();
    const statusFails: CodeImpactGitRunner = (_cwd, args) =>
      args.includes("status") ? Promise.reject(new Error("timeout")) : Promise.resolve("");
    expect(await readCodeImpact("/project", statusFails)).toBeNull();
  });

  it("skips a project that is only a subdirectory of the repository and survives a missing HEAD", async () => {
    expect(await readCodeImpact("/project", runner(nul("? other/a.ts"), "", "sub/"))).toBeUndefined();
    const noHead: CodeImpactGitRunner = (_cwd, args) =>
      args.includes("diff")
        ? Promise.reject(new Error("bad revision HEAD"))
        : Promise.resolve(args.includes("rev-parse") ? "" : nul("? a.ts"));
    expect(await readCodeImpact("/project", noHead)).toEqual({
      items: [{ path: "a.ts", status: "added" }],
      truncated: 0,
    });
  });

  it("never exposes an absolute path from git", async () => {
    const result = await readCodeImpact("/project", runner(nul("? src/a.ts"), ""));
    expect(JSON.stringify(result)).not.toContain("/project");
  });
});

describe("assertReadOnlyCodeImpactGit", () => {
  it("allows status and diff behind --no-optional-locks and nothing else", () => {
    expect(() => assertReadOnlyCodeImpactGit(["--no-optional-locks", "status"])).not.toThrow();
    expect(() => assertReadOnlyCodeImpactGit(["--no-optional-locks", "diff", "HEAD"])).not.toThrow();
    for (const bad of ["fetch", "commit", "push", "checkout", "add", "stash", "reset"])
      expect(() => assertReadOnlyCodeImpactGit(["--no-optional-locks", bad])).toThrow();
    expect(() => assertReadOnlyCodeImpactGit(["status"])).toThrow();
  });
});
