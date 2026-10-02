import { describe, expect, it } from "vitest";

import { packageVersion } from "src/version.js";

describe("packageVersion", () => {
  it("resolves the current package version matching 2.0.0", () => {
    expect(packageVersion).toBe("2.0.0");
  });
});
