import { describe, expect, it } from "vitest";

import { GlobalManagedManifestError, GlobalManagedTransactionError } from "src/core/global/types.js";

describe("global managed error types", () => {
  it("carries the rollback outcome and the original error", () => {
    const original = new Error("disk full");
    const error = new GlobalManagedTransactionError("failed", { restored: ["a"], partial: ["b"] }, original);

    expect(error.name).toBe("GlobalManagedTransactionError");
    expect(error.rollback).toEqual({ restored: ["a"], partial: ["b"] });
    expect(error.originalError).toBe(original);
  });

  it("re-exports the manifest error from the same module", () => {
    expect(new GlobalManagedManifestError("bad").message).toBe("bad");
  });
});
