import { describe, expect, it } from "vitest";

const { summarizeFailures } = (await import(new URL("../../scripts/test-failures.mjs", import.meta.url).href)) as {
  summarizeFailures: (report: unknown, limit?: number) => string[];
};

const report = {
  testResults: [
    {
      name: "D:/repo/test/a.test.ts",
      status: "failed",
      assertionResults: [
        { fullName: "a works", status: "passed", failureMessages: [] },
        {
          fullName: "a breaks",
          status: "failed",
          failureMessages: ["AssertionError: expected 1 to be 2\n    at stack"],
        },
      ],
    },
    { name: "D:/repo/test/b.test.ts", status: "failed", message: "Cannot find module 'x'", assertionResults: [] },
    { name: "D:/repo/test/c.test.ts", status: "passed", assertionResults: [{ fullName: "c", status: "passed" }] },
  ],
};

describe("test:failures summary", () => {
  it("prints only failing tests with the first line of the message, plus suites that failed to load", () => {
    expect(summarizeFailures(report)).toEqual([
      "a breaks — AssertionError: expected 1 to be 2",
      "test/b.test.ts (suite) — Cannot find module 'x'",
    ]);
  });

  it("shortens long messages and says so when nothing failed", () => {
    const long = {
      testResults: [
        {
          name: "t",
          status: "failed",
          assertionResults: [{ fullName: "x", status: "failed", failureMessages: ["y".repeat(50)] }],
        },
      ],
    };

    expect(summarizeFailures(long, 10)).toEqual([`x — ${"y".repeat(9)}…`]);
    expect(summarizeFailures({ testResults: [] })).toEqual([]);
  });
});
