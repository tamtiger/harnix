import { describe, expect, it } from "vitest";

import {
  LEARNING_TTL_DAYS,
  createLearningCandidate,
  effectiveLearningStatus,
  isPromotionEligible,
  normalizeObservation,
  observationCandidateId,
  validateLearningCandidate,
} from "src/core/journal/learning.js";
import { at } from "test/support/builders.js";
import { buildLearningCandidate } from "test/support/learning-fixtures.js";

const day = 86_400_000;

describe("learning model", () => {
  it("accepts the draft and archived statuses when reading a candidate", () => {
    for (const status of ["draft", "candidate", "approved", "promoted", "rejected", "archived"] as const) {
      expect(validateLearningCandidate(buildLearningCandidate({ status })).status).toBe(status);
    }
    expect(() => validateLearningCandidate({ ...buildLearningCandidate(), status: "pending" })).toThrow(
      "Invalid learning candidate.",
    );
  });

  it("never treats a draft as promotion eligible, and keeps the candidate threshold unchanged", () => {
    const eligible = createLearningCandidate({
      id: "obs-1",
      statement: "s",
      sourceTaskIds: ["a", "b"],
      evidenceIds: ["e1", "e2"],
      status: "candidate",
    });

    expect(isPromotionEligible(eligible)).toBe(true);
    expect(isPromotionEligible({ ...eligible, status: "draft" })).toBe(false);
    expect(isPromotionEligible({ ...eligible, status: "archived" })).toBe(false);
    expect(isPromotionEligible({ ...eligible, sourceTaskIds: ["a"] })).toBe(false);
    expect(isPromotionEligible({ ...eligible, evidenceIds: ["e1"] })).toBe(false);
  });

  it("lapses an unpromoted draft or candidate strictly after the 28 day TTL", () => {
    const recorded = Date.parse(at(0));
    const ttl = LEARNING_TTL_DAYS * day;

    expect(LEARNING_TTL_DAYS).toBe(28);
    expect(effectiveLearningStatus("draft", at(0), recorded + ttl)).toBe("draft");
    expect(effectiveLearningStatus("candidate", at(0), recorded + ttl)).toBe("candidate");
    expect(effectiveLearningStatus("draft", at(0), recorded + ttl + 1)).toBe("archived");
    expect(effectiveLearningStatus("candidate", at(0), recorded + ttl + 1)).toBe("archived");
  });

  it("never lapses statuses a reviewer already decided, and ignores unreadable timestamps", () => {
    const later = Date.parse(at(0)) + 365 * day;

    for (const status of ["approved", "promoted", "rejected", "archived"] as const) {
      expect(effectiveLearningStatus(status, at(0), later)).toBe(status);
    }
    expect(effectiveLearningStatus("draft", "not a date", later)).toBe("draft");
  });

  it("recognises the same observation regardless of case, spacing and edge punctuation", () => {
    const variants = ["Use the fixed clock", "  use   THE fixed\tclock. ", "- use the fixed clock;"];

    expect(new Set(variants.map(normalizeObservation)).size).toBe(1);
    expect(new Set(variants.map(observationCandidateId)).size).toBe(1);
    expect(observationCandidateId(variants[0]!)).toMatch(/^obs-[0-9a-f]{16}$/u);
  });

  it("gives different observations different candidate IDs", () => {
    expect(observationCandidateId("Use the fixed clock")).not.toBe(observationCandidateId("Use the real clock"));
  });
});
