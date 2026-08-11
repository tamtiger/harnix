import { describe, expect, it } from "vitest";

import { UnsafeProjectPathError, normalizeRepositoryPath } from "../../src/utils/paths.js";

describe("project path safety contract", () => {
  it("rejects absolute and traversal persisted paths", () => {
    expect(() => normalizeRepositoryPath("../secret")).toThrow(UnsafeProjectPathError);
    expect(() => normalizeRepositoryPath("C:\\secret")).toThrow(UnsafeProjectPathError);
  });
});
