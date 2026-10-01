import { describe, expect, it } from "vitest";

import { containsSecret, finding, isMissing, redact, sortFindings } from "src/core/doctor/findings.js";

describe("doctor findings", () => {
  it("builds a finding and omits an absent path", () => {
    expect(finding("code", "warning", undefined, "message", true)).toEqual({
      code: "code",
      severity: "warning",
      message: "message",
      fixable: true,
    });
    expect(finding("code", "info", "a/b", "message", false).path).toBe("a/b");
  });

  it("sorts errors before warnings before info, then by code and path", () => {
    const sorted = sortFindings([
      finding("b", "info", undefined, "m", false),
      finding("b", "warning", "z", "m", false),
      finding("b", "warning", "a", "m", false),
      finding("a", "warning", undefined, "m", false),
      finding("z", "error", undefined, "m", false),
    ]);

    expect(sorted.map((item) => `${item.severity}:${item.code}:${item.path ?? ""}`)).toEqual([
      "error:z:",
      "warning:a:",
      "warning:b:a",
      "warning:b:z",
      "info:b:",
    ]);
  });

  it("recognizes a missing path error", () => {
    expect(isMissing(Object.assign(new Error("x"), { code: "ENOENT" }))).toBe(true);
    expect(isMissing(new Error("x"))).toBe(false);
    expect(isMissing(undefined)).toBe(false);
  });

  it("redacts the project root and secret assignments from reported errors", () => {
    expect(redact(new Error("failed in /work/repo with token=abc123456"), "/work/repo")).toBe(
      "failed in [PROJECT] with token=[REDACTED]",
    );
  });

  it("detects secret-looking assignments only when the value is long enough", () => {
    expect(containsSecret("api_key = 'abcdefgh1234'")).toBe(true);
    expect(containsSecret("password: short")).toBe(false);
    expect(containsSecret("nothing here")).toBe(false);
  });
});
