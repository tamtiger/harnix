import { describe, expect, it } from "vitest";

import { hasErrorCode, isMissingPathError } from "src/utils/errno.js";

describe("errno helpers", () => {
  it("recognizes an error that carries exactly the requested code", () => {
    expect(hasErrorCode(Object.assign(new Error("x"), { code: "EPERM" }), "EPERM")).toBe(true);
    expect(hasErrorCode(Object.assign(new Error("x"), { code: "EPERM" }), "EBUSY")).toBe(false);
  });

  it("rejects values that are not error-like", () => {
    for (const value of [undefined, null, "ENOENT", 0, {}, { code: 2 }]) {
      expect(hasErrorCode(value, "ENOENT")).toBe(false);
      expect(isMissingPathError(value)).toBe(false);
    }
  });

  it("treats only ENOENT as a missing path", () => {
    expect(isMissingPathError(Object.assign(new Error("x"), { code: "ENOENT" }))).toBe(true);
    expect(isMissingPathError(Object.assign(new Error("x"), { code: "ENOTDIR" }))).toBe(false);
    expect(isMissingPathError(Object.assign(new Error("x"), { code: "EACCES" }))).toBe(false);
  });
});
