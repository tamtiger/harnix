import { describe, expect, it } from "vitest";

import { assertNewEvidenceNotFuture, EVIDENCE_CLOCK_SKEW_MS } from "src/core/workflow/evidence-time.js";

const NOW = Date.parse("2026-10-05T12:00:00.000Z");
const evidence = (id: string, recordedAt: string) => ({ id, recordedAt });

describe("assertNewEvidenceNotFuture", () => {
  it("accepts new evidence recorded in the past or within the clock skew", () => {
    const within = new Date(NOW + EVIDENCE_CLOCK_SKEW_MS).toISOString();

    expect(() =>
      assertNewEvidenceNotFuture([], [evidence("a", "2026-10-05T11:59:00.000Z"), evidence("b", within)], NOW),
    ).not.toThrow();
  });

  it("rejects new evidence recorded beyond the clock skew and names the item", () => {
    const future = new Date(NOW + EVIDENCE_CLOCK_SKEW_MS + 1).toISOString();

    expect(() => assertNewEvidenceNotFuture([], [evidence("late", future)], NOW)).toThrow(
      "Evidence late is recorded in the future",
    );
  });

  it("ignores evidence that is already persisted, so an old record never blocks a later save", () => {
    const future = "2099-01-01T00:00:00.000Z";

    expect(() => assertNewEvidenceNotFuture([{ id: "old" }], [evidence("old", future)], NOW)).not.toThrow();
  });

  it("treats an unparsable timestamp as invalid rather than as the past", () => {
    expect(() => assertNewEvidenceNotFuture([], [evidence("bad", "not-a-date")], NOW)).toThrow(
      "Evidence bad has an invalid recordedAt",
    );
  });
});
