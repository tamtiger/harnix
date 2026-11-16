import { describe, expect, it } from "vitest";
import { orderChecks } from "src/core/workflow/check-order.js";

const check = (id: string, scope: "focused" | "full") => ({ id, scope });
const run = (checkId: string, durationMs?: number, result: "pass" | "fail" = "pass") => ({
  checkId,
  result,
  ...(durationMs === undefined ? {} : { durationMs }),
});

describe("orderChecks", () => {
  it("keeps focused before full and declaration order when no duration is known", () => {
    const ordered = orderChecks([check("suite", "full"), check("a", "focused"), check("b", "focused")], []);
    expect(ordered.map(({ id }) => id)).toEqual(["a", "b", "suite"]);
  });

  it("runs the shorter check first inside a scope when every check in it has a duration", () => {
    const ordered = orderChecks(
      [check("slow", "focused"), check("fast", "focused"), check("suite", "full")],
      [run("slow", 9000), run("fast", 200)],
    );
    expect(ordered.map(({ id }) => id)).toEqual(["fast", "slow", "suite"]);
  });

  it("uses the latest recorded duration of a check", () => {
    const ordered = orderChecks(
      [check("a", "full"), check("b", "full")],
      [run("a", 100), run("b", 500), run("a", 900)],
    );
    expect(ordered.map(({ id }) => id)).toEqual(["b", "a"]);
  });

  it("keeps declaration order in a scope where any check has no duration yet", () => {
    const ordered = orderChecks([check("lint", "full"), check("suite", "full")], [run("suite", 120000), run("lint")]);
    expect(ordered.map(({ id }) => id)).toEqual(["lint", "suite"]);
  });

  it("never reorders across scopes however long the focused check takes", () => {
    const ordered = orderChecks(
      [check("quick", "full"), check("long", "focused")],
      [run("quick", 1), run("long", 99999)],
    );
    expect(ordered.map(({ id }) => id)).toEqual(["long", "quick"]);
  });

  it("ignores the duration of a failed run, so a fast crash never ranks a slow check first", () => {
    const ordered = orderChecks(
      [check("slow", "focused"), check("crashy", "focused")],
      [run("slow", 5000), run("crashy", 40, "fail")],
    );
    expect(ordered.map(({ id }) => id)).toEqual(["slow", "crashy"]);
  });

  it("uses the last passing duration even when a later run failed", () => {
    const ordered = orderChecks(
      [check("a", "full"), check("b", "full")],
      [run("a", 900), run("b", 500), run("a", 1, "fail")],
    );
    expect(ordered.map(({ id }) => id)).toEqual(["b", "a"]);
  });
});
