import { describe, expect, it } from "vitest";

import { checksNotice } from "src/core/workflow/init-checks-notice.js";
import { buildCheck } from "test/support/builders.js";

const suite = buildCheck({ id: "check-suite", scope: "full", command: "pnpm test" });

describe("checksNotice", () => {
  it("lists each check with scope, command and cwd and marks the auto-generated one", () => {
    const text = checksNotice(
      [suite, buildCheck({ id: "chk-focus", command: "node a.js", cwd: "svc" })],
      "check-suite",
    );

    expect(text).toContain("check-suite (full, pnpm test) (auto-generated default)");
    expect(text).toContain("chk-focus (focused, node a.js, cwd svc)");
    expect(text).not.toContain("warning");
  });

  it("warns when a declared full check repeats the auto-generated suite command", () => {
    const duplicate = buildCheck({ id: "check-notifier-suite", scope: "full", command: "pnpm test" });

    expect(checksNotice([suite, duplicate], "check-suite")).toContain(
      "warning: check-notifier-suite runs the same command as the auto-generated check-suite",
    );
  });

  it("does not warn when nothing was auto-generated", () => {
    expect(checksNotice([suite], undefined)).not.toContain("warning");
  });
});
