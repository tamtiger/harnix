import { describe, expect, it } from "vitest";

import { evidenceModeAdvisories } from "src/core/workflow/evidence-mode-advisory.js";
import { at, buildCheck, buildCriterion, buildEvidence, buildTaskV3 } from "test/support/builders.js";

function taskWith(summary: string, overrides: Parameters<typeof buildTaskV3>[0] = {}) {
  return buildTaskV3({
    status: "verifying",
    acceptanceCriteria: [buildCriterion({ id: "ac-1", text: "GET /orders trả HTTP 200", status: "met" })],
    validationPlan: [buildCheck({ id: "chk-1", criterionIds: ["ac-1"] })],
    evidence: [buildEvidence({ id: "ev-1", checkId: "chk-1", summary })],
    ...overrides,
  });
}

describe("evidenceModeAdvisories", () => {
  it("warns when the newest evidence of an observable criterion is code-only and no risk is recorded", () => {
    const [found] = evidenceModeAdvisories(taskWith("mode: code-only; chỉ chạy test mô hình"));

    expect(found).toContain("ac-1");
    expect(found).toContain("code-only");
    expect(found).toContain("--add-risk");
  });

  it("warns for partial in the same way", () => {
    expect(evidenceModeAdvisories(taskWith("mode: partial; thiếu trình duyệt"))).toHaveLength(1);
  });

  it("stays silent for full mode evidence", () => {
    expect(evidenceModeAdvisories(taskWith("mode: full; đã gọi endpoint thật"))).toEqual([]);
  });

  it("stays silent once the task records a residual risk", () => {
    const task = taskWith("mode: code-only", {
      residualRisks: [{ id: "risk-1", text: "Chưa chạy trình duyệt thật", severity: "low" }],
    });

    expect(evidenceModeAdvisories(task)).toEqual([]);
  });

  it("judges only the newest labeled evidence: a later full run clears an earlier code-only run", () => {
    const task = taskWith("mode: code-only", {
      evidence: [
        buildEvidence({ id: "ev-1", checkId: "chk-1", summary: "mode: code-only", recordedAt: at(10) }),
        buildEvidence({ id: "ev-2", checkId: "chk-1", summary: "mode: full", recordedAt: at(20) }),
      ],
    });

    expect(evidenceModeAdvisories(task)).toEqual([]);
  });

  it("ignores criteria that describe no observable behavior and evidence with no mode label", () => {
    const quiet = taskWith("mode: code-only", {
      acceptanceCriteria: [buildCriterion({ id: "ac-1", text: "Hàm làm tròn đến đồng gần nhất", status: "met" })],
    });

    expect(evidenceModeAdvisories(quiet)).toEqual([]);
    expect(evidenceModeAdvisories(taskWith("pnpm test passed"))).toEqual([]);
  });

  it("ignores waived criteria and failed evidence", () => {
    const waived = taskWith("mode: code-only", {
      acceptanceCriteria: [
        buildCriterion({
          id: "ac-1",
          text: "GET /orders trả HTTP 200",
          status: "waived",
          waiverReason: "không áp dụng",
        }),
      ],
    });
    const failed = taskWith("mode: code-only", {
      evidence: [buildEvidence({ id: "ev-1", checkId: "chk-1", summary: "mode: code-only", result: "fail" })],
    });

    expect(evidenceModeAdvisories(waived)).toEqual([]);
    expect(evidenceModeAdvisories(failed)).toEqual([]);
  });
});
