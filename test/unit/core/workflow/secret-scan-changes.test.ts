import { describe, expect, it } from "vitest";

import { changedPaths } from "src/core/workflow/secret-scan-changes.js";

const output = (...lines: string[]) => lines.join("\0") + "\0";

describe("changedPaths", () => {
  it("collects modified, renamed and untracked paths from porcelain v2", async () => {
    const status = output(
      "1 .M N... 100644 100644 100644 aaaa bbbb src/a.ts",
      "2 R. N... 100644 100644 100644 aaaa bbbb R100 src/new-name.ts",
      "src/old-name.ts",
      "? src/c.ts",
    );
    const run = async (_cwd: string, args: readonly string[]) => (args.includes("rev-parse") ? "\n" : status);

    expect([...(await changedPaths("/r", run))!].sort()).toEqual(["src/a.ts", "src/c.ts", "src/new-name.ts"]);
  });

  it("is undefined below the repository root and when git fails", async () => {
    expect(await changedPaths("/r", async (_c, args) => (args.includes("rev-parse") ? "sub/\n" : ""))).toBeUndefined();
    expect(await changedPaths("/r", async () => Promise.reject(new Error("x")))).toBeUndefined();
  });
});
