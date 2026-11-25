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
    expect(seen).toEqual([["ls-files", "--", ".harnix/tasks/.active", ".harnix/cache"]]);
  });

  it("warns when files of the regenerable cache directory are tracked by git", async () => {
    const findings: DoctorFinding[] = [];
    const seen: (readonly string[])[] = [];

    await inspectTrackedRuntimeFiles("/repo", findings, async (_root, args) => {
      seen.push(args);
      return ".harnix/cache/repo-map-v1.json\n";
    });

    expect(findings).toEqual([
      expect.objectContaining({ code: "cache-tracked", severity: "warning", path: ".harnix/cache", fixable: false }),
    ]);
    expect(seen).toEqual([["ls-files", "--", ".harnix/tasks/.active", ".harnix/cache"]]);
  });

  it("prints the exact git command to run and only ever asks git to list files", async () => {
    const findings: DoctorFinding[] = [];
    const seen: (readonly string[])[] = [];

    await inspectTrackedRuntimeFiles("/repo", findings, async (_root, args) => {
      seen.push(args);
      return ".harnix/tasks/.active\n.harnix/cache/repo-map-v1.json\n";
    });

    const messages = Object.fromEntries(findings.map((item) => [item.code, item.message]));
    expect(messages["active-pointer-tracked"]).toContain("git rm --cached .harnix/tasks/.active");
    expect(messages["cache-tracked"]).toContain("git rm -r --cached .harnix/cache");
    // The ignore file is the user's once edited, so the hint says what the file needs and does not promise an update.
    expect(messages["cache-tracked"]).toContain("`/cache/` in .harnix/.gitignore");
    expect(messages["cache-tracked"]).toContain("add the line yourself");
    expect(messages["cache-tracked"]).not.toContain("harnix update");
    expect(messages["active-pointer-tracked"]).toContain("`tasks/.active` in .harnix/.gitignore");
    expect(messages["active-pointer-tracked"]).not.toContain("harnix update");
    for (const message of Object.values(messages)) {
      expect(message).not.toMatch(/[A-Za-z]:[\\/]/u);
    }
    expect(findings.map((item) => item.severity)).toEqual(["warning", "warning"]);
    expect(seen.every((args) => args[0] === "ls-files")).toBe(true);
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
