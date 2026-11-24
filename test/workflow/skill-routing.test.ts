import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { suggestSkills } from "src/commands/skills-suggest.js";

interface RoutingCase {
  readonly query: string;
  readonly expect: string;
  readonly shouldTrigger: boolean;
}

interface RoutingFixture {
  readonly floors: { readonly hit1: number; readonly hit3: number; readonly falseTrigger: number };
  readonly cases: readonly RoutingCase[];
  readonly nonEmpty: readonly string[];
  readonly noMatch: readonly string[];
}

const fixture = JSON.parse(
  readFileSync(new URL("./skill-routing-cases.json", import.meta.url), "utf8"),
) as RoutingFixture;

const top = (query: string): string[] => suggestSkills(query).suggestions.map((suggestion) => suggestion.name);
const triggers = fixture.cases.filter((entry) => entry.shouldTrigger);
const nearMisses = fixture.cases.filter((entry) => !entry.shouldTrigger);
const ratio = (hits: number, total: number): number => (total === 0 ? 0 : hits / total);

const hit1 = ratio(triggers.filter((entry) => top(entry.query)[0] === entry.expect).length, triggers.length);
const hit3 = ratio(
  triggers.filter((entry) => top(entry.query).slice(0, 3).includes(entry.expect)).length,
  triggers.length,
);
const falseTrigger = ratio(
  nearMisses.filter((entry) => top(entry.query)[0] === entry.expect).length,
  nearMisses.length,
);

const misses = (): string =>
  triggers
    .filter((entry) => top(entry.query)[0] !== entry.expect)
    .map((entry) => `${entry.query} => ${top(entry.query).slice(0, 3).join(", ")} (wanted ${entry.expect})`)
    .join("\n");

describe("skill routing eval", () => {
  it("keeps the fixture meaningful: both kinds of case and every canonical skill family are present", () => {
    expect(triggers.length).toBeGreaterThanOrEqual(20);
    expect(nearMisses.length).toBeGreaterThanOrEqual(5);
    expect(new Set(triggers.map((entry) => entry.expect)).size).toBeGreaterThanOrEqual(14);
  });

  it("puts the expected skill first at or above the hit@1 floor", () => {
    expect(hit1, misses()).toBeGreaterThanOrEqual(fixture.floors.hit1);
  });

  it("keeps the expected skill within the first three at or above the hit@3 floor", () => {
    expect(hit3).toBeGreaterThanOrEqual(fixture.floors.hit3);
  });

  it("does not put the named skill first for a near-miss prompt more often than the floor allows", () => {
    expect(falseTrigger).toBeLessThanOrEqual(fixture.floors.falseTrigger);
  });

  it("suggests nothing for a prompt that has no relation to any skill", () => {
    for (const query of fixture.noMatch) {
      expect(top(query), query).toEqual([]);
    }
  });

  it("still suggests something for a word stem or an -ing form of a skill's own word", () => {
    for (const query of fixture.nonEmpty) {
      expect(top(query).length, query).toBeGreaterThan(0);
    }
  });

  it("keeps each floor close to what is measured, so an improvement raises the floor", () => {
    expect(hit1 - fixture.floors.hit1).toBeLessThanOrEqual(0.1);
    expect(hit3 - fixture.floors.hit3).toBeLessThanOrEqual(0.1);
  });
});
