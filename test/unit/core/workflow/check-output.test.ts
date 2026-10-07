import { describe, expect, it } from "vitest";

import { launcherFailure, summarizeCheckOutput } from "src/core/workflow/check-output.js";

const vitestReport = [
  " Test Files  1 failed | 2 passed (3)",
  "",
  "⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯",
  "",
  " FAIL  test/unit/a.test.ts > suite A > does one thing",
  "AssertionError: expected 1 to be 2 // Object.is equality",
  "",
  "- Expected",
  "+ Received",
  "",
  " ❯ test/unit/a.test.ts:10:5",
  "",
  "⎯⎯⎯⎯⎯⎯⎯[1/2]⎯",
  "",
  " FAIL  test/unit/b.test.ts > does another",
  "Error: boom",
  " ❯ test/unit/b.test.ts:3:1",
].join("\n");

describe("summarizeCheckOutput", () => {
  it("lists each failing vitest test with the first line of its message", () => {
    expect(summarizeCheckOutput(vitestReport)).toBe(
      [
        "suite A > does one thing: AssertionError: expected 1 to be 2 // Object.is equality",
        "does another: Error: boom",
      ].join("\n"),
    );
  });

  it("keeps at most 10 failures and 800 characters", () => {
    const many = Array.from(
      { length: 14 },
      (_, index) => ` FAIL  t.test.ts > case ${index}\nError: ${"x".repeat(120)}`,
    ).join("\n\n");

    const summary = summarizeCheckOutput(many);

    expect(summary.length).toBeLessThanOrEqual(800);
    expect(summary).toContain("case 0");
    expect(summary).not.toContain("case 13");
  });

  it("falls back to the last 600 characters of an unrecognized output", () => {
    const summary = summarizeCheckOutput(`${"a".repeat(1000)}END`);

    expect(summary).toHaveLength(600);
    expect(summary.endsWith("END")).toBe(true);
  });

  it("drops ANSI codes and hides absolute machine paths", () => {
    const summary = summarizeCheckOutput(
      "\u001b[31merror\u001b[0m at C:\\Users\\dev\\repo\\src\\a.ts and /home/dev/repo/src/b.ts",
    );

    expect(summary).toBe("error at <path> and <path>");
  });
});

describe("launcherFailure", () => {
  it.each([
    ["ERR_PNPM_NO_PKG_MANIFEST  No package.json found in C:\\x", "no package.json"],
    [" ERR_PNPM_NO_SCRIPT  Missing script: test", "missing script"],
    ["'pnpm' is not recognized as an internal or external command,", "command not found"],
    ["bash: pnpm: command not found", "command not found"],
    ["npm error code ENOENT\nnpm error enoent Could not read package.json", "no package.json"],
  ])("recognizes the launcher error in %j", (output, reason) => {
    expect(launcherFailure(output, 1)).toContain(reason);
  });

  it("ignores a passing run, a red test and an unknown failure", () => {
    expect(launcherFailure("ERR_PNPM_NO_PKG_MANIFEST", 0)).toBeUndefined();
    expect(launcherFailure(`${vitestReport}\nERR_PNPM_NO_SCRIPT`, 1)).toBeUndefined();
    expect(launcherFailure("tests failed", 1)).toBeUndefined();
  });
});
