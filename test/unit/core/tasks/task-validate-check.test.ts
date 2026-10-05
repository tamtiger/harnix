import { describe, expect, it } from "vitest";

import {
  assertValidationCheckExtras,
  baselineClassifications,
  baselineKeys,
} from "src/core/tasks/task-validate-check.js";

describe("assertValidationCheckExtras", () => {
  it("accepts a check without cwd or baseline", () => {
    expect(() => assertValidationCheckExtras({ id: "check" })).not.toThrow();
  });

  it("names the check in a cwd error and rejects non-string and unsafe values", () => {
    expect(() => assertValidationCheckExtras({ id: "unit", cwd: 3 })).toThrow("check 'unit' has invalid cwd");
    expect(() => assertValidationCheckExtras({ id: "unit", cwd: "../x" })).toThrow("has invalid cwd");
  });

  it("documents the closed baseline contract", () => {
    expect([...baselineKeys]).toEqual(["authorizedBy", "classification", "result", "scope"]);
    expect([...baselineClassifications]).toEqual(["pre-existing", "introduced", "environment", "unknown"]);
  });

  it("rejects unknown keys, bad enums and non-string text in a baseline", () => {
    expect(() => assertValidationCheckExtras({ id: "c", baseline: "x" })).toThrow("baseline is invalid");
    expect(() => assertValidationCheckExtras({ id: "c", baseline: { other: 1 } })).toThrow("unknown field");
    expect(() => assertValidationCheckExtras({ id: "c", baseline: { result: "maybe" } })).toThrow("invalid result");
    expect(() => assertValidationCheckExtras({ id: "c", baseline: { classification: "x" } })).toThrow(
      "invalid classification",
    );
    expect(() => assertValidationCheckExtras({ id: "c", baseline: { scope: 1 } })).toThrow("invalid scope");
    expect(() =>
      assertValidationCheckExtras({ id: "c", baseline: { authorizedBy: "user", result: "fail" } }),
    ).not.toThrow();
  });
});
