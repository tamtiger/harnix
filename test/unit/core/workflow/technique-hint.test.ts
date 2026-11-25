import { describe, expect, it } from "vitest";
import {
  needsSequentialThinking,
  SEQUENTIAL_MIN_CRITERIA,
  SEQUENTIAL_MIN_PATHS,
  TECHNIQUE_HINT,
} from "src/core/workflow/technique-hint.js";
import { buildCriterion, buildTaskV3 } from "test/support/builders.js";

function criteria(count: number) {
  return Array.from({ length: count }, (_, index) => buildCriterion({ id: `ac-${String(index + 1)}`, text: "done" }));
}

function paths(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `src/module-${String(index)}.ts`);
}

describe("technique hint", () => {
  it("is one fixed line that tells the agent how to load a suggested skill, with no per-skill command", () => {
    expect(TECHNIQUE_HINT).toContain("harnix skill <name> --raw");
    expect(TECHNIQUE_HINT).not.toContain("\n");
    expect(TECHNIQUE_HINT).not.toMatch(/harnix-[a-z]/u);
  });

  it("does not suggest sequential thinking for a plain Full task", () => {
    const task = buildTaskV3({ mode: "full", title: "Rename a helper", goal: "Keep names consistent" });

    expect(needsSequentialThinking(task)).toBe(false);
  });

  it.each([
    "Refactor the loader",
    "Đổi kiến trúc của lớp lưu trữ",
    "A complex merge",
    "Cân nhắc đánh đổi giữa hai cách",
  ])("suggests sequential thinking when the wording says so: %s", (title) => {
    expect(needsSequentialThinking(buildTaskV3({ title, goal: "x" }))).toBe(true);
  });

  it("suggests it from the number of criteria and of relevant paths, at the threshold and not below", () => {
    expect(needsSequentialThinking(buildTaskV3({ acceptanceCriteria: criteria(SEQUENTIAL_MIN_CRITERIA - 1) }))).toBe(
      false,
    );
    expect(needsSequentialThinking(buildTaskV3({ acceptanceCriteria: criteria(SEQUENTIAL_MIN_CRITERIA) }))).toBe(true);
    expect(needsSequentialThinking(buildTaskV3({ relevantPaths: paths(SEQUENTIAL_MIN_PATHS - 1) }))).toBe(false);
    expect(needsSequentialThinking(buildTaskV3({ relevantPaths: paths(SEQUENTIAL_MIN_PATHS) }))).toBe(true);
  });
});
