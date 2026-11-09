import { describe, expect, it } from "vitest";

import { flagIssueError } from "src/core/workflow/flag-issues.js";

describe("flagIssueError", () => {
  it("keeps a single problem as it is and adds the corrected command", () => {
    const error = flagIssueError("workflow --set-check", ["--scope is required."], "harnix workflow --set-check x");

    expect(error.message).toBe("--scope is required.\nGợi ý: lệnh mẫu: harnix workflow --set-check x");
  });

  it("lists every problem in one message with the corrected command", () => {
    const error = flagIssueError("workflow --init", ["a is missing", "b is wrong"], "harnix workflow --init ...");

    expect(error.message).toContain("workflow --init has 2 problems");
    expect(error.message).toContain("- a is missing");
    expect(error.message).toContain("- b is wrong");
    expect(error.message).toContain("harnix workflow --init ...");
  });
});
