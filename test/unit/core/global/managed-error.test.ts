import { describe, expect, it } from "vitest";

import { GlobalManagedManifestError } from "src/core/global/managed-error.js";
import { GlobalManagedManifestError as ReExported } from "src/core/global/managed-files.js";

describe("GlobalManagedManifestError", () => {
  it("is a named Error subclass that keeps its message", () => {
    const error = new GlobalManagedManifestError("Invalid manifest.");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(GlobalManagedManifestError);
    expect(error.name).toBe("GlobalManagedManifestError");
    expect(error.message).toBe("Invalid manifest.");
    expect(String(error)).toBe("GlobalManagedManifestError: Invalid manifest.");
  });

  it("carries a cause when one is supplied", () => {
    const cause = new Error("root cause");

    expect(new GlobalManagedManifestError("wrapped", { cause }).cause).toBe(cause);
  });

  it("is the same class the global managed files module re-exports", () => {
    expect(ReExported).toBe(GlobalManagedManifestError);
  });
});
