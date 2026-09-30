import { describe, expect, it } from "vitest";

import { extractObservations, reviewNotes } from "src/core/journal/learning-notes.js";
import { buildTaskV1, buildTaskV3 } from "test/support/builders.js";

describe("learning review notes", () => {
  it("collects decision, residual risk and finding texts in that order", () => {
    const task = buildTaskV3({
      decisions: [{ id: "d1", text: "Decision text", rationale: "Why" }],
      residualRisks: [{ id: "r1", text: "Risk text", severity: "low" }],
      evidence: [
        {
          id: "e1",
          checkId: "check",
          recordedAt: "2026-09-29T09:10:00.000+07:00",
          result: "pass",
          exitCode: 0,
          summary: "ok",
          artifactPaths: [],
          findings: [{ id: "f1", severity: "low", text: "Finding text" }],
        },
      ],
    });

    expect(reviewNotes(task)).toEqual(["Decision text", "Risk text", "Finding text"]);
    expect(extractObservations(task)).toEqual(["Decision text", "Risk text", "Finding text"]);
  });

  it("yields nothing for a legacy v1 task or a task without notes", () => {
    expect(reviewNotes(buildTaskV1())).toEqual([]);
    expect(reviewNotes(buildTaskV3())).toEqual([]);
  });
});
