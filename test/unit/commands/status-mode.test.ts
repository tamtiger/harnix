import { describe, expect, it } from "vitest";

import { resolveStatusMode } from "src/commands/status-mode.js";

describe("resolveStatusMode", () => {
  it("picks the projection from the flags, workspace first, then checks, criteria, summary and explain", () => {
    expect(resolveStatusMode({}, false)).toBe("plain");
    expect(resolveStatusMode({ explain: true }, false)).toBe("explain");
    expect(resolveStatusMode({ summary: true, explain: true }, false)).toBe("summary");
    expect(resolveStatusMode({ criteria: true }, false)).toBe("criteria");
    expect(resolveStatusMode({ checks: true }, false)).toBe("checks");
    expect(resolveStatusMode({ workspace: true }, false)).toBe("workspace");
    expect(resolveStatusMode({ workspace: "../sub" }, false)).toBe("workspace");
  });

  it("refuses a standalone projection combined with another option, naming them", () => {
    expect(() => resolveStatusMode({ workspace: true, checks: true }, false)).toThrow(
      "--workspace cannot be combined with --explain, --summary, --criteria, --checks or --limit.",
    );
    expect(() => resolveStatusMode({ checks: true, summary: true }, false)).toThrow(
      "--checks cannot be combined with --explain, --summary, --criteria or --limit.",
    );
    expect(() => resolveStatusMode({ criteria: true }, true)).toThrow(
      "--criteria cannot be combined with --explain, --summary or --limit.",
    );
  });
});
