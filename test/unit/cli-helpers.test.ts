import { describe, expect, it } from "vitest";

import {
  defaultDeveloperId,
  parseReportLimit,
  parseRepoMapDepth,
  parseRepoMapLimit,
  parseRepoMapPath,
  parseTaskLimit,
  parseTaskStatus,
  platformFlagList,
  publicCliError,
  redactPublicErrorMessage,
} from "src/cli-helpers.js";

describe("CLI helpers", () => {
  it("normalizes default developer ID from environment", () => {
    expect(defaultDeveloperId({ USERNAME: "alice" })).toBe("alice");
    expect(defaultDeveloperId({ USER: "bob" })).toBe("bob");
    expect(defaultDeveloperId({})).toBe("developer");
    expect(defaultDeveloperId({ USER: "bad@#$name" })).toBe("bad-name");
  });

  it("parses and validates task and repo-map limits and options", () => {
    expect(parseTaskLimit("10")).toBe(10);
    expect(() => parseTaskLimit("0")).toThrow("--limit must be an integer between 1 and 100");
    expect(() => parseTaskLimit("abc")).toThrow("--limit must be an integer between 1 and 100");

    expect(parseTaskStatus("ready")).toBe("ready");
    expect(parseTaskStatus(undefined)).toBeUndefined();
    expect(() => parseTaskStatus("invalid")).toThrow("--status must be");

    expect(parseReportLimit("5", "status")).toBe(5);
    expect(() => parseReportLimit("60", "status")).toThrow("--limit must be an integer between 1 and 50");

    expect(parseRepoMapLimit("15")).toBe(15);
    expect(() => parseRepoMapLimit("25")).toThrow("--limit must be an integer between 1 and 20");

    expect(parseRepoMapDepth("2")).toBe(2);
    expect(() => parseRepoMapDepth("5")).toThrow("--depth must be an integer between 1 and 3");

    expect(parseRepoMapPath("src/index.ts")).toBe("src/index.ts");
    expect(() => parseRepoMapPath("src\\index.ts")).toThrow(
      "must be an exact normalized repository-relative POSIX path",
    );
  });

  it("formats and redacts public CLI error messages", () => {
    const errorResult = publicCliError("Something went wrong", 2);
    expect(errorResult).toEqual({
      generator: "harnix",
      schemaVersion: 1,
      ok: false,
      error: { exitCode: 2, message: "Something went wrong" },
    });

    const redacted = redactPublicErrorMessage(new Error("Failed token=secret123 in /tmp/secret/dir"));
    expect(redacted).not.toContain("secret123");
    expect(redacted).toContain("[REDACTED]");
  });

  it("formats platform flag lists", () => {
    const flags = platformFlagList();
    expect(flags).toContain("--kiro");
    expect(flags).toContain("--antigravity");
  });
});
