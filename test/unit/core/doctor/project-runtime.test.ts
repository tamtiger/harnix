import { describe, expect, it } from "vitest";

import { inspectTrackedRuntimeFiles } from "src/core/doctor/project-runtime.js";
import type { DoctorFinding } from "src/core/doctor/findings.js";

describe("tracked runtime file diagnostics", () => {
  it("warns when the per-person active pointer is tracked by git", async () => {
    const findings: DoctorFinding[] = [];
    const seen: (readonly string[])[] = [];

    await inspectTrackedRuntimeFiles("/repo", findings, async (_root, args) => {
      seen.push(args);
      return ".harnix/tasks/.active\n";
    });

    expect(findings).toEqual([
      expect.objectContaining({ code: "active-pointer-tracked", severity: "warning", path: ".harnix/tasks/.active" }),
    ]);
    expect(seen).toEqual([["ls-files", "--", ".harnix/tasks/.active"]]);
  });

  it("stays silent when the pointer is not tracked or git cannot answer", async () => {
    const findings: DoctorFinding[] = [];

    await inspectTrackedRuntimeFiles("/repo", findings, async () => "");
    await inspectTrackedRuntimeFiles("/repo", findings, async () => {
      throw new Error("not a git repository");
    });

    expect(findings).toEqual([]);
  });
});
