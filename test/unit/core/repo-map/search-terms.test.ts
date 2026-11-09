import { describe, expect, it } from "vitest";

import { normalizeTerm, splitIdentifierWords, terms } from "src/core/repo-map/search-terms.js";
import { fixtureRecord } from "test/support/repo-map-fixtures.js";

describe("splitIdentifierWords", () => {
  it.each([
    ["buildSessionCacheKey", ["build", "session", "cache", "key"]],
    ["HTMLParser", ["html", "parser"]],
    ["MAX_SESSION_SLOTS", ["max", "session", "slots"]],
    ["payServiceFee2Go", ["pay", "service", "fee", "2", "go"]],
    ["plain", ["plain"]],
  ])("splits %s into words", (name, expected) => {
    expect(splitIdentifierWords(name)).toEqual(expected);
  });
});

describe("terms", () => {
  it("adds the words of each identifier next to the identifier itself", () => {
    const text = terms(fixtureRecord("src/a.ts", { identifiers: ["readSessionCache"] }));

    expect(text).toContain("readSessionCache");
    expect(text).toContain("session");
    expect(text).toContain("cache");
  });
});

describe("normalizeTerm", () => {
  it("lowercases and keeps letters, digits, underscores and hyphens", () => {
    expect(normalizeTerm("Foo.Bar/Baz_qux-1")).toBe("foo bar baz_qux-1");
  });
});
