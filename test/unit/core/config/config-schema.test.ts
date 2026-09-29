import { describe, expect, it } from "vitest";

import {
  ConfigValidationError,
  developerPattern,
  languageIds,
  legacyIds,
  platformIds,
  technologyIds,
  topLevelKeys,
  verifyKeys,
} from "src/core/config/config-schema.js";

describe("config-schema", () => {
  it("exports known catalog ids and validation sets", () => {
    expect(languageIds.has("typescript")).toBe(true);
    expect(languageIds.has("go")).toBe(true);
    expect(technologyIds.has("dotnet")).toBe(true);
    expect(legacyIds.has("typescript-nestjs")).toBe(true);
    expect(platformIds.has("kiro")).toBe(true);
    expect(platformIds.has("claude")).toBe(true);
  });

  it("includes verify in topLevelKeys and defines verifyKeys", () => {
    expect(topLevelKeys.has("verify")).toBe(true);
    expect(verifyKeys.has("test")).toBe(true);
    expect(verifyKeys.has("lint")).toBe(true);
    expect(verifyKeys.has("typecheck")).toBe(true);
    expect(verifyKeys.has("format")).toBe(true);
    expect(verifyKeys.has("suite")).toBe(true);
    expect(verifyKeys.has("packages")).toBe(true);
  });

  it("validates developer pattern correctly", () => {
    expect(developerPattern.test("tam")).toBe(true);
    expect(developerPattern.test("developer-1")).toBe(true);
    expect(developerPattern.test("-invalid")).toBe(false);
    expect(developerPattern.test("")).toBe(false);
  });

  it("defines ConfigValidationError error class", () => {
    const error = new ConfigValidationError("Test error");
    expect(error.name).toBe("ConfigValidationError");
    expect(error.message).toBe("Test error");
  });
});
