import { describe, expect, it } from "vitest";

interface Sizes {
  first: number;
  sameState: number;
  afterTransition: number;
  afterTitle: number;
  noteByDefault: boolean;
  noteWhenZero: boolean;
}

const { judge } = (await import(new URL("../../scripts/exercise-context-cost.mjs", import.meta.url).href)) as {
  judge(sizes: Sizes): string[];
};

const good: Sizes = {
  first: 640,
  sameState: 0,
  afterTransition: 0,
  afterTitle: 646,
  noteByDefault: true,
  noteWhenZero: false,
};

describe("scripts/exercise-context-cost.mjs", () => {
  it("passes when only the first turn and a real change print, and learningMax 0 hides the note", () => {
    expect(judge(good)).toEqual([]);
  });

  it("names each way the hook can cost too much or hide too much", () => {
    expect(judge({ ...good, first: 0 }).join("\n")).toContain("first turn printed nothing");
    expect(judge({ ...good, sameState: 640 }).join("\n")).toContain("unchanged second turn");
    expect(judge({ ...good, afterTransition: 640 }).join("\n")).toContain("only a status change");
    expect(judge({ ...good, afterTitle: 0 }).join("\n")).toContain("changed title");
    expect(judge({ ...good, noteByDefault: false }).join("\n")).toContain("did not show by default");
    expect(judge({ ...good, noteWhenZero: true }).join("\n")).toContain("learningMax 0");
  });
});
