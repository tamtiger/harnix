import { describe, expect, it } from "vitest";

import { latestPassDurationMs } from "src/core/workflow/check-duration.js";
import { at, buildEvidence, buildTaskV3 } from "test/support/builders.js";

describe("latestPassDurationMs", () => {
  it("returns the duration of the newest passing run of the check", () => {
    const task = buildTaskV3({
      evidence: [
        buildEvidence({ id: "ev-1", recordedAt: at(1), durationMs: 900 }),
        buildEvidence({ id: "ev-2", recordedAt: at(5), durationMs: 400 }),
        buildEvidence({ id: "ev-3", recordedAt: at(3), durationMs: 700 }),
      ],
    });

    expect(latestPassDurationMs(task, "check")).toBe(400);
  });

  it("ignores failed runs, runs of another check and runs without a duration", () => {
    const task = buildTaskV3({
      evidence: [
        buildEvidence({ id: "ev-1", recordedAt: at(1), durationMs: 900 }),
        buildEvidence({ id: "ev-2", recordedAt: at(5), result: "fail", exitCode: 1, durationMs: 10 }),
        buildEvidence({ id: "ev-3", recordedAt: at(6), checkId: "other", durationMs: 20 }),
        buildEvidence({ id: "ev-4", recordedAt: at(7) }),
      ],
    });

    expect(latestPassDurationMs(task, "check")).toBe(900);
  });

  it("is undefined when no run recorded a duration", () => {
    expect(latestPassDurationMs(buildTaskV3({ evidence: [buildEvidence()] }), "check")).toBeUndefined();
  });
});
