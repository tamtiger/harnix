import { describe, expect, it } from "vitest";

import {
  criteriaWithoutFocusedCheck,
  missingCriteriaInPlan,
  scanPlaceholders,
} from "src/core/workflow/ready-content.js";
import { buildCheck, buildCriterion, buildTaskV3 } from "test/support/builders.js";

function task(overrides: Parameters<typeof buildTaskV3>[0] = {}) {
  return buildTaskV3({
    acceptanceCriteria: [buildCriterion({ id: "ac-1", text: "one" }), buildCriterion({ id: "ac-2", text: "two" })],
    validationPlan: [
      buildCheck({ id: "suite", scope: "full", criterionIds: ["ac-1", "ac-2"] }),
      buildCheck({ id: "focus", scope: "focused", criterionIds: ["ac-1"] }),
    ],
    ...overrides,
  });
}

describe("scanPlaceholders", () => {
  it("blocks hard placeholder tokens with file and line", () => {
    const text = ["# Plan", "- [ ] TBD decide", "ok", "FIXME later", "what ???", "use <Placeholder> here", "TODO"].join(
      "\n",
    );

    const { issues } = scanPlaceholders("plan.md", text);

    expect(issues).toEqual([
      "plan.md:2 placeholder 'TBD'",
      "plan.md:4 placeholder 'FIXME'",
      "plan.md:5 placeholder '???'",
      "plan.md:6 placeholder '<placeholder>'",
      "plan.md:7 placeholder 'TODO'",
    ]);
  });

  it("ignores tokens inside inline code and fenced code, and lowercase words", () => {
    const text = [
      "- `TBD` is a token",
      "```",
      "TODO inside fence",
      "```",
      "~~~",
      "FIXME",
      "~~~",
      "todo tbd fixme",
    ].join("\n");

    expect(scanPlaceholders("plan.md", text)).toEqual({ issues: [], advisories: [] });
  });

  it("keeps line numbers after a fence and matches whole words only", () => {
    const text = ["```", "x", "```", "TBDX is fine, but TBD is not"].join("\n");

    expect(scanPlaceholders("prd.md", text).issues).toEqual(["prd.md:4 placeholder 'TBD'"]);
  });

  it("reports soft deferral phrases as advisories, with or without diacritics", () => {
    const text = [
      "Chúng ta sẽ quyết định sau.",
      "Tuỳ tình hình",
      "decide later please",
      "Handle appropriately",
      "xu ly phu hop",
    ];

    const { issues, advisories } = scanPlaceholders("plan.md", text.join("\n"));

    expect(issues).toEqual([]);
    expect(advisories).toEqual([
      "plan.md:1 deferred decision 'se quyet dinh sau'",
      "plan.md:2 deferred decision 'tuy tinh hinh'",
      "plan.md:3 deferred decision 'decide later'",
      "plan.md:4 deferred decision 'handle appropriately'",
      "plan.md:5 deferred decision 'xu ly phu hop'",
    ]);
  });

  it("returns nothing for clean text", () => {
    expect(scanPlaceholders("plan.md", "# Plan\n- [ ] slice one\n")).toEqual({ issues: [], advisories: [] });
  });
});

describe("missingCriteriaInPlan", () => {
  it("lists criterion ids that the plan never names", () => {
    expect(missingCriteriaInPlan(task(), "- [ ] S1 (ac-1)\n")).toEqual(["ac-2"]);
  });

  it("matches whole ids only and is case sensitive", () => {
    expect(missingCriteriaInPlan(task(), "ac-10 and xac-1 and AC-2 and ac-1x")).toEqual(["ac-1", "ac-2"]);
  });

  it("skips waived criteria", () => {
    const waived = task({
      acceptanceCriteria: [
        buildCriterion({ id: "ac-1", text: "one", status: "waived", waiverReason: "n/a" }),
        buildCriterion({ id: "ac-2", text: "two" }),
      ],
    });

    expect(missingCriteriaInPlan(waived, "ac-2")).toEqual([]);
  });
});

describe("criteriaWithoutFocusedCheck", () => {
  it("flags criteria covered only by a full-scope check", () => {
    expect(criteriaWithoutFocusedCheck(task())).toEqual(["ac-2"]);
  });

  it("does not count a focused check that is not required", () => {
    const optional = task({
      validationPlan: [buildCheck({ id: "focus", scope: "focused", required: false, criterionIds: ["ac-1", "ac-2"] })],
    });

    expect(criteriaWithoutFocusedCheck(optional)).toEqual(["ac-1", "ac-2"]);
  });

  it("is satisfied by a required focused check and skips waived criteria", () => {
    const covered = task({
      acceptanceCriteria: [
        buildCriterion({ id: "ac-1", text: "one" }),
        buildCriterion({ id: "ac-2", text: "two", status: "waived", waiverReason: "n/a" }),
      ],
    });

    expect(criteriaWithoutFocusedCheck(covered)).toEqual([]);
  });
});
