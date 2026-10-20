import { describe, expect, it } from "vitest";

import { configPackagesDrift, inspectConfigDrift } from "src/core/doctor/config-drift.js";
import type { DoctorFinding } from "src/core/doctor/findings.js";

const detected =
  (...paths: string[]) =>
  () =>
    Promise.resolve({ packages: paths.map((path) => ({ path }) as never) });

describe("configPackagesDrift", () => {
  it("lists detected packages the config lacks, normalized and sorted", () => {
    expect(configPackagesDrift(["svc-a"], ["svc-b", "./svc-a/", "svc-a", "api\\web", "."])).toEqual([
      ".",
      "api/web",
      "svc-b",
    ]);
    expect(configPackagesDrift([".", "svc-a"], ["svc-a", "."])).toEqual([]);
    expect(configPackagesDrift([], [])).toEqual([]);
  });
});

describe("inspectConfigDrift", () => {
  const config = { packages: [{ languages: [], path: "kept", technologies: [] }] };

  it("adds one info finding that names the missing packages and changes no other severity", async () => {
    const findings: DoctorFinding[] = [];

    await inspectConfigDrift("/project", config, findings, detected("kept", "alpha", "beta"));

    expect(findings).toEqual([
      expect.objectContaining({
        code: "config-packages-drift",
        fixable: false,
        message: expect.stringContaining("alpha, beta"),
        path: ".harnix/config.yaml",
        severity: "info",
      }),
    ]);
    expect(findings[0]?.message).not.toContain("/project");
    expect(findings[0]?.message).toContain("harnix update");
  });

  it("lists at most 10 paths and counts the rest", async () => {
    const findings: DoctorFinding[] = [];
    const many = Array.from({ length: 13 }, (_, index) => `p${String(index).padStart(2, "0")}`);

    await inspectConfigDrift("/project", config, findings, detected(...many));

    expect(findings[0]?.message).toContain("(+3 more)");
    expect(findings[0]?.message).toContain("p09");
    expect(findings[0]?.message).not.toContain("p10");
  });

  it("adds nothing when the config is complete and ignores a detection failure", async () => {
    const findings: DoctorFinding[] = [];

    await inspectConfigDrift("/project", config, findings, detected("kept"));
    await inspectConfigDrift("/project", config, findings, () => Promise.reject(new Error("unreadable /secret")));

    expect(findings).toEqual([]);
  });
});
