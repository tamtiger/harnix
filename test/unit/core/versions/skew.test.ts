import { describe, expect, it } from "vitest";

import { compareVersions, detectVersionSkew, skewMessage } from "src/core/versions/skew.js";

const manifest = (...versions: string[]) => ({ entries: versions.map((generatorVersion) => ({ generatorVersion })) });

describe("version skew", () => {
  it("orders versions with pre-releases below their release", () => {
    expect(compareVersions("2.2.0", "2.1.9")).toBeGreaterThan(0);
    expect(compareVersions("2.2.0-dev.3", "2.2.0")).toBeLessThan(0);
    expect(compareVersions("2.2.0-dev.10", "2.2.0-dev.9")).toBeGreaterThan(0);
    expect(compareVersions("2.2.0", "2.2.0")).toBe(0);
  });

  it("reports the highest recorded version when the running CLI is older", () => {
    expect(detectVersionSkew(manifest("2.0.4", "2.2.0-dev.11"), "2.0.4")).toEqual({
      recorded: "2.2.0-dev.11",
      running: "2.0.4",
    });
    expect(detectVersionSkew(manifest("2.2.0-dev.3"), "2.1.0")).toEqual({ recorded: "2.2.0-dev.3", running: "2.1.0" });
  });

  it("stays silent when the versions are equal or the CLI is newer, pre-releases included", () => {
    expect(detectVersionSkew(manifest("2.2.0"), "2.2.0")).toBeUndefined();
    expect(detectVersionSkew(manifest("2.2.0-dev.5"), "2.2.0")).toBeUndefined();
    expect(detectVersionSkew(manifest("2.2.0-dev.5"), "2.2.0-dev.6")).toBeUndefined();
    expect(detectVersionSkew(manifest(), "2.0.0")).toBeUndefined();
  });

  it("ignores entries whose version is not semver and says how to update", () => {
    expect(detectVersionSkew(manifest("unknown", ""), "1.0.0")).toBeUndefined();
    expect(skewMessage({ recorded: "2.2.0", running: "2.0.4" })).toMatch(/2\.0\.4[\s\S]*2\.2\.0[\s\S]*reinstall/u);
  });
});
