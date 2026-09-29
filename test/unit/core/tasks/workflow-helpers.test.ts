import { describe, expect, it } from "vitest";

import {
  assertExactFields,
  assertLegalTransition,
  canonicalizeJson,
  isMissing,
  isRecord,
  laterTimestamp,
  planHasChecklistItem,
  sameBytes,
  semanticJsonEqual,
  semanticTaskEqual,
  validateCancellationEnvelope,
  validateLearningEnvelope,
} from "src/core/tasks/workflow-helpers.js";
import { at, buildCheck, buildCriterion, buildTaskV3 } from "test/support/builders.js";

describe("workflow helpers", () => {
  it("detects a checklist item anywhere in a plan but not prose or bare brackets", () => {
    expect(planHasChecklistItem("# Plan\n- [ ] first step\n")).toBe(true);
    expect(planHasChecklistItem("intro\n  - [x] done step")).toBe(true);
    expect(planHasChecklistItem("- [ ]\n")).toBe(false);
    expect(planHasChecklistItem("Free-form text only.\n")).toBe(false);
  });

  it("keeps the later of two timestamps by absolute time, whatever their offsets", () => {
    expect(laterTimestamp("2026-09-29T09:00:00.000+07:00", "2026-09-29T01:00:00.000Z")).toBe(
      "2026-09-29T09:00:00.000+07:00",
    );
    expect(laterTimestamp(at(0), at(5))).toBe(at(5));
  });

  it("recognizes only ENOENT-shaped errors as missing files", () => {
    expect(isMissing(Object.assign(new Error("x"), { code: "ENOENT" }))).toBe(true);
    expect(isMissing(Object.assign(new Error("x"), { code: "EACCES" }))).toBe(false);
    expect(isMissing("ENOENT")).toBe(false);
    expect(isMissing(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord({})).toBe(true);
  });

  it("canonicalizes object key order recursively without reordering arrays", () => {
    const left = { b: 1, a: { d: [3, 2], c: 1 } };
    const right = { a: { c: 1, d: [3, 2] }, b: 1 };

    expect(JSON.stringify(canonicalizeJson(left))).toBe(JSON.stringify(right));
    expect(semanticJsonEqual(left, right)).toBe(true);
    expect(semanticJsonEqual({ a: [1, 2] }, { a: [2, 1] })).toBe(false);
  });

  it("treats criterion and check order as non-semantic when comparing task records", () => {
    const first = buildTaskV3({
      acceptanceCriteria: [buildCriterion({ id: "ac-a" }), buildCriterion({ id: "ac-b" })],
      validationPlan: [
        buildCheck({ id: "one", criterionIds: ["ac-a", "ac-b"] }),
        buildCheck({ id: "two", criterionIds: ["ac-a", "ac-b"] }),
      ],
    });
    const reordered = {
      ...first,
      acceptanceCriteria: [...first.acceptanceCriteria].reverse(),
      validationPlan: [...first.validationPlan].reverse(),
    };

    expect(semanticTaskEqual(first, reordered)).toBe(true);
    expect(semanticTaskEqual(first, { ...first, goal: "changed" })).toBe(false);
  });

  it("rejects unknown fields and compares byte arrays exactly", () => {
    expect(() => assertExactFields({ a: 1 }, new Set(["a"]), "Thing")).not.toThrow();
    expect(() => assertExactFields({ a: 1, b: 2 }, new Set(["a"]), "Thing")).toThrow("Thing contains an unknown");
    expect(sameBytes(undefined, undefined)).toBe(true);
    expect(sameBytes(undefined, new Uint8Array([1]))).toBe(false);
    expect(sameBytes(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true);
    expect(sameBytes(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(false);
  });

  it("allows a checkpoint change within a status, the replan re-entry to ready, and rejects other jumps", () => {
    const inProgress = buildTaskV3({ status: "in_progress", checkpoint: "implementing" });
    const replan = { ...inProgress, checkpoint: "replan" as const, updatedAt: at(1) };

    expect(() => assertLegalTransition(inProgress, replan)).not.toThrow();
    expect(() =>
      assertLegalTransition(replan, { ...replan, status: "ready", checkpoint: "ready", updatedAt: at(2) }),
    ).not.toThrow();
    expect(() =>
      assertLegalTransition(inProgress, { ...inProgress, status: "ready", checkpoint: "ready", updatedAt: at(2) }),
    ).toThrow(/transition/iu);
  });

  it("validates the cancellation and learning envelopes at the transport boundary", () => {
    expect(validateCancellationEnvelope({ reason: "Stop", authorizedBy: "user" })).toEqual({
      reason: "Stop",
      authorizedBy: "user",
    });
    expect(() => validateCancellationEnvelope({ reason: "Stop", authorizedBy: "agent" })).toThrow(/authorizedBy=user/u);
    expect(() => validateCancellationEnvelope(undefined)).toThrow(/cancellation/u);
    expect(validateLearningEnvelope({ candidate: { id: "l" } })).toEqual({ id: "l" });
    expect(() => validateLearningEnvelope({ candidate: {}, extra: 1 })).toThrow(/candidate/u);
    expect(() => validateLearningEnvelope({ candidate: "text" })).toThrow(/candidate/u);
  });
});
