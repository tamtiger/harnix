import { describe, expect, it } from "vitest";

import { searchRepoMap } from "src/core/repo-map/search.js";
import { createRepoMap } from "src/core/repo-map/store.js";
import { fixtureRecord } from "test/support/repo-map-fixtures.js";
import { activeTaskSignals, goldenQueries, queryCorpus } from "test/support/repo-map-query-fixtures.js";

describe("query relevance with an active task", () => {
  it.each(goldenQueries)("finds the expected file in the top three for %s", (query, expected) => {
    const paths = searchRepoMap(queryCorpus(), query, 3, activeTaskSignals).map((result) => result.path);

    expect(paths).toContain(expected);
  });

  it("returns nothing for a query that matches no file, instead of the task's own files", () => {
    expect(searchRepoMap(queryCorpus(), "zzzqqq nothing matches", 20, activeTaskSignals)).toEqual([]);
  });

  it("does not list a task file that the query does not match", () => {
    const paths = searchRepoMap(queryCorpus(), "mojibake", 20, activeTaskSignals).map((result) => result.path);

    expect(paths).toContain("src/core/workflow/text-integrity.ts");
    expect(paths).not.toContain("src/core/repo-map/graph.ts");
    expect(paths).not.toContain("src/commands/repo-map-internal.ts");
  });

  it("still favours a task file that the query matches", () => {
    const [first] = searchRepoMap(queryCorpus(), "buildRepoMapGraph", 5, activeTaskSignals);

    expect(first?.path).toBe("src/core/repo-map/graph.ts");
    expect(first?.reasons).toContain("task reference");
  });
});

describe("exact matches before fuzzy and prefix matches", () => {
  it("ranks a file with the exact name and leaves out prefix-only matches when an exact one exists", () => {
    const map = createRepoMap([
      fixtureRecord("src/exact.ts", { identifiers: ["fee"] }),
      fixtureRecord("src/feeds.ts", { identifiers: ["feeds"] }),
    ]);

    expect(searchRepoMap(map, "fee", 10).map((result) => result.path)).toEqual(["src/exact.ts"]);
  });

  it("falls back to prefix and fuzzy matches when nothing matches exactly", () => {
    const map = createRepoMap([fixtureRecord("src/feeds.ts", { identifiers: ["feeds"] })]);

    expect(searchRepoMap(map, "fee", 10).map((result) => result.path)).toEqual(["src/feeds.ts"]);
  });
});

describe("words inside names", () => {
  it("finds a camelCase identifier by one of its words", () => {
    const map = createRepoMap([fixtureRecord("src/holder.ts", { identifiers: ["buildSessionCacheKey"] })]);

    expect(searchRepoMap(map, "cache", 10).map((result) => result.path)).toEqual(["src/holder.ts"]);
  });

  it("finds a hyphenated file name by its words", () => {
    const map = createRepoMap([fixtureRecord("src/session-cache.ts")]);

    expect(searchRepoMap(map, "session cache", 10).map((result) => result.path)).toEqual(["src/session-cache.ts"]);
  });
});
