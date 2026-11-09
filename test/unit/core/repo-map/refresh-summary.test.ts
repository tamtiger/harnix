import { describe, expect, it } from "vitest";

import { summarizeSkipped } from "src/core/repo-map/refresh-summary.js";

describe("summarizeSkipped", () => {
  it("counts every skipped path but lists at most ten", () => {
    const skipped = Array.from({ length: 25 }, (_, i) => `assets/file-${String(i).padStart(2, "0")}.png`);

    const summary = summarizeSkipped(skipped);

    expect(summary.skippedTotal).toBe(25);
    expect(summary.skipped).toEqual(skipped.slice(0, 10));
    expect(summary.limitReached).toBe(false);
  });

  it("never names a credential file, yet still counts it", () => {
    const summary = summarizeSkipped([".env.custom", "secrets/db.secret.json", "docs/readme.png"]);

    expect(summary.skipped).toEqual(["docs/readme.png"]);
    expect(summary.skippedTotal).toBe(3);
  });

  it("reports the limit marker as a flag instead of a file name", () => {
    const summary = summarizeSkipped(["a.png", "limit"]);

    expect(summary.limitReached).toBe(true);
    expect(summary.skipped).toEqual(["a.png"]);
    expect(summary.skippedTotal).toBe(1);
  });
});
