import { describe, expect, it } from "vitest";

import { validateWorkflowBatchEnvelope } from "src/core/workflow/batch-validate.js";

describe("validateWorkflowBatchEnvelope", () => {
  it("accepts a complete envelope and returns it unchanged", () => {
    const envelope = {
      criteria: [{ id: "c1", text: "criterion" }],
      checks: [{ id: "k1" }],
      decisions: [{ id: "d1", text: "decision", rationale: "why" }],
      risks: [{ id: "r1", text: "risk" }],
      paths: { paths: ["src/a.ts"] },
      reason: "a reason that is long enough",
    };

    expect(validateWorkflowBatchEnvelope(envelope)).toBe(envelope);
  });

  it.each([null, undefined, "text", 3, ["list"]])("rejects the non-object envelope %j", (input) => {
    expect(() => validateWorkflowBatchEnvelope(input)).toThrow("valid JSON object envelope");
  });

  it("rejects unknown top-level fields, including the old top-level specs", () => {
    expect(() => validateWorkflowBatchEnvelope({ specs: [] })).toThrow("Unknown field in batch envelope: specs");
  });

  it.each([
    ["criteria", "Batch criteria must be an array."],
    ["checks", "Batch checks must be an array."],
    ["decisions", "Batch decisions must be an array."],
    ["risks", "Batch risks must be an array."],
  ])("rejects a non-array %s", (field, message) => {
    expect(() => validateWorkflowBatchEnvelope({ [field]: "nope" })).toThrow(message);
  });

  it("requires id, text and rationale strings on every decision", () => {
    expect(() => validateWorkflowBatchEnvelope({ decisions: [{ id: "d1", text: "t" }] })).toThrow(
      "Batch decision items require id, text, and rationale strings.",
    );
    expect(() => validateWorkflowBatchEnvelope({ decisions: [null] })).toThrow("Batch decision items require");
  });

  it("accepts only low, medium or high as a risk severity", () => {
    expect(() => validateWorkflowBatchEnvelope({ risks: [{ id: "r1", text: "t", severity: "high" }] })).not.toThrow();
    expect(() => validateWorkflowBatchEnvelope({ risks: [{ id: "r1", text: "t", severity: "severe" }] })).toThrow(
      "Batch risk severity must be low, medium or high.",
    );
  });

  it("requires id and text strings on every risk", () => {
    expect(() => validateWorkflowBatchEnvelope({ risks: [{ id: "r1" }] })).toThrow(
      "Batch risk items require id and text strings.",
    );
    expect(() => validateWorkflowBatchEnvelope({ risks: [{ id: 1, text: "t" }] })).toThrow("Batch risk items require");
  });

  it("rejects text containing the Unicode replacement character", () => {
    expect(() => validateWorkflowBatchEnvelope({ decisions: [{ id: "d1", text: "bad �", rationale: "r" }] })).toThrow();
  });
});
