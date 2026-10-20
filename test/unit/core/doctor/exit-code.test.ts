import { describe, expect, it } from "vitest";

import type { DoctorReport } from "src/core/doctor/doctor.js";
import { doctorExitCode } from "src/core/doctor/exit-code.js";

function report(summary: { errors: number; warnings: number }, invalid = "valid"): DoctorReport {
  return {
    generator: "harnix",
    globalIntegrations: [],
    ok: summary.errors === 0 && summary.warnings === 0,
    project: { findings: [], status: invalid },
    schemaVersion: 2,
    summary: { ...summary, fixed: 0 },
  } as unknown as DoctorReport;
}

describe("doctor exit code", () => {
  it("keeps the frozen defaults: 0 healthy, 1 for warnings or errors, 2 for invalid state", () => {
    expect(doctorExitCode(report({ errors: 0, warnings: 0 }))).toBe(0);
    expect(doctorExitCode(report({ errors: 0, warnings: 3 }))).toBe(1);
    expect(doctorExitCode(report({ errors: 1, warnings: 0 }))).toBe(1);
    expect(doctorExitCode(report({ errors: 0, warnings: 0 }, "invalid"))).toBe(2);
  });

  it("forgives only warnings when allowWarnings is set", () => {
    expect(doctorExitCode(report({ errors: 0, warnings: 52 }), true)).toBe(0);
    expect(doctorExitCode(report({ errors: 1, warnings: 52 }), true)).toBe(1);
    expect(doctorExitCode(report({ errors: 0, warnings: 52 }, "invalid"), true)).toBe(2);
  });

  it("treats an invalid global integration as exit 2", () => {
    const value = report({ errors: 0, warnings: 0 });
    value.globalIntegrations = [{ status: "invalid" } as never];
    expect(doctorExitCode(value, true)).toBe(2);
  });
});
